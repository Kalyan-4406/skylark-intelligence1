import type { Deal, WorkOrder } from "../domain/types";

export interface LinkageGroup {
  normalizedName: string;
  dealCount: number;
  workOrderCount: number;
  dealValue: number;
  workOrderValue: number;
}

export interface LinkageResult {
  groups: LinkageGroup[];
  matchedDeals: number;
  matchedWorkOrders: number;
  unmatchedDeals: number;
  unmatchedWorkOrders: number;
}

function key(value: string): string {
  return value.trim().toLowerCase();
}

export function linkDealsToWorkOrders(deals: Deal[], workOrders: WorkOrder[]): LinkageResult {
  const dealGroups = new Map<string, Deal[]>();
  const workOrderGroups = new Map<string, WorkOrder[]>();
  deals.forEach((deal) => dealGroups.set(key(deal.name), [...(dealGroups.get(key(deal.name)) ?? []), deal]));
  workOrders.forEach((workOrder) => workOrderGroups.set(key(workOrder.dealName), [...(workOrderGroups.get(key(workOrder.dealName)) ?? []), workOrder]));

  const names = [...dealGroups.keys()].filter((name) => workOrderGroups.has(name));
  const groups = names.map((normalizedName) => {
    const matchedDeals = dealGroups.get(normalizedName) ?? [];
    const matchedWorkOrders = workOrderGroups.get(normalizedName) ?? [];
    return {
      normalizedName,
      dealCount: matchedDeals.length,
      workOrderCount: matchedWorkOrders.length,
      dealValue: matchedDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0),
      workOrderValue: matchedWorkOrders.reduce(
        (sum, workOrder) => sum + (workOrder.contractValueExcludingTax ?? 0),
        0,
      ),
    };
  });
  const matchedDeals = groups.reduce((sum, group) => sum + group.dealCount, 0);
  const matchedWorkOrders = groups.reduce((sum, group) => sum + group.workOrderCount, 0);
  return {
    groups,
    matchedDeals,
    matchedWorkOrders,
    unmatchedDeals: deals.length - matchedDeals,
    unmatchedWorkOrders: workOrders.length - matchedWorkOrders,
  };
}
