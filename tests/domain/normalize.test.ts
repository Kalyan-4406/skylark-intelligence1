import { describe, expect, it } from "vitest";

import { normalizeDeal, normalizeWorkOrder } from "@/lib/domain/normalize";
import { validDealRow, validWorkOrderRow } from "@/tests/fixtures/synthetic-records";

describe("normalizeDeal", () => {
  it("normalizes strings, known dates, currency, status, and probability", () => {
    const result = normalizeDeal(validDealRow, 4);

    expect(result.record).toMatchObject({
      sourceIndex: 4,
      name: "Project Atlas",
      owner: "OWNER_001",
      clientCode: "COMPANY-7",
      status: "open",
      actualCloseDate: "2025-07-31",
      tentativeCloseDate: "2025-09-30",
      createdDate: "2025-01-05",
      probability: "high",
      value: 1250000.5,
      sector: "Mining",
    });
    expect(result.issues).toEqual([]);
  });

  it("excludes a duplicated spreadsheet header row", () => {
    const result = normalizeDeal(
      {
        "Deal Name": "Deal Name",
        "Deal Status": "Deal Status",
        "Deal Stage": "Deal Stage",
      },
      18,
    );

    expect(result.record).toBeNull();
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "duplicate_header", severity: "excluded" }),
    );
  });

  it("keeps the record and reports missing or invalid analytic fields", () => {
    const result = normalizeDeal(
      {
        "Deal Name": "Project Ember",
        "Deal Status": "Open",
        "Tentative Close Date": "not-a-date",
        "Masked Deal value": null,
      },
      9,
    );

    expect(result.record).toMatchObject({
      name: "Project Ember",
      tentativeCloseDate: null,
      value: null,
    });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "tentativeCloseDate", code: "invalid_date" }),
        expect.objectContaining({ field: "value", code: "missing_value" }),
      ]),
    );
  });
});

describe("normalizeWorkOrder", () => {
  it("normalizes operational and financial fields while preserving anomalies", () => {
    const result = normalizeWorkOrder(validWorkOrderRow, 2);

    expect(result.record).toMatchObject({
      sourceIndex: 2,
      dealName: "Project Atlas",
      serialNumber: "SDPLDEAL-007",
      executionStatus: "ongoing",
      probableStartDate: "2025-06-01",
      probableEndDate: "2025-09-30",
      contractValueExcludingTax: 2000000,
      billedValueExcludingTax: 1500000,
      collectedValueIncludingTax: 800000,
      unbilledValueExcludingTax: -25000,
      receivableValue: 700000,
    });
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "unbilledValueExcludingTax",
        code: "negative_value",
        severity: "warning",
      }),
    );
  });
});
