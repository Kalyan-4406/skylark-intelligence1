import type { BusinessSnapshot } from "../data-source";
import type { DealStatus, Probability } from "../domain/types";
import type { AnalyticsResult } from "./types";

export interface PipelineInput {
  status?: DealStatus;
  sector?: string;
  owner?: string;
  from?: string;
  to?: string;
}

const weights: Record<Exclude<Probability, null>, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
};

export function pipelineSummary(
  snapshot: BusinessSnapshot,
  input: PipelineInput = {},
): AnalyticsResult {
  const status = input.status ?? "open";
  const deals = snapshot.deals.filter((deal) => {
    if (deal.status !== status) return false;
    if (input.sector && deal.sector?.toLowerCase() !== input.sector.toLowerCase()) return false;
    if (input.owner && deal.owner?.toLowerCase() !== input.owner.toLowerCase()) return false;
    if (input.from && (!deal.tentativeCloseDate || deal.tentativeCloseDate < input.from)) return false;
    if (input.to && (!deal.tentativeCloseDate || deal.tentativeCloseDate > input.to)) return false;
    return true;
  });

  const withValue = deals.filter((deal) => deal.value !== null);
  const withWeight = deals.filter((deal) => deal.value !== null && deal.probability !== null);
  const pipelineValue = withValue.reduce((sum, deal) => sum + (deal.value ?? 0), 0);
  const weightedValue = withWeight.reduce(
    (sum, deal) => sum + (deal.value ?? 0) * weights[deal.probability!],
    0,
  );

  const bySector = new Map<string, { count: number; value: number }>();
  for (const deal of deals) {
    const key = deal.sector ?? "Unknown";
    const current = bySector.get(key) ?? { count: 0, value: 0 };
    current.count += 1;
    current.value += deal.value ?? 0;
    bySector.set(key, current);
  }

  const excludedFromValue = deals.length - withValue.length;
  const excludedFromWeighted = deals.length - withWeight.length;
  return {
    title: "Pipeline summary",
    summary: `${deals.length} ${status.replace("_", "-")} deals represent ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pipelineValue)} in pipeline value.`,
    metrics: { dealCount: deals.length, pipelineValue, weightedValue },
    rows: [...bySector.entries()]
      .map(([sector, value]) => ({ sector, dealCount: value.count, pipelineValue: value.value }))
      .sort((a, b) => Number(b.pipelineValue) - Number(a.pipelineValue)),
    caveats: [
      "Weighted pipeline uses disclosed prototype weights: Low 25%, Medium 50%, High 75%.",
      ...(excludedFromValue ? [`${excludedFromValue} deals were excluded from pipeline value because value was missing.`] : []),
      ...(excludedFromWeighted ? [`${excludedFromWeighted} deals were excluded from weighted value because value or probability was missing.`] : []),
    ],
    quality: { included: deals.length, excludedFromValue, excludedFromWeighted },
  };
}
