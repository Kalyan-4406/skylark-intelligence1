import type { PipelineInput } from "../analytics/pipeline";
import type { OperationsInput } from "../analytics/operations";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export type ToolPlan =
  | { kind: "tool"; tool: "pipeline_summary"; input: PipelineInput }
  | { kind: "tool"; tool: "operations_summary"; input: Partial<OperationsInput> }
  | { kind: "tool"; tool: "cross_board_summary"; input: Record<string, never> }
  | { kind: "tool"; tool: "leadership_update"; input: Record<string, never> };

export type RoutingDecision =
  | ToolPlan
  | { kind: "clarification"; question: string };

export interface ChatResponse {
  kind: "answer" | "clarification";
  markdown: string;
  source?: { mode: "monday" | "demo"; fetchedAt: string };
}

export interface IntentPlanner {
  plan(question: string): Promise<RoutingDecision>;
}
