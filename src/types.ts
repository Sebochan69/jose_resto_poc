export type DashboardPage =
  | "overview"
  | "profit-leaks"
  | "forecast"
  | "inventory"
  | "menu-pricing"
  | "payroll"
  | "reports";

export type DataSourceMode =
  | "Live n8n data"
  | "Demo fallback data"
  | "CSV sample data";

export type ReportType =
  | "overall"
  | "inventory"
  | "menu"
  | "payroll"
  | "projection";

export type DeliveryChannel = "email" | "telegram";

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
    }
  | {
      event: "send_daily_report";
      source: "dashboard";
      reportType: ReportType;
      deliveryChannels: DeliveryChannel[];
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

export interface AutomationDashboardPayload {
  generatedAt?: string;
  healthScore?: number;
  totalEstimatedLeakage?: number;
  metrics?: Record<string, unknown>;
  intelligence?: Record<string, unknown>;
  forecast?: ForecastData | Record<string, unknown>;
}

export interface N8nAskAiResponse extends AutomationDashboardPayload {
  success: true;
  event: "ask_ai";
  generatedAt?: string;
  question?: string;
  answer: string;
}

export interface N8nRefreshDashboardResponse extends AutomationDashboardPayload {
  success: true;
  event: "refresh_dashboard";
}

export interface N8nSendDailyReportResponse extends AutomationDashboardPayload {
  success: boolean;
  event: "send_daily_report";
  message: string;
  deliveryChannels?: DeliveryChannel[];
  emailTo?: string;
  telegramChatId?: string;
  fileName?: string;
}
