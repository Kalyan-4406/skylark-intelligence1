import { describe, expect, it } from "vitest";
import { routeQuestion } from "@/lib/agent/router";
import { answerBusinessQuestion } from "@/lib/agent/answer";
import { analyticsSnapshot } from "@/tests/fixtures/analytics-snapshot";

describe("question routing", () => {
  it("routes sector pipeline questions with extracted scope", () => {
    expect(routeQuestion("How is our energy pipeline looking?")).toMatchObject({
      kind: "tool",
      tool: "pipeline_summary",
      input: { status: "open", sector: "energy" },
    });
  });

  it("asks one focused clarification for an underspecified business question", () => {
    expect(routeQuestion("How are we doing?")).toEqual({
      kind: "clarification",
      question: "Should I focus on sales pipeline, work-order delivery, or both?",
    });
  });
});

describe("business answers", () => {
  it("returns deterministic evidence and caveats from a fresh snapshot", async () => {
    const response = await answerBusinessQuestion(
      { messages: [{ role: "user", content: "How is our energy pipeline looking?" }] },
      { dataSource: { loadSnapshot: async () => analyticsSnapshot }, asOf: "2026-08-30" },
    );

    expect(response.kind).toBe("answer");
    expect(response.markdown).toContain("Pipeline summary");
    expect(response.markdown).toContain("Pipeline Value");
    expect(response.markdown).toContain("₹");
    expect(response.markdown).not.toContain("| Construction |");
    expect(response.markdown).toContain("Low 25%, Medium 50%, High 75%");
    expect(response.source).toEqual({ mode: "demo", fetchedAt: analyticsSnapshot.fetchedAt });
  });

  it("returns leadership markdown through the same conversational contract", async () => {
    const response = await answerBusinessQuestion(
      { messages: [{ role: "user", content: "Generate a leadership update" }] },
      { dataSource: { loadSnapshot: async () => analyticsSnapshot }, asOf: "2026-08-30" },
    );

    expect(response.markdown).toContain("## Executive summary");
    expect(response.markdown).toContain("## Data-quality caveats");
  });
});
