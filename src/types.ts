export type ReportType =
  | "overall"
  | "inventory"
  | "menu"
  | "payroll"
  | "projection";

export type RestoPilotEventPayload =
  | {
      event: "generate_report";
      reportType: ReportType;
      source: "dashboard";
    }
  | {
      event: "ask_ai";
      question: string;
      source: "dashboard";
    }
  | {
      event: "refresh_dashboard";
      source: "dashboard";
    };

export interface ForecastScenario {
  name: string;
  description: string;
  profitImpact: number;
  severity: "Positive" | "Negative" | "Neutral";
}

export interface ForecastData {
  next7DaysRevenue: number;
  next7DaysFoodCost: number;
  next7DaysPayroll: number;
  next7DaysExpenses: number;
  next7DaysProfit: number;
  confidence: "Low" | "Medium" | "High";
  trend: string;
  revenueForecast: Array<{
    date: string;
    projectedRevenue: number;
  }>;
  scenarios: ForecastScenario[];
}

export interface N8nReportResponse {
  success: true;
  event: "generate_report";
  reportType: ReportType;
  generatedAt: string;
  healthScore?: number;
  totalEstimatedLeakage?: number;
  report: string;
  metrics?: Record<string, unknown>;
  intelligence?: Record<string, unknown>;
  forecast?: ForecastData | Record<string, unknown>;
}

export interface N8nAskAiResponse {
  success: true;
  event: "ask_ai";
  answer: string;
  metrics?: Record<string, unknown>;
  intelligence?: Record<string, unknown>;
  forecast?: ForecastData | Record<string, unknown>;
}

export interface N8nRefreshDashboardResponse {
  success: true;
  event: "refresh_dashboard";
  generatedAt?: string;
  healthScore?: number;
  totalEstimatedLeakage?: number;
  metrics?: Record<string, unknown>;
  intelligence?: Record<string, unknown>;
  forecast?: ForecastData | Record<string, unknown>;
}
