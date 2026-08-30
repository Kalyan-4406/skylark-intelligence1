import { describe, expect, it } from "vitest";

import { getConfigurationStatus, getServerConfig } from "@/lib/config";

describe("server configuration", () => {
  it("defaults to demo mode when no source is configured", () => {
    const config = getServerConfig({});

    expect(config).toMatchObject({
      dataSource: "demo",
      openAIModel: "gpt-5-mini",
      businessTimezone: "Asia/Kolkata",
    });
  });

  it("treats blank env values as missing and keeps demo mode valid", () => {
    const config = getServerConfig({
      DATA_SOURCE: "demo",
      MONDAY_API_TOKEN: "",
      MONDAY_DEALS_BOARD_ID: "",
      MONDAY_WORK_ORDERS_BOARD_ID: "",
      OPENAI_API_KEY: "",
      OPENAI_MODEL: "",
      BUSINESS_TIMEZONE: "",
    });

    expect(config).toMatchObject({
      dataSource: "demo",
      openAIModel: "gpt-5-mini",
      businessTimezone: "Asia/Kolkata",
    });
  });

  it("rejects monday mode when required connection settings are absent", () => {
    expect(() => getServerConfig({ DATA_SOURCE: "monday" })).toThrow(
      "MONDAY_API_TOKEN",
    );
  });

  it("allows explicitly selected demo mode without monday credentials", () => {
    const config = getServerConfig({ DATA_SOURCE: "demo" });

    expect(config).toMatchObject({
      dataSource: "demo",
      openAIModel: "gpt-5-mini",
      businessTimezone: "Asia/Kolkata",
    });
  });

  it("returns safe readiness status without secret values", () => {
    const status = getConfigurationStatus({
      DATA_SOURCE: "monday",
      MONDAY_API_TOKEN: "super-secret-token",
      MONDAY_DEALS_BOARD_ID: "123",
      MONDAY_WORK_ORDERS_BOARD_ID: "456",
      OPENAI_API_KEY: "super-secret-model-key",
    });

    expect(status).toEqual({
      dataSource: "monday",
      mondayConfigured: true,
      modelConfigured: true,
      dealsBoardConfigured: true,
      workOrdersBoardConfigured: true,
    });
    expect(JSON.stringify(status)).not.toContain("super-secret");
  });
});
