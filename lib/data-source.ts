import type { Deal, WorkOrder } from "./domain/types";
import type { DataIssue } from "./domain/quality";

export interface BusinessSnapshot {
  deals: Deal[];
  workOrders: WorkOrder[];
  issues: DataIssue[];
  fetchedAt: string;
  source: "monday" | "demo";
}

export interface BusinessDataSource {
  loadSnapshot(): Promise<BusinessSnapshot>;
}
