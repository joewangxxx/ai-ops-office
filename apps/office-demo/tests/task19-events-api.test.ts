import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { InMemoryEventLedger } from '../src/backend/eventLedger'
import { InMemoryProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore'
import type { GatewayConfig } from '../server/config'
import { createOfficeGateway, type OfficeGateway } from '../server/gateway'

const gateways: OfficeGateway[] = []
const directories: string[] = []

afterEach(async () => {
  await Promise.all(gateways.splice(0).map((gateway) => gateway.close()))
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

async function startGateway(internalMode = true) {
  const directory = await mkdtemp(join(tmpdir(), 'office-events-'))
  directories.push(directory)
  const distDirectory = join(directory, 'dist')
  await mkdir(distDirectory, { recursive: true })
  await writeFile(join(distDirectory, 'index.html'), '<html><body>Office</body></html>', 'utf8')
  const config: GatewayConfig = { host: '127.0.0.1', port: 0, dataDirectory: join(directory, '.data'), apiClientsFile: join(directory, 'clients.json'), corsOrigins: [], operationsConsoleEnabled: internalMode, maxBodyBytes: 262_144, rateLimitCapacity: 50, rateLimitRefillPerSecond: 50, distDirectory }
  const gateway = createOfficeGateway({ config, clients: [], persistence: { ledger: new InMemoryEventLedger(), snapshotStore: new InMemoryProjectionSnapshotStore() } })
  gateways.push(gateway)
  return { gateway, origin: (await gateway.start()).origin }
}

describe('Task 19 event outcomes API', () => {
  it('returns accepted, duplicate, and persisted rejected outcomes without payloads', async () => {
    const { gateway, origin } = await startGateway()
    const event = {
      eventId: 'events-api-submission', eventType: 'artifact.submitted', schemaVersion: '1.0', occurredAt: '2026-07-24T10:00:00.000Z', correlationId: 'events-api-chain', source: { system: 'operations-dispatch' },
      payload: { artifact: { id: 'events-api-prd', category: 'prd', title: 'Events API PRD', evidence: { kind: 'prd', summary: 'Private evidence must never leave this list endpoint.', priority: 'P1', scope: ['Events'], userStories: [{ id: 'US-1', statement: 'Audit outcomes.' }], acceptanceCriteria: ['List sanitized rows.'] } }, producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack' },
    }
    expect((await gateway.api.handleAsync('POST', '/api/business-events', event)).status).toBe(202)
    expect((await gateway.api.handleAsync('POST', '/api/business-events', event)).status).toBe(200)
    const conflict = structuredClone(event)
    conflict.payload.artifact.title = 'Conflicting title'
    expect((await gateway.api.handleAsync('POST', '/api/business-events', conflict)).status).toBe(409)
    await gateway.api.recordRejected({ eventId: 'rejected-event', eventType: 'artifact.submitted', correlationId: 'rejected-chain', source: { system: 'fixture' } }, 'validation_rejected', 'payload includes secret /absolute/path', { secret: 'never return me' })

    const internal = { Origin: origin }
    const all = await fetch(`${origin}/api/internal/events`, { headers: internal })
    expect(all.status).toBe(200)
    const page = await all.json() as { items: Array<Record<string, unknown>> }
    expect(page.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ eventId: 'events-api-submission', result: 'accepted' }),
      expect.objectContaining({ eventId: 'events-api-submission', result: 'duplicate' }),
      expect.objectContaining({ eventId: 'events-api-submission', result: 'rejected', reasonCode: 'event_conflict' }),
      expect.objectContaining({ eventId: 'rejected-event', result: 'rejected', reasonCode: 'validation_rejected' }),
    ]))
    expect(JSON.stringify(page.items)).not.toMatch(/acceptanceCriteria|secret|absolute.path/i)
    expect((await fetch(`${origin}/api/internal/events?result=invalid`, { headers: internal })).status).toBe(400)
    const { origin: publicOrigin } = await startGateway(false)
    expect((await fetch(`${publicOrigin}/api/internal/events`, { headers: { Origin: publicOrigin } })).status).toBe(404)
  })
})
