# Monday.com Business Intelligence Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a deployable conversational BI agent that reads Deals and Work Orders dynamically from monday.com, computes auditable metrics, and explains data-quality limitations.

**Architecture:** A Next.js App Router application keeps secrets and analysis server-side. A typed monday.com adapter maps dynamic board rows into canonical models, deterministic tools perform arithmetic and caveat tracking, and an OpenAI-compatible orchestrator selects tools and narrates their results for a focused chat UI.

**Tech Stack:** Node.js 20.9+, Next.js App Router, React, TypeScript, Zod, official OpenAI SDK, Vitest, Testing Library, Playwright, ESLint, plain CSS.

**Spec:** `docs/superpowers/specs/2026-08-30-monday-bi-agent-design.md`

## Global Constraints

- Production reads both monday.com boards dynamically through read-only GraphQL queries and performs no writes.
- Secrets remain server-side; `.env*` is ignored except `.env.example`.
- Deterministic code performs filtering, grouping, arithmetic, exclusions, and linkage.
- Missing or invalid values are never guessed and affected exclusions are disclosed.
- Cross-board analysis uses exact case/whitespace-normalized deal names only; no fuzzy matching.
- Leadership updates are text/Markdown only.
- Spreadsheet loading is an explicitly selected development adapter, never the silent production default.

---

## File Structure

- `app/`: page, layout, global design system, and `/api/chat`, `/api/health` routes.
- `components/chat/`: focused chat workspace and Markdown response rendering.
- `lib/config.ts`: validated server configuration and safe public status.
- `lib/domain/`: canonical records, quality metadata, normalization, and linkage.
- `lib/monday/`: GraphQL transport, board pagination, and column mapping.
- `lib/demo/`: development-only spreadsheet adapter.
- `lib/analytics/`: filters, metric tools, leadership update, and tool registry.
- `lib/agent/`: intent schema, deterministic fallback routing, OpenAI orchestration, and answer formatting.
- `tests/`: synthetic unit, integration, route, and component fixtures/tests.
- `e2e/`: core browser workflow.
- `docs/DECISION_LOG.md`, `README.md`: assignment deliverables.

---

### Task 1: Project Foundation and Validated Configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `.env.example`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `lib/config.ts`
- Test: `tests/config.test.ts`

**Interfaces:**
- Produces: `getServerConfig(env?: NodeJS.ProcessEnv): ServerConfig`, `getConfigurationStatus(): ConfigurationStatus`.

