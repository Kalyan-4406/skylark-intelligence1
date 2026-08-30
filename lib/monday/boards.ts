import type { BusinessDataSource, BusinessSnapshot } from "../data-source";
import { normalizeDeal, normalizeWorkOrder } from "../domain/normalize";
import type { ServerConfig } from "../config";
import { MondayClient } from "./client";
import {
  mapMondayItemsToRawRecords,
  type MondayColumn,
  type MondayItem,
} from "./mapper";

const FIRST_PAGE_QUERY = `query BoardItems($boardId: [ID!]!) {
  boards(ids: $boardId) {
    columns { id title type }
    items_page(limit: 500) {
      cursor
      items { id name column_values { id text value } }
    }
  }
}`;

const NEXT_PAGE_QUERY = `query NextBoardItems($cursor: String!) {
  next_items_page(limit: 500, cursor: $cursor) {
    cursor
    items { id name column_values { id text value } }
  }
}`;

interface Page {
  cursor: string | null;
  items: MondayItem[];
}

async function readBoard(client: MondayClient, boardId: string) {
  const first = await client.query<{
    boards: Array<{ columns: MondayColumn[]; items_page: Page }>;
  }>(FIRST_PAGE_QUERY, { boardId: [boardId] });
  const board = first.boards[0];
  if (!board) throw new Error(`Board ${boardId} was not found or is inaccessible.`);

  const items = [...board.items_page.items];
  let cursor = board.items_page.cursor;
  while (cursor) {
    const next = await client.query<{ next_items_page: Page }>(NEXT_PAGE_QUERY, { cursor });
    items.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }
  return { columns: board.columns, items };
}

export function createMondayDataSource(config: ServerConfig): BusinessDataSource {
  if (!config.mondayApiToken || !config.mondayDealsBoardId || !config.mondayWorkOrdersBoardId) {
    throw new Error("monday.com credentials and both board IDs are required.");
  }
  const client = new MondayClient({ token: config.mondayApiToken });

  return {
    async loadSnapshot(): Promise<BusinessSnapshot> {
      const [dealBoard, workOrderBoard] = await Promise.all([
        readBoard(client, config.mondayDealsBoardId!),
        readBoard(client, config.mondayWorkOrdersBoardId!),
      ]);
      const deals = mapMondayItemsToRawRecords(dealBoard.columns, dealBoard.items).map(normalizeDeal);
      const workOrders = mapMondayItemsToRawRecords(
        workOrderBoard.columns,
        workOrderBoard.items,
        "Deal name masked",
      ).map(normalizeWorkOrder);

      return {
        deals: deals.flatMap((result) => (result.record ? [result.record] : [])),
        workOrders: workOrders.flatMap((result) => (result.record ? [result.record] : [])),
        issues: [...deals.flatMap((result) => result.issues), ...workOrders.flatMap((result) => result.issues)],
        fetchedAt: new Date().toISOString(),
        source: "monday",
      };
    },
  };
}
