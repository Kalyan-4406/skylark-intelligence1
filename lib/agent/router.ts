import type { RoutingDecision } from "./types";

const sectors = ["energy", "mining", "powerline", "renewables", "railways", "construction", "security", "tender"];

export function routeQuestion(question: string): RoutingDecision {
  const normalized = question.trim().toLowerCase();
  if (/leadership|weekly update|executive update/.test(normalized)) {
    return { kind: "tool", tool: "leadership_update", input: {} };
  }
  if (/cross.board|conversion|deal.+work order|work order.+deal/.test(normalized)) {
    return { kind: "tool", tool: "cross_board_summary", input: {} };
  }
  if (/work order|delivery|delay|overdue|execution|billing|receivable|collection/.test(normalized)) {
    const sector = sectors.find((candidate) => normalized.includes(candidate));
    return {
      kind: "tool",
      tool: "operations_summary",
      input: sector ? { sector } : {},
    };
  }
  if (/pipeline|deal|sales|revenue|sector|owner|stage/.test(normalized)) {
    const sector = sectors.find((candidate) => normalized.includes(candidate));
    return {
      kind: "tool",
      tool: "pipeline_summary",
      input: { status: "open", ...(sector ? { sector } : {}) },
    };
  }
  return {
    kind: "clarification",
    question: "Should I focus on sales pipeline, work-order delivery, or both?",
  };
}
