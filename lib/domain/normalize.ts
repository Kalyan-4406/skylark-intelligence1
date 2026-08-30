import type { Deal, DealStatus, Probability, RawRecord, WorkOrder } from "./types";
import type { DataIssue, Normalized } from "./quality";

type Source = DataIssue["source"];

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result ? result : null;
}

function titleCase(value: unknown): string | null {
  const result = cleanString(value);
  if (!result) return null;
  return result
    .toLowerCase()
    .replace(/(^|[\s/+()-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function upper(value: unknown): string | null {
  return cleanString(value)?.toUpperCase() ?? null;
}

function issue(
  source: Source,
  sourceIndex: number,
  field: string,
  code: DataIssue["code"],
  severity: DataIssue["severity"],
  message: string,
  rawValue?: unknown,
): DataIssue {
  return { source, sourceIndex, field, code, severity, message, rawValue };
}

function isoDateFromParts(year: number, month: number, day: number): string | null {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }
  return candidate.toISOString().slice(0, 10);
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = cleanString(value);
  if (!text) return null;

  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T].*)?$/);
  if (iso) return isoDateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dayFirst = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirst) {
    return isoDateFromParts(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]));
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = cleanString(value);
  if (!text) return null;
  const normalized = text.replace(/[₹,$\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStatus(value: unknown): DealStatus {
  const normalized = cleanString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "open") return "open";
  if (normalized === "won") return "won";
  if (normalized === "dead" || normalized === "lost") return "dead";
  if (normalized === "on_hold" || normalized === "hold") return "on_hold";
  return "unknown";
}

function parseProbability(value: unknown): Probability {
  const normalized = cleanString(value)?.toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return null;
}

function dateField(
  raw: RawRecord,
  key: string,
  field: string,
  source: Source,
  sourceIndex: number,
  issues: DataIssue[],
): string | null {
  const value = raw[key];
  const parsed = parseDate(value);
  if (cleanString(value) && !parsed) {
    issues.push(
      issue(source, sourceIndex, field, "invalid_date", "warning", `Could not parse ${key}.`, value),
    );
  }
  return parsed;
}

function numberField(
  raw: RawRecord,
  key: string,
  field: string,
  source: Source,
  sourceIndex: number,
  issues: DataIssue[],
  reportMissing = false,
): number | null {
  const value = raw[key];
  const parsed = parseNumber(value);
  if (parsed === null) {
    issues.push(
      issue(
        source,
        sourceIndex,
        field,
        cleanString(value) ? "invalid_number" : "missing_value",
        "warning",
        cleanString(value) ? `Could not parse ${key}.` : `${key} is missing.`,
        value,
      ),
    );
  } else if (parsed < 0) {
    issues.push(
      issue(source, sourceIndex, field, "negative_value", "warning", `${key} is negative.`, value),
    );
  }
  if (!reportMissing && !cleanString(value) && value !== 0) issues.pop();
  return parsed;
}

export function normalizeDeal(raw: RawRecord, sourceIndex: number): Normalized<Deal> {
  const issues: DataIssue[] = [];
  if (
    cleanString(raw["Deal Name"])?.toLowerCase() === "deal name" ||
    cleanString(raw["Deal Status"])?.toLowerCase() === "deal status"
  ) {
    return {
      record: null,
      issues: [
        issue("deals", sourceIndex, "record", "duplicate_header", "excluded", "Duplicated header row excluded."),
      ],
    };
  }

  const name = cleanString(raw["Deal Name"]);
  if (!name) {
    return {
      record: null,
      issues: [issue("deals", sourceIndex, "name", "missing_value", "excluded", "Deal name is missing.")],
    };
  }

  const status = parseStatus(raw["Deal Status"]);
  if (status === "unknown") {
    issues.push(issue("deals", sourceIndex, "status", "unknown_status", "warning", "Deal status is missing or unsupported.", raw["Deal Status"]));
  }

  return {
    record: {
      sourceIndex,
      name,
      owner: upper(raw["Owner code"]),
      clientCode: upper(raw["Client Code"]),
      status,
      actualCloseDate: dateField(raw, "Close Date (A)", "actualCloseDate", "deals", sourceIndex, issues),
      probability: parseProbability(raw["Closure Probability"]),
      value: numberField(raw, "Masked Deal value", "value", "deals", sourceIndex, issues, true),
      tentativeCloseDate: dateField(raw, "Tentative Close Date", "tentativeCloseDate", "deals", sourceIndex, issues),
      stage: cleanString(raw["Deal Stage"]),
      product: cleanString(raw["Product deal"]),
      sector: titleCase(raw["Sector/service"]),
      createdDate: dateField(raw, "Created Date", "createdDate", "deals", sourceIndex, issues),
    },
    issues,
  };
}

export function normalizeWorkOrder(raw: RawRecord, sourceIndex: number): Normalized<WorkOrder> {
  const issues: DataIssue[] = [];
  const dealName = cleanString(raw["Deal name masked"]);
  const serialNumber = cleanString(raw["Serial #"]);
  if (!dealName || !serialNumber) {
    return {
      record: null,
      issues: [issue("work_orders", sourceIndex, "record", "missing_value", "excluded", "Deal name or work-order serial number is missing.")],
    };
  }

  const executionStatus = cleanString(raw["Execution Status"])?.toLowerCase() ?? "unknown";
  return {
    record: {
      sourceIndex,
      dealName,
      customerCode: upper(raw["Customer Name Code"]),
      serialNumber,
      natureOfWork: cleanString(raw["Nature of Work"]),
      executionStatus,
      dataDeliveryDate: dateField(raw, "Data Delivery Date", "dataDeliveryDate", "work_orders", sourceIndex, issues),
      purchaseOrderDate: dateField(raw, "Date of PO/LOI", "purchaseOrderDate", "work_orders", sourceIndex, issues),
      probableStartDate: dateField(raw, "Probable Start Date", "probableStartDate", "work_orders", sourceIndex, issues),
      probableEndDate: dateField(raw, "Probable End Date", "probableEndDate", "work_orders", sourceIndex, issues),
      owner: upper(raw["BD/KAM Personnel code"]),
      sector: titleCase(raw.Sector),
      typeOfWork: cleanString(raw["Type of Work"]),
      contractValueExcludingTax: numberField(raw, "Amount in Rupees (Excl of GST) (Masked)", "contractValueExcludingTax", "work_orders", sourceIndex, issues),
      contractValueIncludingTax: numberField(raw, "Amount in Rupees (Incl of GST) (Masked)", "contractValueIncludingTax", "work_orders", sourceIndex, issues),
      billedValueExcludingTax: numberField(raw, "Billed Value in Rupees (Excl of GST.) (Masked)", "billedValueExcludingTax", "work_orders", sourceIndex, issues),
      billedValueIncludingTax: numberField(raw, "Billed Value in Rupees (Incl of GST.) (Masked)", "billedValueIncludingTax", "work_orders", sourceIndex, issues),
      collectedValueIncludingTax: numberField(raw, "Collected Amount in Rupees (Incl of GST.) (Masked)", "collectedValueIncludingTax", "work_orders", sourceIndex, issues),
      unbilledValueExcludingTax: numberField(raw, "Amount to be billed in Rs. (Exl. of GST) (Masked)", "unbilledValueExcludingTax", "work_orders", sourceIndex, issues),
      unbilledValueIncludingTax: numberField(raw, "Amount to be billed in Rs. (Incl. of GST) (Masked)", "unbilledValueIncludingTax", "work_orders", sourceIndex, issues),
      receivableValue: numberField(raw, "Amount Receivable (Masked)", "receivableValue", "work_orders", sourceIndex, issues),
      invoiceStatus: cleanString(raw["Invoice Status"]),
      billingStatus: cleanString(raw["Billing Status"]),
    },
    issues,
  };
}
