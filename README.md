# AI Ops Office

An interactive 2D pixel-office demo that visualizes Human + AI agent collaboration and artifact-based handoffs across PM, Dev, and QA teams.

## Highlights

- A visual office map for PM, Dev, QA, and a central Artifact Hub
- Human avatars and AI-agent status indicators
- Artifact-based handoffs: PRD → Feature → Test Report
- Contextual inspector panel and guided demo story controls

## Run locally

```bash
cd apps/office-demo
npm install
npm run dev
```

## Verify

```bash
cd apps/office-demo
npm test
npm run build
```

## Project structure

- `apps/office-demo/` — React + Vite interactive demo
- `docs/` — product design, layout, and implementation documentation
- `images/` — source visual assets
