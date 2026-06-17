import { Sparkles, TrendingUp } from "lucide-react";
import type { RestaurantData } from "../data/mockRestaurantData";
import { formatCurrency, formatPercent } from "../utils/calculations";

interface ExecutiveSummaryProps {
  data: RestaurantData;
  healthScore: number;
  estimatedProfit: number;
  totalLeakage: number;
}

export function ExecutiveSummary({
  data,
  healthScore,
  estimatedProfit,
  totalLeakage,
}: ExecutiveSummaryProps) {
  return (
    <section id="overview" className="overview-hero">
      <div className="overview-hero__copy">
        <p className="eyebrow">Executive dashboard</p>
        <h1>{data.restaurant.name}</h1>
        <p>{data.aiSummary}</p>
      </div>

      <div className="summary-panel">
        <div className="summary-panel__header">
          <span>
            <Sparkles aria-hidden="true" size={18} />
            AI Summary
          </span>
          <strong>{healthScore}/100</strong>
        </div>
        <p>{data.aiSummary}</p>
        <div className="summary-panel__metrics">
          <span>
            Weekly profit
            <strong>{formatCurrency(estimatedProfit)}</strong>
          </span>
          <span>
            Leakage
            <strong>{formatCurrency(totalLeakage)}</strong>
          </span>
          <span>
            Payroll
            <strong>{formatPercent(data.overview.payrollPercent)}</strong>
          </span>
        </div>
        <div className="summary-panel__signal">
          <TrendingUp aria-hidden="true" size={18} />
          <span>Menu changes and lean weekday staffing can lift profit next week.</span>
        </div>
      </div>
    </section>
  );
}
