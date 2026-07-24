# Findings

## Existing Product State

- Task 9 至 Task 14 established versioned business events, role-specific Artifact
  evidence, JSONL ledger recovery, SSE projection, standalone Event Gateway, and
  internal diagnostics.
- The completed baseline cleanup removed legacy Story playback and legacy event
  endpoints. The current product is an event-driven projection, not an animation player.
- The current React app still combines Office Map and Inspector in one route.
- The current Inspector contains Inspect, Event Console, and Diagnostics views.
- Event Console already owns structured Artifact submission and assignment behavior.
- Diagnostics already has internal, sanitized runtime endpoints.

## Product Decisions

- `/office` answers “what is happening now” and remains read-only.
- `/ops` answers “what event should the system receive” and “is the system healthy”.
- Counts are derived from the Projection. Operators do not edit counts.
- People pages may initiate standard commands, but cannot edit employee status,
  presence, Active Work, or Agent activity directly.
- Accept is a standard `artifact.accepted` business event and remains separate from
  submission/assignment.
- Presence is read-only in this milestone; no new presence mutation event is introduced.
- Internal tools are unavailable in public mode.

## Proposed Route Model

```text
/office
/ops
/ops/dispatch
/ops/people
/ops/artifacts
/ops/events
/ops/system
```

## Implementation Bias

- Prefer a small pathname-based router over adding a runtime dependency.
- Reuse one backend client and Projection source; do not create a second state model.
- Migrate/refactor Event Console and Diagnostics rather than duplicating them.
- Use internal read models for paginated Artifact and event tables.
- Keep raw evidence, secrets, authorization headers, and absolute paths out of
  diagnostics and event summaries.

