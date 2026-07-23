import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOfficeApiStore, officeApiPlugin } from '../src/backend/viteOfficeApi';
import { submittedEvent } from './helpers/officeEventTestUtils';

const submission = submittedEvent({
  id: 'search-prd-v1',
  title: 'Search PRD v1.0',
  producerDeskId: 'pm-bob',
  assigneeDeskId: 'dev-kara',
  eventId: 'task7-search-submitted',
});

const reset = {
  eventId: 'task7-reset',
  eventType: 'projection.reset',
  schemaVersion: '1.0',
  occurredAt: '2026-07-22T06:02:00.000Z',
  correlationId: 'task7-reset',
  source: { system: 'task7-test' },
  payload: { reason: 'manual-reset' },
};

afterEach(() => vi.useRealTimers());

describe('Task 7 development office API', () => {
  it('serves snapshots, accepts v1 events, and resets through the business event API', () => {
    const api = createOfficeApiStore();

    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 0, activeMotion: null });

    const accepted = api.handle('POST', '/api/business-events', submission);
    expect(accepted).toMatchObject({
      status: 202,
      body: { snapshot: { revision: 1, activeMotion: { deskId: 'pm-bob', pose: 'carry' } } },
    });

    expect(api.handle('POST', '/api/business-events', reset)).toMatchObject({
      status: 202,
      body: { snapshot: { revision: 1, activeMotion: null, motionQueue: [] } },
    });
  });

  it.each([
    [{ ...submission, payload: { ...submission.payload, artifact: { ...submission.payload.artifact, title: '   ' } } }, 400],
    [{ ...submission, eventId: 'missing-desk', correlationId: 'missing-desk', payload: { ...submission.payload, assigneeDeskId: 'missing-desk' } }, 404],
    [{ ...submission, eventId: 'offline-desk', correlationId: 'offline-desk', payload: { ...submission.payload, assigneeDeskId: 'dev-mia' } }, 409],
  ] as const)('returns a stable domain error for %o', (event, expectedStatus) => {
    const api = createOfficeApiStore();
    const response = api.handle('POST', '/api/business-events', event);

    expect(response.status).toBe(expectedStatus);
    expect(response.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 0, activeMotion: null });
  });

  it('returns 404 for unknown API routes and exposes a Vite development plugin', () => {
    const api = createOfficeApiStore();
    expect(api.handle('GET', '/api/unknown')).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(officeApiPlugin()).toMatchObject({ name: 'office-api', apply: 'serve', configureServer: expect.any(Function) });
  });

  it('uses a server fallback timer to finish active motion without a browser', () => {
    vi.useFakeTimers();
    const api = createOfficeApiStore();
    api.handle('POST', '/api/business-events', submission);

    vi.advanceTimersByTime(10_000);

    expect(api.handle('GET', '/api/office-state').body).toMatchObject({
      activeMotion: null,
      artifacts: { 'search-prd-v1': { location: 'hub', status: 'Awaiting Acceptance' } },
    });
  });

  it('cancels the old fallback timer when the v1 projection reset starts a new epoch', () => {
    vi.useFakeTimers();
    const api = createOfficeApiStore();
    api.handle('POST', '/api/business-events', submission);
    api.handle('POST', '/api/business-events', reset);

    vi.advanceTimersByTime(10_000);

    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ epoch: 1, revision: 1, activeMotion: null, artifacts: {} });
  });
});
