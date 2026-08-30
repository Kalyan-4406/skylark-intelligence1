import type { RawRecord } from "../domain/types";

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
}

export interface MondayColumnValue {
  id: string;
  text: string | null;
  value: string | null;
}

export interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

export function mapMondayItemsToRawRecords(
  columns: MondayColumn[],
  items: MondayItem[],
  nameTitle = "Deal Name",
): RawRecord[] {
  const titles = new Map(columns.map((column) => [column.id, column.title]));
  return items.map((item) => {
    const record: RawRecord = { [nameTitle]: item.name };
    for (const value of item.column_values) {
      const title = titles.get(value.id);
      if (title && title !== nameTitle) record[title] = value.text ?? value.value;
    }
    return record;
  });
}