- [ ] **Step 1: Write a failing configuration test** covering missing production monday variables, an explicitly enabled demo mode, defaults for model/timezone, and safe status with no secret values.
- [ ] **Step 2: Run `npm test -- tests/config.test.ts`** and verify failure because `lib/config.ts` is absent.
- [ ] **Step 3: Scaffold Next.js and implement Zod configuration** with `DATA_SOURCE=monday|demo`, `MONDAY_API_TOKEN`, `MONDAY_DEALS_BOARD_ID`, `MONDAY_WORK_ORDERS_BOARD_ID`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `BUSINESS_TIMEZONE`.
- [ ] **Step 4: Add scripts** for `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, and `test:e2e`; add a minimal accessible page shell.
- [ ] **Step 5: Run the focused test, typecheck, and lint** and verify all pass.
- [ ] **Step 6: Commit** with `chore: scaffold BI agent application`.

### Task 2: Canonical Models and Clean-and-Fallback Normalization

**Files:**
- Create: `lib/domain/types.ts`, `lib/domain/quality.ts`, `lib/domain/normalize.ts`
- Test: `tests/domain/normalize.test.ts`, `tests/fixtures/synthetic-records.ts`

**Interfaces:**
- Produces: `normalizeDeal(raw: RawRecord, index: number): Normalized<Deal>`, `normalizeWorkOrder(raw: RawRecord, index: number): Normalized<WorkOrder>`, `mergeQuality(...reports): QualityReport`.

- [ ] **Step 1: Write failing table-driven tests** for trimming, duplicated headers, date parsing, numeric/currency parsing, probability/status normalization, missing values, invalid dates, and negative-value anomaly preservation.
- [ ] **Step 2: Run `npm test -- tests/domain/normalize.test.ts`** and confirm the missing-module failure.
- [ ] **Step 3: Define canonical types** for deals, work orders, normalized results, field issues, severity, exclusions, and source provenance.
- [ ] **Step 4: Implement the minimum normalization functions** so each parse returns a value or a structured issue and raw values remain available for evidence.
- [ ] **Step 5: Run normalization tests, typecheck, and lint** and verify passes.
- [ ] **Step 6: Commit** with `feat: add resilient business data normalization`.

### Task 3: Read-Only monday.com Board Adapter

**Files:**
- Create: `lib/data-source.ts`, `lib/monday/client.ts`, `lib/monday/boards.ts`, `lib/monday/mapper.ts`
- Create: `app/api/health/route.ts`
- Test: `tests/monday/client.test.ts`, `tests/monday/mapper.test.ts`, `tests/api/health.test.ts`

**Interfaces:**
- Produces: `BusinessDataSource.loadSnapshot(): Promise<BusinessSnapshot>`, `MondayClient.query<T>(query: string, variables: object): Promise<T>`, `createMondayDataSource(config): BusinessDataSource`.

- [ ] **Step 1: Write failing transport tests** for Authorization/API-Version headers, GraphQL errors, HTTP failures, timeout, and cursor pagination using mocked `fetch`.
- [ ] **Step 2: Write failing mapping tests** using synthetic monday item/column fixtures and titles/aliases expected from the supplied sheets.
- [ ] **Step 3: Run the focused tests** and confirm missing implementations.
- [ ] **Step 4: Implement the GraphQL transport and paginated `items_page` board query** using query operations only.
- [ ] **Step 5: Implement metadata-driven column mapping and normalization** for both boards; unknown columns are ignored and missing required columns become quality issues.
- [ ] **Step 6: Implement `/api/health`** returning safe configuration/source readiness without tokens.
- [ ] **Step 7: Run focused tests, typecheck, and lint** and verify passes.
- [ ] **Step 8: Commit** with `feat: read and map monday boards`.

### Task 4: Development Spreadsheet Adapter

**Files:**
- Create: `lib/demo/xlsx-source.ts`
- Test: `tests/demo/xlsx-source.test.ts`

**Interfaces:**
- Produces: `createSpreadsheetDataSource(paths): BusinessDataSource` selected only when `DATA_SOURCE=demo`.

- [ ] **Step 1: Write a failing adapter test** using a tiny generated workbook fixture and assert both sheets map through the same canonical normalizers.
- [ ] **Step 2: Run the test** and confirm the missing adapter failure.
- [ ] **Step 3: Implement explicit XLSX loading** with first-row/header detection, keeping input files external to the production bundle.
- [ ] **Step 4: Add source factory selection** that throws when monday mode lacks credentials and visibly marks demo snapshots.
- [ ] **Step 5: Run focused tests, typecheck, and lint** and verify passes.
- [ ] **Step 6: Commit** with `feat: add explicit local demo data source`.

### Task 5: Deterministic Analytics and Exact Linkage

**Files:**
- Create: `lib/analytics/types.ts`, `lib/analytics/filters.ts`, `lib/analytics/pipeline.ts`, `lib/analytics/operations.ts`, `lib/analytics/linkage.ts`, `lib/analytics/leadership.ts`, `lib/analytics/registry.ts`
- Test: `tests/analytics/pipeline.test.ts`, `tests/analytics/operations.test.ts`, `tests/analytics/linkage.test.ts`, `tests/analytics/leadership.test.ts`

**Interfaces:**
- Produces: `runAnalyticsTool(name: ToolName, input: ToolInput, snapshot: BusinessSnapshot): AnalyticsResult`, `linkDealsToWorkOrders(...): LinkageResult`, `generateLeadershipUpdate(...): AnalyticsResult`.

- [ ] **Step 1: Write failing pipeline tests** for counts, total value, disclosed Low/Medium/High weights, periods, sector/owner/stage groups, and excluded values/probabilities.
- [ ] **Step 2: Write failing operations tests** for overdue rules, execution groups, billed/unbilled/receivable/collected summaries, GST labels, and negative anomalies.
- [ ] **Step 3: Write failing linkage tests** for exact case/whitespace matches, duplicates as aggregates, unmatched counts, and rejection of fuzzy/owner-only matches.
- [ ] **Step 4: Write a failing leadership test** asserting all six brief sections and data-quality caveats.
- [ ] **Step 5: Run the focused tests** and confirm failures.
- [ ] **Step 6: Implement filters and the typed tool registry** using reusable inclusion/exclusion accounting.
- [ ] **Step 7: Implement primary, secondary, linkage, and leadership tools** with deterministic Markdown-ready evidence.
- [ ] **Step 8: Run all analytics tests, typecheck, and lint** and verify passes.
- [ ] **Step 9: Commit** with `feat: add auditable BI analytics tools`.

### Task 6: Conversational Orchestration and API Route

**Files:**
- Create: `lib/agent/types.ts`, `lib/agent/router.ts`, `lib/agent/openai.ts`, `lib/agent/answer.ts`
- Create: `app/api/chat/route.ts`
- Test: `tests/agent/router.test.ts`, `tests/agent/answer.test.ts`, `tests/api/chat.test.ts`

**Interfaces:**
- Produces: `answerBusinessQuestion(request, dependencies): Promise<ChatResponse>` and POST `/api/chat` accepting `{messages: ChatMessage[]}`.

- [ ] **Step 1: Write failing routing tests** for pipeline, operations, cross-board, leadership, and ambiguous prompts that require one clarification.
- [ ] **Step 2: Write failing answer tests** asserting conclusion, evidence, caveat counts, source freshness/mode, and suggested follow-ups.
- [ ] **Step 3: Write failing route tests** for schema validation, request limits, safe upstream errors, and successful responses.
- [ ] **Step 4: Run the focused tests** and confirm failures.
- [ ] **Step 5: Implement a deterministic keyword fallback router** so the demo remains testable without an LLM key.
- [ ] **Step 6: Implement optional OpenAI Responses orchestration** constrained to the typed tool registry; it may select/describe tools but never calculate or run arbitrary GraphQL.
- [ ] **Step 7: Implement answer formatting and the POST route** with validation, timeout propagation, and sanitized error codes.
- [ ] **Step 8: Run agent/route tests, typecheck, and lint** and verify passes.
- [ ] **Step 9: Commit** with `feat: add conversational BI orchestration`.

### Task 7: Founder-Focused Chat Interface

**Files:**
- Modify: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`
- Create: `components/chat/chat-workspace.tsx`, `components/chat/message.tsx`, `components/chat/composer.tsx`, `components/chat/suggestions.tsx`, `components/chat/source-status.tsx`
- Test: `tests/components/chat-workspace.test.tsx`

