import { readSheet } from "read-excel-file/node";

import type { BusinessDataSource, BusinessSnapshot } from "../data-source";
import { normalizeDeal, normalizeWorkOrder } from "../domain/normalize";
import type { RawRecord } from "../domain/types";

type Cell = string | number | boolean | Date | null;
type WorkbookReader = (path: string) => Promise<Cell[][]>;

interface SpreadsheetPaths {
  dealsPath: string;
  workOrdersPath: string;
}

function rowsToRecords(rows: Cell[][], requiredHeader: string): RawRecord[] {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => String(cell ?? "").trim() === requiredHeader),
  );
  if (headerIndex < 0) throw new Error(`Could not find ${requiredHeader} in workbook.`);

  const headers = rows[headerIndex].map((cell) => String(cell ?? "").trim());
  return rows.slice(headerIndex + 1).flatMap((row) => {
    const record: RawRecord = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index] ?? null;
    });
    return Object.values(record).some((value) => value !== null && value !== "")
      ? [record]
      : [];
  });
}

export function createSpreadsheetDataSource(
  paths: SpreadsheetPaths,
  reader: WorkbookReader = readSheet,
): BusinessDataSource {
  return {
    async loadSnapshot(): Promise<BusinessSnapshot> {
      const [dealRows, workOrderRows] = await Promise.all([
        reader(paths.dealsPath),
        reader(paths.workOrdersPath),
      ]);
      const deals = rowsToRecords(dealRows, "Deal Name").map(normalizeDeal);
      const workOrders = rowsToRecords(workOrderRows, "Deal name masked").map(
        normalizeWorkOrder,
      );
      return {
        deals: deals.flatMap((result) => (result.record ? [result.record] : [])),
        workOrders: workOrders.flatMap((result) => (result.record ? [result.record] : [])),
        issues: [...deals.flatMap((result) => result.issues), ...workOrders.flatMap((result) => result.issues)],
        fetchedAt: new Date().toISOString(),
        source: "demo",
      };
    },
  };
}
