export type ReportType =
  | "overall"
  | "inventory"
  | "menu"
  | "payroll"
  | "projection";

export interface GeneratedReport {
  success: true;
  reportType: ReportType;
  generatedAt: string;
  report: string;
}

const supportedReportTypes: ReportType[] = [
  "overall",
  "inventory",
  "menu",
  "payroll",
  "projection",
];

const isReportType = (value: unknown): value is ReportType =>
  typeof value === "string" && supportedReportTypes.includes(value as ReportType);

const isGeneratedReport = (value: unknown): value is GeneratedReport => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    response.success === true &&
    isReportType(response.reportType) &&
    typeof response.generatedAt === "string" &&
    !Number.isNaN(Date.parse(response.generatedAt)) &&
    typeof response.report === "string"
  );
};

export async function generateAiReport(
  reportType: ReportType,
): Promise<GeneratedReport> {
  const webhookUrl = import.meta.env.VITE_N8N_REPORT_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "Missing VITE_N8N_REPORT_WEBHOOK_URL. Falling back to the demo report.",
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reportType }),
  });

  if (!response.ok) {
    throw new Error(
      `n8n report webhook failed with status ${response.status}. Falling back to the demo report.`,
    );
  }

  const data: unknown = await response.json();

  if (!isGeneratedReport(data) || data.reportType !== reportType) {
    throw new Error(
      "n8n report webhook returned an unexpected response. Falling back to the demo report.",
    );
  }

  return data;
}
