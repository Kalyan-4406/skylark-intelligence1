export type IssueSeverity = "info" | "warning" | "excluded";

export interface DataIssue {
  source: "deals" | "work_orders";
  sourceIndex: number;
  field: string;
  code:
    | "duplicate_header"
    | "missing_value"
    | "invalid_date"
    | "invalid_number"
    | "negative_value"
    | "unknown_status";
  severity: IssueSeverity;
  message: string;
  rawValue?: unknown;
}

export interface Normalized<T> {
  record: T | null;
  issues: DataIssue[];
}

export interface QualityReport {
  issues: DataIssue[];
  warnings: number;
  exclusions: number;
}

export function mergeQuality(...issueGroups: DataIssue[][]): QualityReport {
  const issues = issueGroups.flat();
  return {
    issues,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    exclusions: issues.filter((issue) => issue.severity === "excluded").length,
  };
}
