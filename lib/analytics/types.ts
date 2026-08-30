export interface AnalyticsResult {
  title: string;
  summary: string;
  metrics: Record<string, number | string>;
  rows: Array<Record<string, number | string>>;
  caveats: string[];
  quality: Record<string, number>;
}
