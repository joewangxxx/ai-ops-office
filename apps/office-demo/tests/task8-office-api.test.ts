import { describe, expect, it } from 'vitest';
import { createOfficeApiStore } from '../src/backend/viteOfficeApi';
import { submittedEvent } from './helpers/officeEventTestUtils';

const validSubmission = submittedEvent({
  id: 'task8-api-prd',
  title: 'Task 8 API PRD',
  eventId: 'task8-api-submitted',
});

describe('Task 8 office API validation', () => {
  it('accepts the standard artifact.submitted envelope', () => {
    const api = createOfficeApiStore();

    expect(api.handle('POST', '/api/business-events', validSubmission)).toMatchObject({
      status: 202,
      body: { snapshot: { artifacts: { 'task8-api-prd': { producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack' } } } },
    });
  });

  it.each([
    [{ ...validSubmission, payload: { ...validSubmission.payload, artifact: { ...validSubmission.payload.artifact, title: '   ' } } }, 400],
    [{ ...validSubmission, payload: { ...validSubmission.payload, artifact: { ...validSubmission.payload.artifact, category: 'memo' } } }, 400],
    [{ ...validSubmission, payload: { ...validSubmission.payload, producerDeskId: 'missing' } }, 404],
    [{ ...validSubmission, payload: { ...validSubmission.payload, producerDeskId: 'pm-cindy' } }, 409],
    [{ ...validSubmission, payload: { ...validSubmission.payload, producerDeskId: 'dev-jack', assigneeDeskId: 'qa-quinn' } }, 409],
  ] as const)('maps invalid submission %o to status %s', (event, status) => {
    const api = createOfficeApiStore();
    const result = api.handle('POST', '/api/business-events', event);

    expect(result.status).toBe(status);
    expect(result.body).toEqual({ error: expect.any(String) });
    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 0, artifacts: {} });
  });

  it('returns 409 when a different event reuses an Artifact ID', () => {
    const api = createOfficeApiStore();
    expect(api.handle('POST', '/api/business-events', validSubmission).status).toBe(202);
    const conflictingArtifact = {
      ...validSubmission,
      eventId: 'task8-api-other-event',
      correlationId: 'task8-api-other-event',
    };

    expect(api.handle('POST', '/api/business-events', conflictingArtifact)).toEqual({
      status: 409,
      body: { error: 'Artifact already exists: task8-api-prd' },
    });
  });

  it('keeps reset and internal motion confirmation on their event-driven endpoints', () => {
    const api = createOfficeApiStore();
    const submitted = api.handle('POST', '/api/business-events', validSubmission);
    const motionId = (submitted.body as { snapshot: { activeMotion: { id: string } } }).snapshot.activeMotion.id;

    expect(api.handle('POST', '/api/runtime-events', { type: 'motion.completed', motionId }).status).toBe(202);
    expect(api.handle('POST', '/api/business-events', {
      eventId: 'task8-api-reset',
      eventType: 'projection.reset',
      schemaVersion: '1.0',
      occurredAt: '2026-07-22T06:02:00.000Z',
      correlationId: 'task8-api-reset',
      source: { system: 'task8-test' },
      payload: { reason: 'manual-reset' },
    })).toMatchObject({ status: 202, body: { snapshot: { epoch: 1, revision: 1, activeMotion: null } } });
  });
});
