import { AlertTriangle } from "lucide-react";
import type { ProfitLeak } from "../data/mockRestaurantData";
import { formatCurrency } from "../utils/calculations";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

interface ProfitLeakDetectorProps {
  leaks: ProfitLeak[];
}

export function ProfitLeakDetector({ leaks }: ProfitLeakDetectorProps) {
  return (
    <SectionCard
      id="profit-leaks"
      eyebrow="AI profit leak detector"
      title="Weekly Leakage Signals"
      action={
        <span className="section-stat">
          <AlertTriangle aria-hidden="true" size={17} />
          {leaks.length} signals
        </span>
      }
    >
      <div className="table-wrap">
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
            {leaks.map((leak) => (
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
    </SectionCard>
  );
}
