# Skylark Intelligence

A founder-facing conversational business-intelligence agent for monday.com Deals and Work Orders. It reads both boards dynamically, normalizes messy fields, performs deterministic analysis, and explains exclusions and data-quality caveats with every answer.

- **Hosted prototype:** [skylark-intelligence-kohl.vercel.app](https://skylark-intelligence-kohl.vercel.app)
- **Source repository:** [Kalyan-4406/skylark-intelligence1](https://github.com/Kalyan-4406/skylark-intelligence1)

## Assignment coverage

| Requirement | Implementation |
| --- | --- |
| Monday.com integration | Read-only, versioned GraphQL API access with cursor pagination across separate Deals and Work Orders boards. |
| Data resilience | Canonical normalization for inconsistent dates, numbers, names, statuses, and probabilities; unusable values remain null and are excluded only from affected metrics. |
| Query understanding | OpenAI selects from a constrained tool schema when configured; a deterministic router provides fallback behavior and asks a focused clarification when intent is ambiguous. |
| Business intelligence | Deterministic pipeline, sector, owner, delivery, billing, collections, receivables, and cross-board analysis. |
| Leadership updates | On-demand Markdown brief with executive summary, pipeline highlights, delivery risks, observations, caveats, and follow-ups. |
| Safe failures | Authentication, network, GraphQL, rate-limit, configuration, and analysis failures return generic responses without credentials or upstream bodies. |

## What it answers

- Pipeline volume, value, weighted value, status, stage, sector, and owner questions.
- Delayed work orders, execution health, billing, collections, and receivables.
- High-confidence cross-board summaries using exact normalized deal names.
- Text-based leadership updates with pipeline highlights, delivery risks, observations, caveats, and follow-ups.

Example prompts:

- `How is our energy-sector pipeline looking?`
- `Which work orders are delayed?`
- `Compare deals with their linked work orders.`
- `Generate a leadership update.`
- `Show receivables and collections by sector.`

## Architecture

```text
Browser chat workspace
  -> POST /api/chat
  -> intent planner (OpenAI when configured; deterministic fallback otherwise)
  -> typed deterministic analytics tools
  -> canonical normalization + quality report
  -> read-only monday.com GraphQL adapter
       -> Deals board
       -> Work Orders board
```

The model selects an allowed analysis intent; it never calculates metrics or sends arbitrary GraphQL. All filters, arithmetic, exclusions, and cross-board linkage are performed by tested TypeScript code. Secrets remain in server-only environment variables.

## Requirements

- Node.js 20.9 or newer.
- A monday.com personal/API token with read access to both boards.
- Board IDs for Deals and Work Orders.
- Optional OpenAI API key. Without it, the deterministic conversational router remains functional.

## monday.com board setup

1. Create separate `Deals` and `Work Orders` boards.
2. Import `Deal funnel Data.xlsx` into Deals. Use `Deal Name` as the item-name column.
3. Import `Work_Order_Tracker Data.xlsx` into Work Orders. Its real header is the second spreadsheet row; use `Deal name masked` as the item-name column.
4. Preserve the remaining spreadsheet headers as monday column titles. Date-like columns should be Date, currency/amount columns Numbers, statuses Status or Text, and codes/text fields Text.
5. Copy each board ID from its monday.com URL or API playground.
6. Create a token under monday.com Developer/API settings and grant only the workspace/board access needed for reads.

The adapter maps fields by column title rather than generated monday column IDs. Unknown columns are ignored; missing expected columns become quality limitations rather than fabricated values.

## Configuration

Copy `.env.example` to `.env.local` and choose exactly one source mode.

### Production monday.com mode

```dotenv
DATA_SOURCE=monday
MONDAY_API_TOKEN=your_token
MONDAY_DEALS_BOARD_ID=123456789
MONDAY_WORK_ORDERS_BOARD_ID=987654321
OPENAI_API_KEY=your_optional_key
OPENAI_MODEL=gpt-5-mini
BUSINESS_TIMEZONE=Asia/Kolkata
```

Production mode always queries monday.com dynamically through GraphQL API version `2026-07`. It performs no mutations.

The hosted prototype is configured for live Monday.com production mode. Workbook data is not bundled into the hosted runtime.

### Local workbook demo mode

```dotenv
DATA_SOURCE=demo
DEMO_DEALS_FILE=Deal funnel Data.xlsx
DEMO_WORK_ORDERS_FILE=Work_Order_Tracker Data.xlsx
```

Demo mode is explicit and visibly labeled in the interface. The workbook files are ignored by Git and are never bundled as production records.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Safe readiness metadata is available at `/api/health`.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm audit --omit=dev
```

The E2E test starts the app in explicit demo mode, loads the supplied workbooks, runs pipeline and leadership prompts, and verifies desktop/mobile layouts. Unit tests use synthetic records rather than hardcoded assignment data.

## Deploy to Vercel

1. Push the repository to a Git provider and import it into Vercel, or run `vercel link`.
2. Add `DATA_SOURCE=monday`, the monday token, both board IDs, timezone, and optional OpenAI variables in Vercel Project Settings. Mark tokens sensitive and scope them to the required environments.
3. Deploy a preview with `vercel deploy`.
4. Test `/api/health`, pipeline, work-order, linkage, and leadership prompts on the preview.
5. Promote the verified preview using `vercel promote <preview-url>` or deploy with `vercel --prod`.

Do not commit `.env.local`, `.vercel/project.json`, tokens, or workbook exports. A fresh hosted deployment requires a Vercel account plus live monday.com credentials and board IDs.

For a fresh deployment, verify that `/api/health` reports `dataSource: "monday"` before sharing the URL.

## Error behavior

- Missing/invalid fields are excluded only from affected calculations and counted in caveats.
- Negative financial values are preserved and flagged for review.
- API authentication, network, GraphQL, rate-limit, configuration, and analysis failures return safe messages without tokens or upstream bodies.
- Cross-board analysis never uses fuzzy guessing. Unmatched counts are disclosed.

## Known limitations

- The boards do not share an immutable deal ID, so cross-board linkage uses exact deal-name equality after trimming and case normalization.
- Column mapping uses visible monday.com titles for portability; renamed expected columns appear as quality limitations until mappings are updated.
- Quarter wording currently resolves to the available open-pipeline view rather than a configurable fiscal calendar.
- The prototype does not include scheduled reports, presentation export, per-user authentication, or long-term snapshot storage.

## Deliverables

- **Hosted prototype:** [skylark-intelligence-kohl.vercel.app](https://skylark-intelligence-kohl.vercel.app)
- **Decision Log:** [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md)
- **Architecture and setup instructions:** this README.
- **Source archive:** generated locally as `Skylark-Intelligence-Submission.zip`.

## Submission archive

The submission archive is intentionally not committed. Generate `Skylark-Intelligence-Submission.zip` from tracked source after running all verification commands. It must exclude `.git`, `.env.local`, dependencies, build/test output, source workbooks, Vercel metadata, and other secrets.

## Key files

- `lib/monday/`: versioned read-only GraphQL transport and board pagination.
- `lib/domain/`: canonical models and clean-and-fallback normalization.
- `lib/analytics/`: deterministic BI tools and exact linkage.
- `lib/agent/`: intent planning, safe fallback routing, and answer formatting.
- `components/chat/`: responsive conversational interface.
- `docs/DECISION_LOG.md`: assignment decision log.
- `docs/verification/FIDELITY_LEDGER.md`: visual verification evidence.
