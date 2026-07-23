import type { OfficeSnapshot } from './officeDomain';

export type ProjectionStreamMessage = {
  epoch: number;
  revision: number;
  sequence: number;
  snapshot: OfficeSnapshot;
};

export interface ProjectionPublisher {
  publish(message: ProjectionStreamMessage): void;
  subscribe(listener: (message: ProjectionStreamMessage) => void): () => void;
  latest(): ProjectionStreamMessage;
  replayAfter(cursor: string): ProjectionStreamMessage[];
}

const messageId = (message: ProjectionStreamMessage) => `${message.epoch}:${message.revision}`;

export function createProjectionPublisher(initial: ProjectionStreamMessage, capacity = 100): ProjectionPublisher {
  let current = structuredClone(initial);
  let buffer = [structuredClone(initial)];
  const listeners = new Set<(message: ProjectionStreamMessage) => void>();

  return {
    publish(message) {
      current = structuredClone(message);
      buffer.push(structuredClone(message));
      if (buffer.length > capacity) buffer = buffer.slice(-capacity);
      for (const listener of [...listeners]) listener(structuredClone(message));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    latest() { return structuredClone(current); },
    replayAfter(cursor) {
      const index = buffer.findIndex((message) => messageId(message) === cursor);
      if (index < 0 || buffer[index]!.epoch !== current.epoch) return [structuredClone(current)];
      return buffer.slice(index + 1).map((message) => structuredClone(message));
    },
  };
}
