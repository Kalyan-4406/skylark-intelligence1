# Decision Log

## Objective and assumptions

I interpreted the assignment as a decision-support prototype, not a general-purpose data platform. The primary user is a founder or executive who wants a defensible answer quickly and needs to understand when imperfect data lowers confidence. The two monday.com boards remain the system of record; the application performs read-only analysis and does not synchronize them into another database.

The supplied files contain 346 deal rows and 176 work-order rows before exclusions. They exhibit the intended real-world problems: duplicated headers, missing close dates and values, mixed text/date/number formats, inconsistent status labels, and suspicious negative billing balances. I assumed Indian rupees and the `Asia/Kolkata` business timezone because the work-order fields explicitly name rupees and the assignment context is Indian. Currency answers state whether values include or exclude GST.

## Technical choices and trade-offs

I chose a single Next.js TypeScript application. This keeps the hosted prototype, server routes, secrets, UI, tests, and deployment in one artifact. A separate API service or synchronized database would be appropriate at larger scale, but would add infrastructure, stale-data behavior, and operational work without improving this prototype’s core evaluation.

The production adapter calls monday.com’s read-only GraphQL API dynamically and pins the stable `2026-07` version. It retrieves up to 500 items and follows cursors, so the implementation does not assume today’s board size. Column values are mapped by their visible titles because imported column IDs are workspace-specific. The trade-off is that a renamed column becomes a reported limitation; hardcoding generated IDs would be less portable.

I implemented a dual-source strategy (Demo vs. Production). The Demo Adapter (local CSVs) allows for rapid, isolated testing of business logic without API rate-limit risks or connectivity dependencies. The Production Adapter uses the dynamic GraphQL API to satisfy the assignment's core requirement for real-time data integrity.

The implementation intentionally supports a dual-mode strategy. In a local development environment, the spreadsheet adapter remains available so engineers can iterate quickly without depending on an API token or live board connectivity. The same canonical BusinessDataSource interface is used in both modes, and the production mode must always select the Monday GraphQL adapter when `DATA_SOURCE=monday` is set. This keeps development velocity high while aligning with the assignment requirement that the runtime path for production use must query live Monday boards instead of static CSV data.

The LLM is deliberately outside the calculation path. When configured, OpenAI classifies a question into a small typed tool set; deterministic TypeScript performs filtering, arithmetic, exclusions, grouping, and linkage. A deterministic router provides graceful operation when the model key is absent or planning fails. This sacrifices unrestricted natural-language flexibility in favor of repeatability, lower hallucination risk, simpler tests, and clearer auditability.

## Data resilience

I implemented “clean and fallback,” not speculative repair. Known date and number formats are parsed, comparison strings are trimmed and case-normalized, and common statuses/probabilities are canonicalized. Missing or invalid values remain null. A record is excluded only when the requested metric requires the unusable field; answers disclose the affected counts. Suspicious negative financial values remain unchanged and are flagged instead of silently corrected.

Weighted pipeline uses prototype weights of Low 25%, Medium 50%, and High 75%. The mapping is disclosed in every weighted result. It is an explanatory prioritization aid, not a forecast. More time and business input would be needed to calibrate stage-specific probabilities against historical conversion.

## Cross-board linkage

There is no shared immutable join key. Deal names overlap across boards, but client-code formats do not. I therefore use only exact deal-name equality after trimming and lowercasing. Duplicate names are aggregated, and every cross-board answer reports matched and unmatched counts. I intentionally rejected fuzzy matching and owner/sector inference: higher match coverage would create claims that cannot be defended from the source data. A production rollout should add the same immutable `Deal_ID` to both boards and backfill it through a reviewed mapping process.

## Leadership updates

I interpreted “help prepare data for leadership updates” as an on-demand Markdown brief generated from the current board snapshot. It contains an executive summary, pipeline highlights, delivery risks, sector/owner observations, data-quality caveats, and suggested follow-ups. I did not build scheduled email, presentation export, or a dashboard generator. This keeps leadership output consistent with ordinary analysis and avoids a second reporting system.

## What I would improve with more time

I would validate column mappings against live board metadata during onboarding, add a shared `Deal_ID`, introduce authenticated user access, and cache one short-lived snapshot per request window to reduce monday complexity usage. I would calibrate probability weights from historical wins, add fiscal-quarter configuration, expand date-locale tests, and collect user feedback on clarification quality. For production operations, I would add structured telemetry, rate-limit-aware retries, secret rotation, preview-environment isolation, and automated post-deployment smoke tests against non-production boards.
