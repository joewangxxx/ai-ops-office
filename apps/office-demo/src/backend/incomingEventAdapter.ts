import { parseBusinessEventEnvelope, type BusinessEvent, type BusinessEventEnvelope } from './businessEvents';

export type AdapterContext = {
  sourceSystem: string;
  warn?: (reasonCode: string) => void;
};

export interface IncomingEventAdapter<TInput> {
  readonly sourceSystem: string;
  canHandle(input: unknown): input is TInput;
  toBusinessEvent(input: TInput, context: AdapterContext): BusinessEventEnvelope<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

export class CanonicalEventAdapter implements IncomingEventAdapter<Record<string, unknown>> {
  readonly sourceSystem = 'canonical-v1';

  canHandle(input: unknown): input is Record<string, unknown> {
    return isRecord(input) && input.schemaVersion === '1.0' && typeof input.eventType === 'string';
  }

  toBusinessEvent(input: Record<string, unknown>, context: AdapterContext): BusinessEvent {
    const event = parseBusinessEventEnvelope(input);
    if (event.source.system !== context.sourceSystem) context.warn?.('source_overridden');
    return { ...event, source: { ...event.source, system: context.sourceSystem } };
  }
}
