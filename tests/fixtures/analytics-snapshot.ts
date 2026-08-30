import type { BusinessSnapshot } from "@/lib/data-source";
import type { Deal, WorkOrder } from "@/lib/domain/types";

function deal(overrides: Partial<Deal> & Pick<Deal, "name">): Deal {
  return { sourceIndex: 0, owner: null, clientCode: null, status: "open", actualCloseDate: null, probability: null, value: null, tentativeCloseDate: null, stage: null, product: null, sector: null, createdDate: null, ...overrides };
}

function workOrder(overrides: Partial<WorkOrder> & Pick<WorkOrder, "dealName" | "serialNumber">): WorkOrder {
  return { sourceIndex: 0, customerCode: null, natureOfWork: null, executionStatus: "unknown", dataDeliveryDate: null, purchaseOrderDate: null, probableStartDate: null, probableEndDate: null, owner: null, sector: null, typeOfWork: null, contractValueExcludingTax: null, contractValueIncludingTax: null, billedValueExcludingTax: null, billedValueIncludingTax: null, collectedValueIncludingTax: null, unbilledValueExcludingTax: null, unbilledValueIncludingTax: null, receivableValue: null, invoiceStatus: null, billingStatus: null, ...overrides };
}

export const analyticsSnapshot: BusinessSnapshot = {
  source: "demo", fetchedAt: "2026-08-30T03:30:00.000Z", issues: [],
  deals: [
    deal({ name: "Atlas", owner: "OWNER_001", probability: "high", value: 1000, tentativeCloseDate: "2026-09-15", sector: "Energy" }),
    deal({ name: " atlas ", owner: "OWNER_001", probability: "medium", value: 500, tentativeCloseDate: "2026-09-20", sector: "Energy" }),
    deal({ name: "Beacon", owner: "OWNER_002", value: 800, sector: "Mining" }),
    deal({ name: "Cinder", owner: "OWNER_002", status: "won", actualCloseDate: "2026-08-01", probability: "high", value: 2000, tentativeCloseDate: "2026-08-01", sector: "Energy" }),
    deal({ name: "Delta", probability: "low", tentativeCloseDate: "2026-09-25", sector: "Energy" }),
  ],
  workOrders: [
    workOrder({ dealName: "ATLAS", serialNumber: "WO-1", executionStatus: "ongoing", probableEndDate: "2026-08-01", owner: "OWNER_001", sector: "Energy", contractValueExcludingTax: 1000, billedValueExcludingTax: 600, collectedValueIncludingTax: 400, unbilledValueExcludingTax: 400, receivableValue: 308 }),
    workOrder({ dealName: "Atlas", serialNumber: "WO-2", executionStatus: "completed", probableEndDate: "2026-08-10", owner: "OWNER_001", sector: "Energy", contractValueExcludingTax: 500, billedValueExcludingTax: 500, collectedValueIncludingTax: 590, unbilledValueExcludingTax: 0, receivableValue: 0 }),
    workOrder({ dealName: "Beacon-ish", serialNumber: "WO-3", executionStatus: "not started", owner: "OWNER_002", sector: "Mining", contractValueExcludingTax: 800, unbilledValueExcludingTax: -20 }),
  ],
};
