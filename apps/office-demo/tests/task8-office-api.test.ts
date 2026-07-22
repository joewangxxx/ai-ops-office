import { describe, expect, it } from 'vitest';
import { createOfficeApiStore } from '../src/backend/viteOfficeApi';

const validCompletion = {
  type: 'artifact.completed',
  artifact: { id: 'task8-api-prd', category: 'prd', title: 'Task 8 API PRD' },
  producerDeskId: 'pm-alice',
  assigneeDeskId: 'dev-jack',
};

describe('Task 8 office API validation', () => {
  it('accepts the standard artifact.completed payload', () => {
    const api = createOfficeApiStore();

    expect(api.handle('POST', '/api/office-events', validCompletion)).toMatchObject({
      status: 200,
      body: { artifacts: { 'task8-api-prd': { producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack' } } },
    });
  });

  it.each([
    [{ ...validCompletion, artifact: { ...validCompletion.artifact, title: '   ' } }, 400],
    [{ ...validCompletion, artifact: { ...validCompletion.artifact, category: 'memo' } }, 400],
    [{ ...validCompletion, producerDeskId: 'missing' }, 404],
    [{ ...validCompletion, producerDeskId: 'pm-cindy' }, 409],
    [{ ...validCompletion, producerDeskId: 'dev-jack', assigneeDeskId: 'qa-quinn' }, 409],
  ] as const)('maps invalid completion %o to status %s', (event, status) => {
    const api = createOfficeApiStore();
    const result = api.handle('POST', '/api/office-events', event);

    expect(result.status).toBe(status);
    expect(result.body).toEqual({ error: expect.any(String) });
    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 0, artifacts: {} });
  });

  it('returns 409 for a duplicate Artifact ID', () => {
    const api = createOfficeApiStore();
    expect(api.handle('POST', '/api/office-events', validCompletion).status).toBe(200);

    expect(api.handle('POST', '/api/office-events', validCompletion)).toEqual({
      status: 409,
      body: { error: 'Artifact already exists: task8-api-prd' },
    });
  });

  it('keeps reset and internal motion confirmation available outside the Event Console', () => {
    const api = createOfficeApiStore();
    const completed = api.handle('POST', '/api/office-events', validCompletion);
    const motionId = (completed.body as { activeMotion: { id: string } }).activeMotion.id;

    expect(api.handle('POST', '/api/office-events', { type: 'motion.completed', motionId }).status).toBe(200);
    expect(api.handle('POST', '/api/office-reset')).toMatchObject({ status: 200, body: { revision: 0, activeMotion: null } });
  });
});