**Interfaces:**
- Consumes: POST `/api/chat`, GET `/api/health`.
- Produces: accessible chat flow with suggestion and leadership actions.

- [ ] **Step 1: Write failing component tests** for welcome suggestions, sending, loading, response Markdown, clarification continuation, error recovery, and keyboard labels.
- [ ] **Step 2: Run the focused test** and confirm component failures.
- [ ] **Step 3: Implement the chat workspace** with local conversation state, abortable requests, suggestions, source status, and a visible demo badge.
- [ ] **Step 4: Implement the visual system** as an open, responsive executive workspace with restrained header, readable evidence tables, focus states, and reduced motion.
- [ ] **Step 5: Run component tests, typecheck, lint, and production build** and verify passes.
- [ ] **Step 6: Commit** with `feat: build founder BI chat experience`.

### Task 8: Documentation, Deployment, and End-to-End Verification

**Files:**
- Create: `README.md`, `docs/DECISION_LOG.md`, `vercel.json`, `playwright.config.ts`, `e2e/chat.spec.ts`
- Modify: `.env.example`, `.gitignore`, `package.json`

**Interfaces:**
- Produces: complete assignment documentation, hosted deployment configuration, and verified submission workflow.

- [ ] **Step 1: Write the E2E test** that opens the app, runs a suggested pipeline query, verifies evidence/caveats, generates a leadership update, and checks a mobile viewport.
- [ ] **Step 2: Run it against the dev server** and fix only observed workflow or responsive failures.
- [ ] **Step 3: Write README** with architecture, monday board import/column configuration, environment setup, demo/production separation, test commands, deployment, security, and ZIP instructions.
- [ ] **Step 4: Write the two-page-or-shorter Decision Log** covering assumptions, verified data fields, scope trade-offs, clean-and-fallback, exact linkage, leadership interpretation, and improvements with more time.
- [ ] **Step 5: Add Vercel configuration** and document the environment variables required for a hosted link; do not claim a deployment without credentials and a successful deploy.
- [ ] **Step 6: Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e`** and retain outputs.
- [ ] **Step 7: Inspect desktop and mobile screenshots** for layout, copy, typography, palette, spacing, source status, caveats, and core interaction state; fix visible issues and rerun affected checks.
- [ ] **Step 8: Create the submission ZIP** excluding `.git`, `.env*`, dependencies, build output, and the original datasets; verify its contents.
- [ ] **Step 9: Commit** with `docs: complete assignment delivery and verification`.

---

## Verification Matrix

- monday.com connection: Tasks 3 and 8.
- Conversational loop and clarification: Tasks 6 and 7.
- Data resilience and caveats: Tasks 2, 3, 5, and 6.
- Primary/secondary BI: Task 5.
- High-confidence linkage: Task 5 and Decision Log in Task 8.
- Leadership update: Tasks 5–7.
- Hosted prototype readiness: Task 8; actual link requires deployment credentials/authorization.
- Source ZIP, README, Decision Log: Task 8.
