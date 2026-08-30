const MONDAY_ENDPOINT = "https://api.monday.com/v2";

export type MondayErrorKind =
  | "authentication"
  | "rate_limit"
  | "network"
  | "graphql"
  | "invalid_response";

export class MondayApiError extends Error {
  constructor(
    public readonly kind: MondayErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MondayApiError";
  }
}

interface MondayClientOptions {
  token: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class MondayClient {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: MondayClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async query<T>(query: string, variables: object): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(MONDAY_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: this.options.token,
          "API-Version": "2026-07",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new MondayApiError("network", "Could not reach monday.com.");
    }

    if (!response.ok) {
      const kind =
        response.status === 401 || response.status === 403
          ? "authentication"
          : response.status === 429
            ? "rate_limit"
            : "network";
      throw new MondayApiError(kind, "monday.com rejected the request.", response.status);
    }

    let payload: { data?: T; errors?: Array<{ message?: string }> };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new MondayApiError("invalid_response", "monday.com returned invalid JSON.");
    }
    if (payload.errors?.length) {
      throw new MondayApiError("graphql", "monday.com could not complete the board query.");
    }
    if (!payload.data) {
      throw new MondayApiError("invalid_response", "monday.com returned no data.");
    }
    return payload.data;
  }
}
