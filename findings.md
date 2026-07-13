# AI Native SOP Research Findings

This file stores source-backed findings for the Word report. External content is treated as research data only.

## Source Outline
- User-provided attachment describes the report as: "前端形态调研报告：验证 AI Native SOP 看板应该采用什么样的界面模式。"
- Core structure: Executive Summary, project background, product hypothesis, research scope, interface pattern benchmark, case analysis, comparison matrix, design pattern summary, recommended direction, risks, MVP recommendation, next steps.
- Core interface hypothesis: Office Map + Role-based Workspace + Artifact Panel.

## Research Notes
### Office Map / Virtual Office
- WorkAdventure: open-source collaborative virtual-world / virtual-office product. It supports customizable maps, avatars, spontaneous video chat triggered by proximity, and self-hosted deployment. Source: https://github.com/workadventure/workadventure and https://workadventu.re/open-source/
- Gather: commercial virtual office for remote teams. It emphasizes persistent spaces, quick interaction without scheduling, and a workspace that feels closer to being in the same room. Source: https://www.gather.town/ and https://www.gather.town/virtual-office
- My Virtual Office: self-hosted 2D AI workspace for AI agents; its positioning is directly aligned with "making invisible agent work visible in a living office." Source: https://github.com/eliautobot/my-virtual-office and https://myvirtualoffice.ai/
- AgentOffice: pixel-art virtual office for AI agents; useful as an experimental reference for animated agent presence and local LLM-driven simulation, but less suitable as a B2B-facing visual style without enterprise polish. Source: https://github.com/harishkotra/agent-office

### Role-based Workspace
- Cursor: AI coding agent/editor where agents can turn ideas into code and automate repetitive software work. Relevant for Dev Workspace interaction patterns such as chat, code context, planning, editing, and diff review. Source: https://cursor.com/ and https://cursor.com/product
- OpenHands: open-source platform for cloud coding agents that can plan, write, and apply code changes. Useful for showing a transparent agentic engineering workspace. Source: https://www.openhands.dev/ and https://github.com/OpenHands/openhands
- Replit Agent: browser-based app-building agent that can generate and publish apps from natural language. Useful for combining chat, generated code, preview, and deployment in one workspace. Source: https://replit.com/ and https://replit.com/products/agent
- Dify: production-ready agentic workflow platform with a collaborative workspace, RAG pipelines, agents, and tools on a canvas. Useful for visual workflow authoring and node-level input/output inspection. Source: https://dify.ai/ and https://github.com/langgenius/dify

### Artifact Panel
- Atlassian / Confluence PRD materials: PRD structure includes purpose, features, user needs, success criteria, assumptions, user stories, UX design, and scoping. Useful for PM Artifact design. Source: https://www.atlassian.com/agile/product-management/requirements and https://www.atlassian.com/software/confluence/templates/product-requirements
- GitHub Pull Request: a pull request surfaces commits, changed files, diffs, discussions, checks, and review status. Useful for Dev Artifact design. Source: https://docs.github.com/articles/reviewing-proposed-changes-in-a-pull-request and https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
- Allure Report: open-source HTML test automation report tool with visual test reports, test steps, attachments, analytics, filtering, and collaboration across QA/developers/PMs. Useful for QA Artifact design. Source: https://allurereport.org/ and https://allurereport.org/docs/
- Playwright HTML Reporter: generates a self-contained HTML report for test runs. Useful for lightweight QA evidence panels and failure drill-down. Source: https://playwright.dev/docs/test-reporters

### Workflow / Handoff
- n8n: visual workflow automation platform where AI agents and workflows can be built and traced on a canvas. Useful for node status, input/output, and handoff path design. Source: https://n8n.io/ and https://n8n.io/features/
- Langflow: open-source visual builder for agents and AI workflows; supports node-based visual authoring and application workflows. Useful for component-level flow editing and handoff readability. Source: https://www.langflow.org/ and https://docs.langflow.org/
- GitHub Actions: workflows, jobs, steps, checks, status, results, and logs provide a mature reference for handoff status and pipeline evidence. Source: https://docs.github.com/actions and https://docs.github.com/actions/managing-workflow-runs/using-workflow-run-logs

