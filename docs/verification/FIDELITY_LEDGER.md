# Visual Fidelity Ledger

## Evidence

- Accepted concept: `docs/design/skylark-intelligence-desktop-concept.png` (generated with the built-in Image Gen tool, native 1680×945 landscape reference).
- Desktop render: `docs/verification/latest-desktop.png`, captured by Playwright Chromium at 1680×945 after a real pipeline query.
- Mobile render: `docs/verification/latest-mobile.png`, captured by Playwright Chromium at 390×844.
- Browser method: Playwright fallback because Browser/IAB was unavailable in this session.

## Comparison points

| Area | Concept evidence | Render evidence and resolution |
|---|---|---|
| Information architecture | Quiet header, source status, left rail, open conversation canvas, bottom composer | Same hierarchy implemented; no marketing wrapper or dashboard grid. |
| Opening composition | Large founder question, one support line, four prompts | Copy and order match; E2E asserts the heading remains in the viewport after the first answer. |
| Palette and surfaces | True white, deep ink, cobalt accent, thin graphite rules, amber caveat | Tokens reproduce these roles without tint overlays or decorative gradients. |
| Typography and density | Strong compact heading, restrained controls, readable evidence table | Responsive scale preserves hierarchy; controls have explicit sizes/weights. |
| Evidence anatomy | Four-row table followed by a visible quality note | Table preview is capped at four rows, uses human labels and formatted INR, and caveat visibility is browser-tested. |
| Source confidence | Two-board health in header and rail | Live mode reads monday.com; explicit demo mode is visibly labeled as two workbooks. |
| Responsive behavior | Desktop-led application with practical continuation | At 390×844 the rail collapses, header simplifies, suggestions become two columns, and composer remains reachable. |
| Interaction state | Selected conversation, user prompt, assistant evidence, composer | Suggestion, typed prompt, loading, answer, clarification/error, reset, and leadership paths update real local state. |

## Above-the-fold copy diff

The implementation preserves the approved brand, heading, support line, four prompt labels, source label, `New analysis`, composer placeholder, and caveat footnote. The only intentional copy variation is `Demo data · 2 workbooks` when the explicit local adapter is active; production displays `monday.com · 2 boards`.

## Material fixes made

- Added `allowedDevOrigins` so Next.js hydrated under Playwright’s loopback host.
- Removed answer-triggered auto-scroll that hid the approved opening hierarchy.
- Formatted raw metric keys into executive-facing labels and INR values.
- Reduced evidence previews to four rows so caveats remain in the primary viewport.
- Hid decorative suggestion numbers from accessible button names.
- Simplified the mobile header and collapsed the desktop rail.

## Remaining intentional deviations

- The concept’s decorative flight-path connector is omitted to keep the implementation code-native and uncluttered; no workflow meaning is lost.
- Conversation history is session-only because persistence was outside assignment scope.
- The generated concept contains illustrative sample figures; the render correctly uses live workbook/monday values instead.

The implementation was faithfully verified against the accepted design. No material, fixable visual mismatch remains in the tested desktop and mobile states.
