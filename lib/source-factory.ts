import type { BusinessDataSource } from "./data-source";
import type { ServerConfig } from "./config";
import { createSpreadsheetDataSource } from "./demo/xlsx-source";
import { createMondayDataSource } from "./monday/boards";

export function createDataSource(config: ServerConfig): BusinessDataSource {
  if (config.dataSource === "demo") {
    return createSpreadsheetDataSource({
      dealsPath: config.demoDealsFile,
      workOrdersPath: config.demoWorkOrdersFile,
    });
  }
  return createMondayDataSource(config);
}
