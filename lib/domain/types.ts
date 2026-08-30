export type RawRecord = Record<string, unknown>;

export type DealStatus = "open" | "won" | "dead" | "on_hold" | "unknown";
export type Probability = "low" | "medium" | "high" | null;

export interface Deal {
  sourceIndex: number;
  name: string;
  owner: string | null;
  clientCode: string | null;
  status: DealStatus;
  actualCloseDate: string | null;
  probability: Probability;
  value: number | null;
  tentativeCloseDate: string | null;
  stage: string | null;
  product: string | null;
  sector: string | null;
  createdDate: string | null;
}

export interface WorkOrder {
  sourceIndex: number;
  dealName: string;
  customerCode: string | null;
  serialNumber: string;
  natureOfWork: string | null;
  executionStatus: string;
  dataDeliveryDate: string | null;
  purchaseOrderDate: string | null;
  probableStartDate: string | null;
  probableEndDate: string | null;
  owner: string | null;
  sector: string | null;
  typeOfWork: string | null;
  contractValueExcludingTax: number | null;
  contractValueIncludingTax: number | null;
  billedValueExcludingTax: number | null;
  billedValueIncludingTax: number | null;
  collectedValueIncludingTax: number | null;
  unbilledValueExcludingTax: number | null;
  unbilledValueIncludingTax: number | null;
  receivableValue: number | null;
  invoiceStatus: string | null;
  billingStatus: string | null;
}
