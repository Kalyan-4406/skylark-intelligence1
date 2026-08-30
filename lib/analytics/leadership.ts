import type { BusinessSnapshot } from "../data-source";
import { linkDealsToWorkOrders } from "./linkage";
import { operationsSummary } from "./operations";
import { pipelineSummary } from "./pipeline";

export function generateLeadershipUpdate(
  snapshot: BusinessSnapshot,
  input: { asOf: string },
): { markdown: string } {
  const pipeline = pipelineSummary(snapshot, { status: "open" });
  const operations = operationsSummary(snapshot, input);
  const linkage = linkDealsToWorkOrders(snapshot.deals, snapshot.workOrders);
  const topSector = pipeline.rows[0]?.sector ?? "No sector data";

  return {
    markdown: [
      "## Executive summary",
      `${pipeline.metrics.dealCount} open deals and ${operations.metrics.overdueCount} overdue work orders require leadership attention.`,
      "## Pipeline highlights",
      `${pipeline.summary} The leading sector by recorded value is ${topSector}.`,
      "## Delivery risks",
      operations.summary,
      "## Sector and owner observations",
      `${pipeline.rows.length} sectors have active pipeline coverage; review owner-level concentration in the detailed answer.`,
      "## Data-quality caveats",
      [...pipeline.caveats, ...operations.caveats, `Cross-board context uses exact normalized deal-name matches only: ${linkage.matchedDeals} deals and ${linkage.matchedWorkOrders} work orders matched.`].join(" "),
      "## Suggested follow-ups",
      "- Which high-value deals are missing close dates?\n- Who owns the overdue work orders?\n- Which sectors have the highest receivables?",
    ].join("\n\n"),
  };
}
