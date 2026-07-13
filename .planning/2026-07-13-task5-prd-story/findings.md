# Findings — Task 5 PRD handoff story

- Task 4.1 left a layered desk composition (`chair back -> at-desk avatar -> desk front`) and a data-driven Hub screen in place.
- `visualSeatCenterSource` and `seatAnchor` are presently identical to visual foot/avatar anchors and must be independently calibrated at Gate 0.
- The existing `handoffAnchors.pmToHubToDev` is a mixed route; Task 5 will replace it with producer and consumer data while retaining discrete Hub artifact points.
- Gate 0 final anchors use per-sprite seat source points rather than their foot/shadow points. PM/Dev moved only slightly toward the keyboard plane; QA moved upward enough that Quinn/Rita hands no longer fall below the desk edge. The browser audit is `apps/office-demo/screenshots/task5-gate0-seated-audit.png`.
- The story is represented by nine immutable state frames. Each frame carries actor pose/target coordinate, PRD location, both Orb states, notification/Coding flags, Hub counts, newest Handoffs, and an optional route motion descriptor.
- Hub and Inspector values are projected from the same frame through `storyScenarioForState`, so components do not carry state-specific business conditions.
- Browser state checks confirmed: ready Hub `PRD 1`; pm-delivering swaps Alice to a single carry sprite; stored updates Hub to `PRD 2`; only dev-notified has `收到 PRD`; dev-received exposes Jack's input artifact; dev-coding has a blue Jack Orb and `Coding...`.
