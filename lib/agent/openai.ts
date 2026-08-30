import OpenAI from "openai";
import { z } from "zod";

import type { IntentPlanner, RoutingDecision } from "./types";
import { routeQuestion } from "./router";

const decisionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("clarification"), question: z.string().min(1) }),
  z.object({
    kind: z.literal("tool"),
    tool: z.enum(["pipeline_summary", "operations_summary", "cross_board_summary", "leadership_update"]),
    input: z.record(z.string(), z.unknown()).default({}),
  }),
]);

export function createOpenAIPlanner(apiKey: string, model: string): IntentPlanner {
  const client = new OpenAI({ apiKey });
  return {
    async plan(question: string): Promise<RoutingDecision> {
      try {
        const response = await client.responses.create({
          model,
          instructions:
            "Classify the founder's question. Return JSON only. Choose one tool: pipeline_summary, operations_summary, cross_board_summary, leadership_update; or ask one clarification. Tool input may contain sector, owner, status, from, to, or asOf. Never calculate values.",
          input: question,
        });
        return decisionSchema.parse(JSON.parse(response.output_text)) as RoutingDecision;
      } catch {
        return routeQuestion(question);
      }
    },
  };
}
