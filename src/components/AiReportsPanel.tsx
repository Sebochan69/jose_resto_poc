import { AlertTriangle, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { AiReportTemplate } from "../data/mockRestaurantData";
import { generateAiReport } from "../services/n8nApi";
import type { ReportType } from "../types";
import { formatCurrency } from "../utils/calculations";
import { SectionCard } from "./SectionCard";

interface DisplayReport extends AiReportTemplate {
  generatedAt: Date;
  reportText?: string;
  healthScore?: number;
  totalEstimatedLeakage?: number;
}

interface AiReportsPanelProps {
  reports: AiReportTemplate[];
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

export function AiReportsPanel({ reports }: AiReportsPanelProps) {
  const [generatedReport, setGeneratedReport] = useState<DisplayReport>({
    ...reports[0],
    generatedAt: new Date(),
  });
  const [loadingReportType, setLoadingReportType] = useState<ReportType | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

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

        {typeof generatedReport.healthScore === "number" ||
        typeof generatedReport.totalEstimatedLeakage === "number" ? (
          <div className="report-panel__insights" aria-label="Live report metrics">
            {typeof generatedReport.healthScore === "number" ? (
              <span>
                <strong>{generatedReport.healthScore}/100</strong>
                Health score
              </span>
            ) : null}
            {typeof generatedReport.totalEstimatedLeakage === "number" ? (
              <span>
                <strong>{formatCurrency(generatedReport.totalEstimatedLeakage)}</strong>
                Estimated leakage
              </span>
            ) : null}
          </div>
        ) : null}

        <p className={generatedReport.reportText ? "report-panel__body" : undefined}>
          {generatedReport.reportText ?? generatedReport.summary}
        </p>

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
