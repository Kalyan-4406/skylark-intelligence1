import { describe, expect, it } from "vitest";
import { pipelineSummary } from "@/lib/analytics/pipeline";
import { operationsSummary } from "@/lib/analytics/operations";
import { linkDealsToWorkOrders } from "@/lib/analytics/linkage";
import { generateLeadershipUpdate } from "@/lib/analytics/leadership";
import { analyticsSnapshot as snapshot } from "@/tests/fixtures/analytics-snapshot";

describe("pipeline analytics", () => {
  it("calculates open pipeline with disclosed weighting and exclusions", () => {
    const result = pipelineSummary(snapshot, { status: "open" });
    expect(result.metrics).toMatchObject({ dealCount: 4, pipelineValue: 2300, weightedValue: 1000 });
    expect(result.quality).toMatchObject({ included: 4, excludedFromValue: 1, excludedFromWeighted: 2 });
    expect(result.caveats.join(" ")).toContain("Low 25%, Medium 50%, High 75%");
  });

  it("filters by sector and close-date range", () => {
    const result = pipelineSummary(snapshot, { status: "open", sector: "energy", from: "2026-07-01", to: "2026-09-30" });
    expect(result.metrics).toMatchObject({ dealCount: 3, pipelineValue: 1500 });
  });
});

it("identifies overdue work and labels financial bases", () => {
  const result = operationsSummary(snapshot, { asOf: "2026-08-30" });
  expect(result.metrics).toMatchObject({ workOrderCount: 3, overdueCount: 1, contractValueExcludingTax: 2300, billedValueExcludingTax: 1100, collectedValueIncludingTax: 990, receivableValue: 308 });
  expect(result.caveats.join(" ")).toContain("negative unbilled");
});

it("links exact normalized names and aggregates duplicates", () => {
  const result = linkDealsToWorkOrders(snapshot.deals, snapshot.workOrders);
  expect(result.groups).toContainEqual(expect.objectContaining({ normalizedName: "atlas", dealCount: 2, workOrderCount: 2 }));
  expect(result).toMatchObject({ matchedDeals: 2, matchedWorkOrders: 2, unmatchedDeals: 3, unmatchedWorkOrders: 1 });
});

it("produces the required leadership-update sections", () => {
  const result = generateLeadershipUpdate(snapshot, { asOf: "2026-08-30" });
  const headings = ["Executive summary", "Pipeline highlights", "Delivery risks", "Sector and owner observations", "Data-quality caveats", "Suggested follow-ups"];
  headings.forEach((heading) => expect(result.markdown).toContain("## " + heading));
  expect(result.markdown).toContain("exact normalized deal-name matches");
});
