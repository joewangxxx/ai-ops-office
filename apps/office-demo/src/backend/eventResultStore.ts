export type SanitizedEventResult = {
  timestamp: string;
  eventId: string;
  eventType: string;
  sourceSystem: string;
  correlationId: string;
  result: 'accepted' | 'duplicate' | 'rejected';
  reasonCode?: string;
};

export interface EventResultStore {
  record(result: SanitizedEventResult): void;
  recent(limit: number): SanitizedEventResult[];
}

export function createEventResultStore(capacity = 100): EventResultStore {
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Event result capacity must be a positive integer');
  let results: SanitizedEventResult[] = [];
  return {
    record(result) {
      results.push(structuredClone(result));
      if (results.length > capacity) results = results.slice(-capacity);
    },
    recent(limit) {
      const bounded = Number.isFinite(limit) ? Math.max(0, Math.min(capacity, Math.floor(limit))) : 0;
      return results.slice(-bounded).map((result) => structuredClone(result));
    },
  };
}
