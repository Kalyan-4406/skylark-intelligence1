import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";

const originalDataSource = process.env.DATA_SOURCE;
afterEach(() => {
  if (originalDataSource === undefined) delete process.env.DATA_SOURCE;
  else process.env.DATA_SOURCE = originalDataSource;
});

describe("POST /api/chat", () => {
  it("rejects invalid requests without echoing input", async () => {
    const response = await POST(new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "" }] }) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_REQUEST", message: "Enter a valid business question." } });
  });

  it("sanitizes data-source failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.DATA_SOURCE = "monday";
    const response = await POST(new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Show pipeline" }] }) }));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error.code).toBe("ANALYSIS_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("MONDAY_API_TOKEN");
    expect(errorSpy).toHaveBeenCalledWith("Chat analysis failed.", { name: "ZodError" });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("MONDAY_API_TOKEN");
  });
});
