import { FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { AiReportTemplate } from "../data/mockRestaurantData";
import { SectionCard } from "./SectionCard";

interface GeneratedReport extends AiReportTemplate {
  generatedAt: Date;
}

interface AiReportsPanelProps {
  reports: AiReportTemplate[];
}

export function AiReportsPanel({ reports }: AiReportsPanelProps) {
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport>({
    ...reports[0],
    generatedAt: new Date(),
  });

  const generateReport = (report: AiReportTemplate) => {
    setGeneratedReport({
      ...report,
      generatedAt: new Date(),
    });
  };

  return (
    <SectionCard id="ai-reports" eyebrow="AI reports" title="Generated Reports">
      <div className="report-actions" aria-label="Report options">
        {reports.map((report) => (
          <button
            className="button button--ghost"
            key={report.id}
            onClick={() => generateReport(report)}
            type="button"
          >
            <FileText aria-hidden="true" size={17} />
            {report.id === "overall"
              ? "Generate Overall AI Report"
              : `Generate ${report.title}`}
          </button>
        ))}
      </div>

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

        <p>{generatedReport.summary}</p>

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
      </div>
    </SectionCard>
  );
}
