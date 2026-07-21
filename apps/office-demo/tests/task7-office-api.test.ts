import { describe, expect, it } from 'vitest';
import { createOfficeApiStore, officeApiPlugin } from '../src/backend/viteOfficeApi';

const completion = {
  type: 'artifact.completed',
  artifact: { id: 'search-prd-v1', category: 'prd', title: 'Search PRD v1.0' },
  producerDeskId: 'pm-bob',
  assigneeDeskId: 'dev-kara',
};

describe('Task 7 development office API', () => {
  it('serves snapshots, accepts events, and resets the in-memory state', () => {
    const api = createOfficeApiStore();

    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 0, activeMotion: null });

    const accepted = api.handle('POST', '/api/office-events', completion);
    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({ revision: 1, activeMotion: { deskId: 'pm-bob', pose: 'carry' } });

    const reset = api.handle('POST', '/api/office-reset');
    expect(reset.status).toBe(200);
    expect(reset.body).toMatchObject({ revision: 0, activeMotion: null, motionQueue: [] });
  });

  it.each([
    [{ type: 'artifact.completed' }, 400],
    [{ ...completion, assigneeDeskId: 'missing-desk' }, 404],
    [{ ...completion, assigneeDeskId: 'dev-mia' }, 409],
  ] as const)('returns a stable domain error for %o', (event, expectedStatus) => {
    const api = createOfficeApiStore();
    const response = api.handle('POST', '/api/office-events', event);

    expect(response.status).toBe(expectedStatus);
    expect(response.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 0, activeMotion: null });
  });

  it('returns 404 for unknown API routes and exposes a Vite development plugin', () => {
    const api = createOfficeApiStore();
    expect(api.handle('GET', '/api/unknown')).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(officeApiPlugin()).toMatchObject({ name: 'office-api', apply: 'serve', configureServer: expect.any(Function) });
  });
});
