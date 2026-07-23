import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fixturePath = process.argv[2];
if (!fixturePath) throw new Error('Fixture path is required');
const apiKey = process.env.OFFICE_API_KEY;
if (!apiKey) throw new Error('OFFICE_API_KEY is required');
const baseUrl = process.env.OFFICE_BASE_URL || 'http://127.0.0.1:4175';
const event = JSON.parse(await readFile(resolve(fixturePath), 'utf8'));
const response = await fetch(`${baseUrl}/api/v1/events`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-Correlation-ID': event.correlationId,
  },
  body: JSON.stringify(event),
});
const body = await response.json();
process.stdout.write(`${JSON.stringify({ httpStatus: response.status, correlationId: response.headers.get('x-correlation-id'), body })}\n`);
if (!response.ok) process.exitCode = 1;
