import { describe, expect, it, vi } from "vitest";

import { MondayClient } from "@/lib/monday/client";

describe("MondayClient", () => {
  it("sends a versioned authenticated read query", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: { version: { value: "2026-07" } } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = new MondayClient({ token: "token-123", fetcher });

    const result = await client.query<{ version: { value: string } }>(
      "query Version { version { value } }",
      { boardId: ["123"] },
    );

    expect(result.version.value).toBe("2026-07");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.monday.com/v2");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "token-123",
      "API-Version": "2026-07",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      query: "query Version { version { value } }",
      variables: { boardId: ["123"] },
    });
  });

  it.each([
    [401, { error_message: "bad token" }, "authentication"],
    [200, { errors: [{ message: "complexity exceeded" }] }, "graphql"],
  ])("returns a safe typed error for status %s", async (status, body, kind) => {
    const client = new MondayClient({
      token: "secret",
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    });

    await expect(client.query("query { me { id } }", {})).rejects.toMatchObject({
      name: "MondayApiError",
      kind,
    });
  });
});
