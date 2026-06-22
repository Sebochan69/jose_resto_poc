import type {
  DeliveryChannel,
  N8nAskAiResponse,
  N8nRefreshDashboardResponse,
  N8nReportResponse,
  N8nSendDailyReportResponse,
  ReportType,
  RestoPilotEventPayload,
} from "../types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const getWebhookUrl = () => {
  const webhookUrl = import.meta.env.VITE_N8N_EVENTS_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "Missing VITE_N8N_EVENTS_WEBHOOK_URL. Falling back to dashboard demo data.",
    );
  }

  return webhookUrl;
};

export async function sendRestoPilotEvent(
  payload: RestoPilotEventPayload,
): Promise<unknown> {
  const response = await fetch(getWebhookUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `n8n event webhook failed with status ${response.status}. Falling back to dashboard demo data.`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error(
      "n8n event webhook returned invalid JSON. Falling back to dashboard demo data.",
    );
  }
}

export async function generateAiReport(
  reportType: ReportType,
): Promise<N8nReportResponse> {
  const data = await sendRestoPilotEvent({
    event: "generate_report",
    reportType,
    source: "dashboard",
  });

  if (
    !isObject(data) ||
    data.success !== true ||
    data.event !== "generate_report" ||
    data.reportType !== reportType ||
    typeof data.generatedAt !== "string" ||
    Number.isNaN(Date.parse(data.generatedAt)) ||
    typeof data.report !== "string"
  ) {
    throw new Error(
      "n8n generate_report response was not in the expected shape. Falling back to demo report.",
    );
  }

  return data as unknown as N8nReportResponse;
}

export async function askAiConsultant(question: string): Promise<N8nAskAiResponse> {
  const data = await sendRestoPilotEvent({
    event: "ask_ai",
    question,
    source: "dashboard",
  });

  if (
    !isObject(data) ||
    data.success !== true ||
    data.event !== "ask_ai" ||
    typeof data.answer !== "string"
  ) {
    throw new Error(
      "n8n ask_ai response was not in the expected shape. Falling back to demo answer.",
    );
  }

  return data as unknown as N8nAskAiResponse;
}

export async function refreshDashboardFromAutomation(): Promise<N8nRefreshDashboardResponse> {
  const data = await sendRestoPilotEvent({
    event: "refresh_dashboard",
    source: "dashboard",
  });

  if (!isObject(data) || data.success !== true || data.event !== "refresh_dashboard") {
    throw new Error(
      "n8n refresh_dashboard response was not in the expected shape. Falling back to demo data.",
    );
  }

  return data as unknown as N8nRefreshDashboardResponse;
}

export async function sendDailyReport(
  reportType: ReportType,
  deliveryChannels: DeliveryChannel[],
): Promise<N8nSendDailyReportResponse> {
  if (deliveryChannels.length === 0) {
    throw new Error("Select at least one delivery channel before sending.");
  }

  const data = await sendRestoPilotEvent({
    event: "send_daily_report",
    source: "dashboard",
    reportType,
    deliveryChannels,
  });

  if (
    !isObject(data) ||
    typeof data.success !== "boolean" ||
    data.event !== "send_daily_report" ||
    typeof data.message !== "string"
  ) {
    throw new Error(
      "n8n send_daily_report response was not in the expected shape.",
    );
  }

  return data as unknown as N8nSendDailyReportResponse;
}
