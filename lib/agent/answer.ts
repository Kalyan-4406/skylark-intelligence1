import type { BusinessDataSource } from "../data-source";
import { generateLeadershipUpdate } from "../analytics/leadership";
import { linkDealsToWorkOrders } from "../analytics/linkage";
import { operationsSummary } from "../analytics/operations";
import { pipelineSummary } from "../analytics/pipeline";
import type { AnalyticsResult } from "../analytics/types";
import { routeQuestion } from "./router";
import type { ChatRequest, ChatResponse, IntentPlanner } from "./types";

interface AnswerDependencies {
  dataSource: BusinessDataSource;
  asOf: string;
  planner?: IntentPlanner;
}

function markdownTable(rows: AnalyticsResult["rows"]): string {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const label = (column: string) =>
    column.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  const display = (column: string, value: number | string) => {
    if (typeof value === "number" && /value|receivable|billed|collected/i.test(column)) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0,
      }).format(value);
    }
    return typeof value === "number" ? value.toLocaleString("en-IN") : value;
  };
  return [
    `| ${columns.map(label).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.slice(0, 4).map((row) => `| ${columns.map((column) => display(column, row[column])).join(" | ")} |`),
  ].join("\n");
}

function formatResult(result: AnalyticsResult): string {
  const table = markdownTable(result.rows);
  return [
    `## ${result.title}`,
    result.summary,
    table,
    result.caveats.length ? `### Data-quality caveats\n${result.caveats.map((caveat) => `- ${caveat}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function answerBusinessQuestion(
  request: ChatRequest,
  dependencies: AnswerDependencies,
): Promise<ChatResponse> {
  const question = [...request.messages].reverse().find((message) => message.role === "user")?.content.trim();
  if (!question) throw new Error("A user question is required.");

  const decision = dependencies.planner
    ? await dependencies.planner.plan(question)
    : routeQuestion(question);
  if (decision.kind === "clarification") {
    return { kind: "clarification", markdown: decision.question };
  }

  const snapshot = await dependencies.dataSource.loadSnapshot();
  let markdown: string;
  if (decision.tool === "leadership_update") {
    markdown = generateLeadershipUpdate(snapshot, { asOf: dependencies.asOf }).markdown;
  } else if (decision.tool === "pipeline_summary") {
    markdown = formatResult(pipelineSummary(snapshot, decision.input));
  } else if (decision.tool === "operations_summary") {
    markdown = formatResult(
      operationsSummary(snapshot, { asOf: dependencies.asOf, ...decision.input }),
    );
  } else {
    const linked = linkDealsToWorkOrders(snapshot.deals, snapshot.workOrders);
    markdown = [
      "## Cross-board summary",
      `${linked.matchedDeals} deals and ${linked.matchedWorkOrders} work orders matched using exact normalized names.`,
      `Unmatched: ${linked.unmatchedDeals} deals and ${linked.unmatchedWorkOrders} work orders.`,
      "### Data-quality caveats",
      "No fuzzy matching is used. Duplicate names are aggregated and should not be interpreted as one-to-one links.",
    ].join("\n\n");
  }
  return {
    kind: "answer",
    markdown,
    source: { mode: snapshot.source, fetchedAt: snapshot.fetchedAt },
  };
}