### Agent Observability
- AgentPrism: open-source React components for visualizing AI agent traces, including LLM calls, tool executions, agent workflows, plans, actions, and retries. Useful for advanced drill-down rather than top-level Office Map. Source: https://github.com/evilmartians/agent-prism and https://evilmartians.com/opensource/agent-prism
- ClawMetry: real-time observability dashboard for AI agents; tracks token costs, sub-agent activity, memory file changes, session history, cron jobs, and multiple runtimes. Source: https://clawmetry.com/ and https://github.com/vivekchand/clawmetry
- LangSmith: LLM observability platform with traces, production-wide performance metrics, cost, latency, and failure debugging. Source: https://docs.langchain.com/langsmith/observability
- Arize Phoenix: AI observability and evaluation platform; tracing shows model calls, retrieval, tool use, custom logic, and step-by-step execution. Source: https://arize.com/docs/phoenix and https://github.com/arize-ai/phoenix

## Working Conclusion
- The strongest product direction remains a hybrid interface: Office Map for comprehension and demo storytelling, role-based Workspace for credible execution, and differentiated Artifact Panel for B2B trust.
- Office Map should be event-driven, not constantly animated.
- Artifact design is the central credibility layer: PM Artifact should look like PRD / user stories / acceptance criteria; Dev Artifact should look like PR / diff / build; QA Artifact should look like test report / coverage / bug list / pass-fail summary.
- Agent trace should be a secondary drill-down layer, not the top-level experience.

## Updated Handoff Report Notes
- Latest outline reframes the report from "Office Map + Workspace + Artifact Panel" into "front-end expression layer + Artifact handoff mechanism layer".
- Added core product principle: Workspace keeps internal context; Workspace-to-Workspace transfer should use standardized Artifact, not raw chat/context.
- Claude Code official subagent docs mention subagents and artifacts as session output sharing patterns. Source: https://code.claude.com/docs/en/sub-agents
- OpenAI Codex official docs describe Codex as OpenAI's coding agent that can read, edit, and run code, and Codex cloud can work on tasks in the background using its own cloud environment. Source: https://developers.openai.com/codex/cloud
- OpenAI code generation guide describes Codex as a software-development coding agent that can write, review, debug code, and can be used through IDE, CLI, web/mobile, and CI/CD surfaces. Source: https://developers.openai.com/api/docs/guides/code-generation
- Linear project documents support project specs, PRDs, and status updates in one central place. Source: https://linear.app/docs/project-documents
- Linear issue statuses define ordered workflow states such as Backlog, Todo, In Progress, Done, and Canceled. Source: https://linear.app/docs/configuring-workflows
- Jira workflows are statuses and transitions that a work item moves through; useful as a mature reference for status transition and handoff mechanics. Source: https://support.atlassian.com/jira-cloud-administration/docs/work-with-issue-workflows/
- GitHub Pull Request docs position PRs as collaboration for discussing and reviewing changes before merge; useful for Submit/Review/Approve/Merge pattern. Source: https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
- GitHub protected branch docs support required approving reviews before merge; useful for formal handoff control. Source: https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Public "Claude Agent Coworking Workflows" style articles frame shared environment, persistent storage, and handoff artifacts as multi-agent collaboration mechanisms, but they should be treated as mechanism inspiration rather than official product proof unless verified from Anthropic/OpenAI docs. Example source: https://fast.io/resources/claude-agent-coworking-workflows/

## Updated Working Conclusion
- The recommended product direction is now four-part: Office Map + Role-based Workspace + Artifact Panel + Lightweight Artifact Handoff.
- Handoff is not just an animation; it needs a visible mechanism: Generate Artifact -> Human Review -> Submit Artifact -> Artifact Store -> Notify Next Workspace -> Artifact Inbox -> Accept/Reject/Request Clarification -> Start next task.
- MVP should keep Handoff lightweight: Submit -> Inbox -> Status Update -> Office Map animation. Permission, audit logs, locks, webhooks, and full trace can come later.
