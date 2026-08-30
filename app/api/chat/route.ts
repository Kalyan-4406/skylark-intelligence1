import { NextResponse } from "next/server";
import { z } from "zod";
import { answerBusinessQuestion } from "@/lib/agent/answer";
import { createOpenAIPlanner } from "@/lib/agent/openai";
import { getServerConfig } from "@/lib/config";
import { createDataSource } from "@/lib/source-factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(2_000),
  })).min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "Enter a valid business question." } },
        { status: 400 },
      );
    }
    const config = getServerConfig();
    const planner = config.openAIApiKey
      ? createOpenAIPlanner(config.openAIApiKey, config.openAIModel)
      : undefined;
    const answer = await answerBusinessQuestion(parsed.data, {
      dataSource: createDataSource(config),
      asOf: new Date().toISOString().slice(0, 10),
      planner,
    });
    return NextResponse.json(answer);
  } catch {
    return NextResponse.json(
      { error: { code: "ANALYSIS_UNAVAILABLE", message: "The analysis could not be completed. Check the data-source configuration and try again." } },
      { status: 503 },
    );
  }
}
