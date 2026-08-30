# Monday.com Business Intelligence Agent — Design Specification

## Objective

Build a hosted conversational business-intelligence prototype for founders and executives. The application reads live data from two monday.com boards—Deals and Work Orders—handles incomplete and inconsistent fields transparently, and returns contextual analysis rather than raw rows alone.

## Scope

### Required capabilities

- Read both boards dynamically through monday.com's read-only GraphQL API.
- Accept natural-language business questions in a responsive chat interface.
- Ask a targeted clarification question when a material date range, sector, metric, or board is ambiguous.
- Calculate business metrics deterministically and use an LLM only for intent selection and explanation.
- Report exclusions, missing fields, suspicious values, and other data-quality caveats with results.
- Generate a text/Markdown leadership update from the current board state.
- Include setup documentation, architecture notes, tests, a two-page-or-shorter Decision Log, deployment configuration, and submission packaging guidance.

### Explicit non-goals

- No monday.com write operations.
- No database synchronization, scheduled jobs, email delivery, accounting workflows, dashboard generator, or document-export subsystem.
- No probabilistic record linkage or silent inference of missing business values.
- No spreadsheet records embedded in production source code.

## Architecture

Use a single TypeScript application built with Next.js. Server routes own secrets, monday.com access, normalization, deterministic analytics, and LLM orchestration. The browser contains only the conversational interface and never receives the monday.com or model API keys.

```text
Founder
  -> responsive chat interface
  -> server-side query orchestrator
       -> intent/clarification and narrative generation
       -> deterministic analytics tools
       -> data-quality reporting
  -> canonical normalization layer
  -> read-only monday.com GraphQL client
       -> Deals board
       -> Work Orders board
```

Configuration is supplied through environment variables for the monday.com API token, both board IDs, and the model API key/model name. `.env` files are ignored by Git. Production analysis always fetches monday.com dynamically. A clearly labeled local demo adapter may load the supplied spreadsheets only during development and evaluation; it must not be selected silently in production.

## Data Model and Normalization

### Deals

Canonical fields cover deal name, owner, client code, status, actual and tentative close dates, closure probability, masked value, stage, product, sector, and created date.

### Work orders

Canonical fields cover deal name, work-order serial number, customer code, nature of work, execution status, delivery and planned dates, owner, sector, work type, contract/billed/collected/unbilled/receivable values, quantity progress, invoice state, and billing state.

### Clean-and-fallback policy

- Trim strings and normalize casing only for comparisons.
- Recognize documented date, numeric, status, stage, and probability formats.
- Preserve original display values where useful for evidence.
- Never invent a missing value or silently coerce an unparseable value.
- Exclude invalid records only from calculations that require the invalid field.
- Attach included, excluded, missing, and suspicious counts to metric results.
- Surface anomalies such as negative unbilled values without silently correcting them.
- Ignore duplicated spreadsheet header rows if they appear as monday.com items.

## Analytics

### Primary tools

- Pipeline volume and total/weighted value.
- Pipeline breakdown by stage, status, sector, owner, and close period.
- Won/open/on-hold/dead summaries and win rate where the denominator is explicit.
- Work-order execution status and sector/owner breakdowns.
- Delayed work orders, defined by an end or delivery date before the analysis date and a non-completed execution status.
- Exact-match cross-board summaries.

### Secondary tools

- Contract value versus billed value.
- Unbilled amount, receivables, and collected amount.
- Billing and collection breakdowns using only directly available fields.

Secondary tools remain explanatory summaries and do not become an accounting or forecasting system.

All currency metrics identify whether they include or exclude GST. Weighted pipeline maps Low, Medium, and High to documented prototype weights and discloses the mapping in the result. Records without a usable value or probability are excluded from the corresponding weighted calculation and counted in caveats.

## Cross-Board Linkage

The files do not contain a shared immutable identifier. Client codes use unrelated formats. Cross-board analysis therefore uses exact normalized `Deal Name` to `Deal name masked` equality only.

