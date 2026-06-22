import { AlertTriangle, BrainCircuit } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProfitLeak } from "../data/mockRestaurantData";
import type { N8nAskAiResponse } from "../types";
import { formatCurrency } from "../utils/calculations";
import { AiActionBox } from "./AiActionBox";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

interface ProfitLeakDetectorProps {
  leaks: ProfitLeak[];
  totalLeakage?: number;
  onAutomationContext?: (response: N8nAskAiResponse) => void;
}

const timeframes = ["This Week", "This Month"] as const;

const categoryLabels: Record<string, string> = {
  Inventory: "Inventory stockout risk",
  "Menu pricing": "Menu pricing leak",
  Payroll: "Payroll overtime risk",
  "Food Cost": "Food cost leak",
};

export function ProfitLeakDetector({
  leaks,
  onAutomationContext,
  totalLeakage,
}: ProfitLeakDetectorProps) {
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("This Week");
  const [aiQuestion, setAiQuestion] = useState<string | undefined>();

  const rankedLeaks = useMemo(
    () => [...leaks].sort((a, b) => b.estimatedWeeklyLoss - a.estimatedWeeklyLoss),
    [leaks],
  );
  const displayedLeakage =
    totalLeakage ??
    rankedLeaks.reduce((total, leak) => total + leak.estimatedWeeklyLoss, 0);
  const biggestLeak = rankedLeaks[0];
  const leakageByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    leaks.forEach((leak) => {
      totals.set(
        leak.category,
        (totals.get(leak.category) ?? 0) + leak.estimatedWeeklyLoss,
      );
    });

    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [leaks]);

  const askAboutLeak = (leak: ProfitLeak) => {
    setAiQuestion(
      "Explain why this profit leak is happening and what action should be taken: " +
        leak.source +
        " causing " +
        formatCurrency(leak.estimatedWeeklyLoss) +
        " leakage in " +
        leak.category +
        ".",
    );
  };

  return (
    <SectionCard
      id="profit-leaks"
      eyebrow="AI profit leak detector"
      title="Profit Leakage Command Center"
      action={
        <span className="section-stat">
          <AlertTriangle aria-hidden="true" size={17} />
          {rankedLeaks.length} signals
        </span>
      }
    >
      {leaks.length === 0 ? (
        <div className="empty-state">No profit leak signals are available yet.</div>
      ) : (
        <>
          <div className="filter-bar" aria-label="Profit leak timeframe">
            {timeframes.map((option) => (
              <button
                aria-pressed={timeframe === option}
                className={timeframe === option ? "filter-chip filter-chip--active" : "filter-chip"}
                key={option}
                onClick={() => setTimeframe(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="leak-hero">
            <div>
              <span>{timeframe} estimated leakage</span>
              <strong>{formatCurrency(displayedLeakage)}</strong>
              <p>
                Biggest current leak: {biggestLeak.source} at {formatCurrency(biggestLeak.estimatedWeeklyLoss)}.
              </p>
            </div>
            <div className="leak-hero__action">
              <BrainCircuit aria-hidden="true" size={22} />
              <p>Use AI actions to explain the operational reason, then confirm the fix in the focused page.</p>
            </div>
          </div>

          <div className="category-leak-grid" aria-label="Leakage by category">
            {leakageByCategory.map(([category, amount]) => (
              <article className="category-leak-card" key={category}>
                <span>{categoryLabels[category] ?? category}</span>
                <strong>{formatCurrency(amount)}</strong>
              </article>
            ))}
          </div>

          <div className="risk-card-grid" aria-label="Ranked profit risks">
            {rankedLeaks.map((leak, index) => (
              <article className="risk-card" key={leak.id}>
                <div>
                  <span>Risk #{index + 1}</span>
                  <h3>{leak.source}</h3>
                  <p>{leak.recommendedAction}</p>
                </div>
                <div className="risk-card__footer">
                  <strong>{formatCurrency(leak.estimatedWeeklyLoss)}</strong>
                  <StatusBadge label={leak.severity} />
                </div>
                <button
                  className="button button--ghost"
                  onClick={() => askAboutLeak(leak)}
                  type="button"
                >
                  <BrainCircuit aria-hidden="true" size={16} />
                  Explain this leak
                </button>
              </article>
            ))}
          </div>

          <AiActionBox
            autoQuestion={aiQuestion}
            defaultQuestion="Explain why this profit leak is happening and what action should be taken."
            helper="Ask n8n to explain root causes and recommended actions."
            onAutomationContext={onAutomationContext}
            placeholder="Ask why a leak is happening..."
            suggestedQuestions={[
              "What is the biggest profit leak this week?",
              "Which leak should I fix first today?",
            ]}
            title="AI recommended actions"
          />

          <div className="table-wrap table-wrap--spaced">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Estimated Weekly Loss</th>
                  <th>Severity</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {rankedLeaks.map((leak) => (
                  <tr key={leak.id}>
                    <td>
                      <strong>{leak.source}</strong>
                      <span>{leak.category}</span>
                    </td>
                    <td>{formatCurrency(leak.estimatedWeeklyLoss)}</td>
                    <td>
                      <StatusBadge label={leak.severity} />
                    </td>
                    <td>{leak.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionCard>
  );
}
