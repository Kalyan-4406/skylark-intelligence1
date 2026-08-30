import { z } from "zod";

function normalizeEnv(env: Environment): Environment {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== "string") {
      normalized[key] = value;
      continue;
    }

    const trimmed = value.trim();
    normalized[key] = trimmed.length > 0 ? trimmed : undefined;
  }

  const source = normalized.DATA_SOURCE?.toLowerCase();
  normalized.DATA_SOURCE = source === "monday" || source === "demo" ? source : "demo";

  return normalized;
}

const configSchema = z
  .object({
    DATA_SOURCE: z.enum(["monday", "demo"]).default("demo"),
    MONDAY_API_TOKEN: z.string().min(1).optional(),
    MONDAY_DEALS_BOARD_ID: z.string().min(1).optional(),
    MONDAY_WORK_ORDERS_BOARD_ID: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().min(1).default("gpt-5-mini"),
    BUSINESS_TIMEZONE: z.string().min(1).default("Asia/Kolkata"),
    DEMO_DEALS_FILE: z.string().min(1).default("Deal funnel Data.xlsx"),
    DEMO_WORK_ORDERS_FILE: z.string().min(1).default("Work_Order_Tracker Data.xlsx"),
  })
  .superRefine((value, context) => {
    if (value.DATA_SOURCE !== "monday") return;

    const required = [
      "MONDAY_API_TOKEN",
      "MONDAY_DEALS_BOARD_ID",
      "MONDAY_WORK_ORDERS_BOARD_ID",
    ] as const;

    for (const key of required) {
      if (!value[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when DATA_SOURCE=monday`,
        });
      }
    }
  });

export interface ServerConfig {
  dataSource: "monday" | "demo";
  mondayApiToken?: string;
  mondayDealsBoardId?: string;
  mondayWorkOrdersBoardId?: string;
  openAIApiKey?: string;
  openAIModel: string;
  businessTimezone: string;
  demoDealsFile: string;
  demoWorkOrdersFile: string;
}

export interface ConfigurationStatus {
  dataSource: "monday" | "demo";
  mondayConfigured: boolean;
  modelConfigured: boolean;
  dealsBoardConfigured: boolean;
  workOrdersBoardConfigured: boolean;
}

type Environment = Readonly<Record<string, string | undefined>>;

export function getServerConfig(env: Environment = process.env): ServerConfig {
  const value = configSchema.parse(normalizeEnv(env));

  return {
    dataSource: value.DATA_SOURCE,
    mondayApiToken: value.MONDAY_API_TOKEN,
    mondayDealsBoardId: value.MONDAY_DEALS_BOARD_ID,
    mondayWorkOrdersBoardId: value.MONDAY_WORK_ORDERS_BOARD_ID,
    openAIApiKey: value.OPENAI_API_KEY,
    openAIModel: value.OPENAI_MODEL,
    businessTimezone: value.BUSINESS_TIMEZONE,
    demoDealsFile: value.DEMO_DEALS_FILE,
    demoWorkOrdersFile: value.DEMO_WORK_ORDERS_FILE,
  };
}

export function getConfigurationStatus(
  env: Environment = process.env,
): ConfigurationStatus {
  const normalized = normalizeEnv(env);
  const dataSource = normalized.DATA_SOURCE === "demo" ? "demo" : "monday";
  const dealsBoardConfigured = Boolean(normalized.MONDAY_DEALS_BOARD_ID);
  const workOrdersBoardConfigured = Boolean(normalized.MONDAY_WORK_ORDERS_BOARD_ID);

  return {
    dataSource,
    mondayConfigured:
      Boolean(normalized.MONDAY_API_TOKEN) &&
      dealsBoardConfigured &&
      workOrdersBoardConfigured,
    modelConfigured: Boolean(normalized.OPENAI_API_KEY),
    dealsBoardConfigured,
    workOrdersBoardConfigured,
  };
}
