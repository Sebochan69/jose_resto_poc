import {
  AlertTriangle,
  CheckCircle,
  FileText,
  LoaderCircle,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { useState } from "react";
import type { AiReportTemplate } from "../data/mockRestaurantData";
import { generateAiReport, sendDailyReport } from "../services/n8nApi";
import type { DeliveryChannel, ReportType } from "../types";
import { formatCurrency } from "../utils/calculations";
import { MarkdownReport } from "./MarkdownReport";
import { SectionCard } from "./SectionCard";

interface DisplayReport extends AiReportTemplate {
  generatedAt: Date;
  reportText?: string;
  healthScore?: number;
  totalEstimatedLeakage?: number;
}

interface AiReportsPanelProps {
  reports: AiReportTemplate[];
  dashboardHealthScore?: number;
  dashboardTotalLeakage?: number;
}

const fallbackWarning =
  "Using demo report because live automation is unavailable.";

const reportButtonLabels: Record<ReportType, string> = {
  overall: "Generate Overall AI Report",
  inventory: "Generate Inventory Report",
  menu: "Generate Menu Pricing Report",
  payroll: "Generate Payroll Report",
  projection: "Generate Business Projection Report",
};

const deliveryChannelLabels: Record<DeliveryChannel, string> = {
  email: "Email PDF report",
  telegram: "Telegram summary",
};

const getSelectedDeliveryChannels = (
  deliveryChannels: Record<DeliveryChannel, boolean>,
) =>
  (Object.entries(deliveryChannels) as Array<[DeliveryChannel, boolean]>)
    .filter(([, isEnabled]) => isEnabled)
    .map(([channel]) => channel);

export function AiReportsPanel({
  dashboardHealthScore,
  dashboardTotalLeakage,
  reports,
}: AiReportsPanelProps) {
  const [generatedReport, setGeneratedReport] = useState<DisplayReport>({
    ...reports[0],
    generatedAt: new Date(),
  });
  const [loadingReportType, setLoadingReportType] = useState<ReportType | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [deliveryChannels, setDeliveryChannels] = useState<
    Record<DeliveryChannel, boolean>
  >({
    email: true,
    telegram: true,
  });
  const [isSendingDailyReport, setIsSendingDailyReport] = useState(false);
  const [dailyReportNotice, setDailyReportNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const displayedHealthScore =
    generatedReport.healthScore ?? dashboardHealthScore;
  const displayedTotalLeakage =
    generatedReport.totalEstimatedLeakage ?? dashboardTotalLeakage;

  const toggleDeliveryChannel = (channel: DeliveryChannel) => {
    setDeliveryChannels((currentChannels) => ({
      ...currentChannels,
      [channel]: !currentChannels[channel],
    }));
  };

  const sendDailyReportFromDashboard = async () => {
    const selectedDeliveryChannels = getSelectedDeliveryChannels(deliveryChannels);

    if (selectedDeliveryChannels.length === 0) {
      setDailyReportNotice({
        tone: "error",
        message: "Select at least one delivery channel before sending.",
      });
      return;
    }

    setIsSendingDailyReport(true);
    setDailyReportNotice(null);

    try {
      const response = await sendDailyReport("overall", selectedDeliveryChannels);

      setDailyReportNotice({
        tone: response.success ? "success" : "error",
        message: response.message,
      });
    } catch (error) {
      console.warn(error);
      setDailyReportNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Daily report could not be sent by live automation.",
      });
    } finally {
      setIsSendingDailyReport(false);
    }
  };

  const generateReport = async (report: AiReportTemplate) => {
    setLoadingReportType(report.id);
    setWarning(null);

    try {
      const liveReport = await generateAiReport(report.id);

      setGeneratedReport({
        ...report,
        generatedAt: new Date(liveReport.generatedAt),
        healthScore: liveReport.healthScore,
        reportText: liveReport.report,
        totalEstimatedLeakage: liveReport.totalEstimatedLeakage,
      });
    } catch (error) {
      console.warn(error);
      setGeneratedReport({
        ...report,
        generatedAt: new Date(),
      });
      setWarning(fallbackWarning);
    } finally {
      setLoadingReportType(null);
    }
  };

  return (
    <SectionCard id="ai-reports" eyebrow="AI reports" title="Generated Reports">
      <div className="report-actions" aria-label="Report options">
        {reports.map((report) => (
          <button
            className="button button--ghost"
            disabled={loadingReportType !== null}
            key={report.id}
            onClick={() => generateReport(report)}
            type="button"
          >
            {loadingReportType === report.id ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-icon--spin"
                size={17}
              />
            ) : (
              <FileText aria-hidden="true" size={17} />
            )}
            {loadingReportType === report.id
              ? "Generating..."
              : reportButtonLabels[report.id]}
          </button>
        ))}
      </div>

      {warning ? (
        <div className="report-warning" role="status">
          <AlertTriangle aria-hidden="true" size={16} />
          {warning}
        </div>
      ) : null}

      <div className="daily-report-delivery">
        <div className="daily-report-delivery__copy">
          <span>Daily dispatch</span>
          <strong>Send Daily Report</strong>
          <p>Route today's overall report through n8n automation.</p>
        </div>

        <div className="delivery-channel-row" aria-label="Delivery channels">
          {(Object.keys(deliveryChannelLabels) as DeliveryChannel[]).map((channel) => {
            const Icon = channel === "email" ? Mail : MessageCircle;

            return (
              <label className="delivery-channel" key={channel}>
                <input
                  checked={deliveryChannels[channel]}
                  disabled={isSendingDailyReport}
                  onChange={() => toggleDeliveryChannel(channel)}
                  type="checkbox"
                />
                <span>
                  <Icon aria-hidden="true" size={16} />
                  {deliveryChannelLabels[channel]}
                </span>
              </label>
            );
          })}
        </div>

        <button
          className="button button--primary"
          disabled={isSendingDailyReport}
          onClick={() => void sendDailyReportFromDashboard()}
          type="button"
        >
          {isSendingDailyReport ? (
            <LoaderCircle
              aria-hidden="true"
              className="button-icon--spin"
              size={17}
            />
          ) : (
            <Send aria-hidden="true" size={17} />
          )}
          {isSendingDailyReport ? "Sending..." : "Send Daily Report"}
        </button>
      </div>

      {dailyReportNotice ? (
        <div
          className={`daily-report-notice daily-report-notice--${dailyReportNotice.tone}`}
          role="status"
        >
          {dailyReportNotice.tone === "success" ? (
            <CheckCircle aria-hidden="true" size={16} />
          ) : (
            <AlertTriangle aria-hidden="true" size={16} />
          )}
          {dailyReportNotice.message}
        </div>
      ) : null}

      <div className="report-panel">
        <div className="report-panel__header">
          <div>
            <span>Report title</span>
            <h3>{generatedReport.title}</h3>
          </div>
          <time dateTime={generatedReport.generatedAt.toISOString()}>
            <RefreshCw aria-hidden="true" size={16} />
            {generatedReport.generatedAt.toLocaleString()}
          </time>
        </div>

        {typeof displayedHealthScore === "number" ||
        typeof displayedTotalLeakage === "number" ? (
          <div className="report-panel__insights" aria-label="Live report metrics">
            {typeof displayedHealthScore === "number" ? (
              <span>
                <strong>{displayedHealthScore}/100</strong>
                Health score
              </span>
            ) : null}
            {typeof displayedTotalLeakage === "number" ? (
              <span>
                <strong>{formatCurrency(displayedTotalLeakage)}</strong>
                Estimated leakage
              </span>
            ) : null}
          </div>
        ) : null}

        {generatedReport.reportText ? (
          <MarkdownReport content={generatedReport.reportText} />
        ) : (
          <p>{generatedReport.summary}</p>
        )}

        {!generatedReport.reportText ? (
          <div className="report-panel__columns">
            <div>
              <h4>Key Findings</h4>
              <ul>
                {generatedReport.keyFindings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Recommended Actions</h4>
              <ul>
                {generatedReport.recommendedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
