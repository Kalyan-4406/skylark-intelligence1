import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ChatWorkspace", () => {
  it("shows founder prompts and sends a suggested analysis", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/api/health")) {
        return new Response(JSON.stringify({ configuration: { dataSource: "demo" } }));
      }
      return new Response(JSON.stringify({
        kind: "answer",
        markdown: "## Pipeline summary\n\n3 open deals.\n\n### Data-quality caveats\n- 1 deal was excluded.",
        source: { mode: "demo", fetchedAt: "2026-08-30T03:30:00.000Z" },
      }));
    });
    vi.stubGlobal("fetch", fetcher);
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    expect(screen.getByRole("heading", { name: "What does the business need to know?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "How is our pipeline looking this quarter?" }));

    expect(await screen.findByRole("heading", { name: "Pipeline summary" })).toBeInTheDocument();
    expect(screen.getByText("1 deal was excluded.")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
  });

  it("submits typed questions and recovers from a safe error", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/api/health")) return new Response(JSON.stringify({ configuration: { dataSource: "monday" } }));
      return new Response(JSON.stringify({ error: { message: "Analysis is temporarily unavailable." } }), { status: 503 });
    }));
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    const composer = screen.getByRole("textbox", { name: "Ask a business question" });
    await user.type(composer, "Which work orders are delayed?");
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Analysis is temporarily unavailable.");
    await waitFor(() => expect(composer).toBeEnabled());
  });
});
