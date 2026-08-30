import { describe, expect, it } from "vitest";

import { mapMondayItemsToRawRecords } from "@/lib/monday/mapper";

describe("monday board mapping", () => {
  it("maps item names and dynamic column titles without depending on column IDs", () => {
    const records = mapMondayItemsToRawRecords(
      [
        { id: "name", title: "Deal Name", type: "name" },
        { id: "status_1", title: "Deal Status", type: "status" },
        { id: "value_1", title: "Masked Deal value", type: "numbers" },
      ],
      [
        {
          id: "item-1",
          name: "Project Atlas",
          column_values: [
            { id: "status_1", text: "Open", value: "{\"index\":1}" },
            { id: "value_1", text: "1250000", value: "1250000" },
          ],
        },
      ],
    );

    expect(records).toEqual([
      {
        "Deal Name": "Project Atlas",
        "Deal Status": "Open",
        "Masked Deal value": "1250000",
      },
    ]);
  });
});
