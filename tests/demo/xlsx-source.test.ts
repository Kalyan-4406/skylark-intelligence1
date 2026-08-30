import { describe, expect, it, vi } from "vitest";

import { createSpreadsheetDataSource } from "@/lib/demo/xlsx-source";

describe("spreadsheet demo source", () => {
  it("detects each workbook header and maps through canonical normalizers", async () => {
    const reader = vi
      .fn()
      .mockResolvedValueOnce([
        ["Deal Name", "Deal Status", "Masked Deal value", "Sector/service"],
        ["Project Atlas", "Open", 1250000, "Mining"],
      ])
      .mockResolvedValueOnce([
        ["Export generated on", "2026-08-30"],
        ["Deal name masked", "Serial #", "Execution Status", "Sector"],
        ["Project Atlas", "SDPLDEAL-001", "Ongoing", "Mining"],
      ]);

    const source = createSpreadsheetDataSource(
      { dealsPath: "deals.xlsx", workOrdersPath: "work-orders.xlsx" },
      reader,
    );
    const snapshot = await source.loadSnapshot();

    expect(snapshot.source).toBe("demo");
    expect(snapshot.deals).toEqual([
      expect.objectContaining({ name: "Project Atlas", value: 1250000, sector: "Mining" }),
    ]);
    expect(snapshot.workOrders).toEqual([
      expect.objectContaining({ dealName: "Project Atlas", serialNumber: "SDPLDEAL-001" }),
    ]);
  });
});