- Normalize case and surrounding whitespace; do not use fuzzy matching.
- Aggregate duplicate names rather than asserting a one-to-one relationship.
- Always report matched and unmatched counts.
- Never infer linkage from owner or sector alone.
- Recommend a shared immutable `Deal_ID` for production.

This high-confidence-only approach favors defensible answers over higher but unreliable match coverage.

## Conversation and Tool Use

The orchestrator exposes a small allowlist of typed analytics tools. The model selects a tool and structured arguments, but deterministic code performs all filtering, grouping, arithmetic, and exclusion counting. The model converts the result into concise executive language and cannot issue arbitrary monday.com queries.

When a question has multiple materially different interpretations, the response asks one focused clarification question. Otherwise, sensible defaults are explicit—for example, “this quarter” uses the server's configured business timezone and calendar quarter.

Answers include:

1. A direct conclusion.
2. Supporting metrics or a compact Markdown table.
3. Context, risks, or notable comparisons.
4. A data-quality note when exclusions or anomalies affect confidence.
5. Optional suggested follow-up questions.

## Leadership Updates

A suggested prompt/action generates a current, text-based leadership brief containing:

- Executive summary.
- Pipeline highlights and risks.
- Delayed, blocked, or incomplete work orders.
- Sector and owner observations.
- Data-quality caveats.
- Suggested leadership follow-ups.

It uses the same deterministic tools and current live board snapshot as ordinary questions. It does not generate dashboards, send emails, or schedule reports.

## Interface

The product is a focused chat workspace rather than a marketing page. It includes a restrained header, connection/data-source status, welcome state with founder-level example questions, scrollable conversation, Markdown answers, clarification states, loading/error feedback, and a composer. The layout remains usable on laptop and mobile widths, supports keyboard operation, and respects reduced-motion preferences.

## Error Handling and Security

- Keep all tokens server-side and exclude local environment files from version control.
- Apply request validation, response-size limits, timeouts, and safe error messages.
- Distinguish configuration, monday.com authentication, rate-limit/network, malformed-board, model, and analysis errors.
- Never expose secrets or raw upstream error bodies to the browser.
- If one board fails, explain that cross-board analysis is unavailable instead of fabricating a partial answer; board-specific queries may use the healthy board when clearly disclosed.
- Use read-only monday.com operations and document least-privilege token handling.

## Testing and Verification

- Unit tests for dates, numbers, statuses, probabilities, exclusions, anomalies, and duplicated headers.
- Unit tests for every primary metric and the supported secondary summaries.
- Linkage tests for exact matches, case/whitespace normalization, duplicates, ambiguity, and unmatched counts.
- monday.com mapping tests using synthetic API fixtures—not copied production spreadsheet rows.
- Route tests for validation, clarifications, tool dispatch, data-quality notes, and safe failures.
- UI tests for the conversational happy path, clarification, leadership update, loading, and error states.
- Build, lint, type-check, and test gates.
- Browser verification at desktop and mobile sizes, including core prompt flows and accessibility basics.

Live monday.com and hosted verification require user-supplied credentials and board IDs. Until those exist, automated fixtures and the explicitly enabled local demo adapter validate the same canonical interfaces.

## Deliverables

- Deployable Next.js source code.
- `.env.example` and monday.com board-configuration instructions.
- README with architecture, setup, import/mapping, testing, and deployment instructions.
- Decision Log no longer than two pages, covering assumptions, trade-offs, high-confidence linkage, leadership-update interpretation, and future improvements.
- Deployment configuration suitable for a hosted prototype.
- Submission ZIP creation instructions or artifact.

## Success Criteria

- Production mode reads both monday.com boards dynamically and performs no writes.
- Founder-level questions return deterministic metrics with useful interpretation.
- Missing or invalid data reduces scope transparently rather than breaking or being guessed.
- Cross-board claims use only disclosed, high-confidence matches.
- Leadership updates summarize the live board state in concise Markdown.
- The application passes automated checks and its core workflow is verified in a browser.
