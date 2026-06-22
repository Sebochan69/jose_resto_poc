import {
  AlertTriangle,
  CheckCircle,
  FileText,
  LoaderCircle,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import type { AiReportTemplate } from "../data/mockRestaurantData";
import { generateAiReport, sendDailyReport } from "../services/n8nApi";
import type { DeliveryChannel, ReportType } from "../types";
import { formatCurrency } from "../utils/calculations";
import { MarkdownReport } from "./MarkdownReport";

interface PageReportActionProps {
  fallbackReport: AiReportTemplate;
  pageLabel: string;
  reportType: ReportType;
}

const getSelectedDeliveryChannels = (
  deliveryChannels: Record<DeliveryChannel, boolean>,
) =>
  (Object.entries(deliveryChannels) as Array<[DeliveryChannel, boolean]>)
    .filter(([, isEnabled]) => isEnabled)
    .map(([channel]) => channel);

export function PageReportAction({
  fallbackReport,
  pageLabel,
  reportType,
}: PageReportActionProps) {
  const [deliveryChannels, setDeliveryChannels] = useState<
    Record<DeliveryChannel, boolean>
  >({
    email: false,
    telegram: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<Date | null>(null);
  const [healthScore, setHealthScore] = useState<number | undefined>();
  const [totalEstimatedLeakage, setTotalEstimatedLeakage] = useState<
    number | undefined
  >();
  const [notice, setNotice] = useState<{
    tone: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const toggleDeliveryChannel = (channel: DeliveryChannel) => {
    setDeliveryChannels((currentChannels) => ({
      ...currentChannels,
      [channel]: !currentChannels[channel],
    }));
  };

  const generatePageReport = async () => {
    const selectedChannels = getSelectedDeliveryChannels(deliveryChannels);

    setIsGenerating(true);
    setIsOpen(true);
    setNotice(null);

    try {
      const response = await generateAiReport(reportType);
      setReportText(response.report);
      setReportGeneratedAt(new Date(response.generatedAt));
      setHealthScore(response.healthScore);
      setTotalEstimatedLeakage(response.totalEstimatedLeakage);

      if (selectedChannels.length > 0) {
        const sendResponse = await sendDailyReport(reportType, selectedChannels);
        setNotice({
          tone: sendResponse.success ? "success" : "error",
          message: sendResponse.message,
        });
      } else {
        setNotice({
          tone: "success",
          message: pageLabel + " report generated for dashboard review.",
        });
      }
    } catch (error) {
      console.warn(error);
      setReportText(null);
      setReportGeneratedAt(new Date());
      setHealthScore(undefined);
      setTotalEstimatedLeakage(undefined);
      setNotice({
        tone: "warning",
        message: "Using demo report because live automation is unavailable.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-report-action">
      <div className="page-report-action__channels" aria-label="Report delivery options">
        <label>
          <input
            checked={deliveryChannels.email}
            disabled={isGenerating}
            onChange={() => toggleDeliveryChannel("email")}
            type="checkbox"
          />
          <span>
            <Mail aria-hidden="true" size={15} />
            Gmail PDF
          </span>
        </label>
        <label>
          <input
            checked={deliveryChannels.telegram}
            disabled={isGenerating}
            onChange={() => toggleDeliveryChannel("telegram")}
            type="checkbox"
          />
          <span>
            <MessageCircle aria-hidden="true" size={15} />
            Telegram
          </span>
        </label>
      </div>

      <button
        className="button button--primary page-report-action__button"
        disabled={isGenerating}
        onClick={() => void generatePageReport()}
        type="button"
      >
        {isGenerating ? (
          <LoaderCircle
            aria-hidden="true"
            className="button-icon--spin"
            size={17}
          />
        ) : (
          <FileText aria-hidden="true" size={17} />
        )}
        {isGenerating ? "Generating..." : "Generate Report"}
      </button>

      {isOpen ? (
        <div className="page-report-popover">
          <div className="page-report-popover__header">
            <div>
              <span>{pageLabel} report</span>
              <strong>{fallbackReport.title}</strong>
            </div>
            <button
              aria-label="Close report preview"
              className="page-report-popover__close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          {notice ? (
            <div
              className={
                "daily-report-notice daily-report-notice--" +
                (notice.tone === "success" ? "success" : "error")
              }
              role="status"
            >
              {notice.tone === "success" ? (
                <CheckCircle aria-hidden="true" size={16} />
              ) : (
                <AlertTriangle aria-hidden="true" size={16} />
              )}
              {notice.message}
            </div>
          ) : null}

          {typeof healthScore === "number" || typeof totalEstimatedLeakage === "number" ? (
            <div className="report-panel__insights page-report-popover__metrics">
              {typeof healthScore === "number" ? (
                <span>
                  <strong>{healthScore}/100</strong>
                  Health score
                </span>
              ) : null}
              {typeof totalEstimatedLeakage === "number" ? (
                <span>
                  <strong>{formatCurrency(totalEstimatedLeakage)}</strong>
                  Estimated leakage
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="page-report-popover__body">
            {reportText ? (
              <MarkdownReport content={reportText} />
            ) : (
              <>
                <p>{fallbackReport.summary}</p>
                <div className="report-panel__columns">
                  <div>
                    <h4>Key Findings</h4>
                    <ul>
                      {fallbackReport.keyFindings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Recommended Actions</h4>
                    <ul>
                      {fallbackReport.recommendedActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>

          {reportGeneratedAt ? (
            <time dateTime={reportGeneratedAt.toISOString()}>
              Generated {reportGeneratedAt.toLocaleString()}
            </time>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
