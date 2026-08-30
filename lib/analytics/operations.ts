import type { BusinessSnapshot } from "../data-source";
import type { WorkOrder } from "../domain/types";
import type { AnalyticsResult } from "./types";

export interface OperationsInput {
  asOf: string;
  sector?: string;
  owner?: string;
}

function sum(workOrders: WorkOrder[], field: keyof WorkOrder): number {
  return workOrders.reduce((total, workOrder) => {
    const value = workOrder[field];
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

export function operationsSummary(
  snapshot: BusinessSnapshot,
  input: OperationsInput,
): AnalyticsResult {
  const workOrders = snapshot.workOrders.filter((workOrder) => {
    if (input.sector && workOrder.sector?.toLowerCase() !== input.sector.toLowerCase()) return false;
    if (input.owner && workOrder.owner?.toLowerCase() !== input.owner.toLowerCase()) return false;
    return true;
  });
  const complete = new Set(["completed", "complete", "closed"]);
  const overdue = workOrders.filter((workOrder) => {
    const dueDate = workOrder.dataDeliveryDate ?? workOrder.probableEndDate;
    return Boolean(dueDate && dueDate < input.asOf && !complete.has(workOrder.executionStatus));
  });
  const negativeUnbilled = workOrders.filter(
    (workOrder) =>
      (workOrder.unbilledValueExcludingTax ?? 0) < 0 ||
      (workOrder.unbilledValueIncludingTax ?? 0) < 0,
  ).length;

  const statusCounts = new Map<string, number>();
  workOrders.forEach((workOrder) =>
    statusCounts.set(workOrder.executionStatus, (statusCounts.get(workOrder.executionStatus) ?? 0) + 1),
  );
  return {
    title: "Work-order summary",
    summary: `${overdue.length} of ${workOrders.length} work orders are overdue as of ${input.asOf}.`,
    metrics: {
      workOrderCount: workOrders.length,
      overdueCount: overdue.length,
      contractValueExcludingTax: sum(workOrders, "contractValueExcludingTax"),
      billedValueExcludingTax: sum(workOrders, "billedValueExcludingTax"),
      collectedValueIncludingTax: sum(workOrders, "collectedValueIncludingTax"),
      receivableValue: sum(workOrders, "receivableValue"),
    },
    rows: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
    caveats: [
      "Contract and billed values exclude GST; collected values include GST; receivables follow the source-board basis.",
      ...(negativeUnbilled ? [`${negativeUnbilled} work orders have negative unbilled values and were preserved for review.`] : []),
    ],
    quality: { included: workOrders.length, overdueEvaluated: workOrders.filter((workOrder) => workOrder.dataDeliveryDate || workOrder.probableEndDate).length, negativeUnbilled },
  };
}
