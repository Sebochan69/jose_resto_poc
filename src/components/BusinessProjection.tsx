import { Activity, BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import type { BusinessProjection as BusinessProjectionData } from "../data/mockRestaurantData";
import { formatCurrency } from "../utils/calculations";
import { SectionCard } from "./SectionCard";

interface BusinessProjectionProps {
  projection: BusinessProjectionData;
}

export function BusinessProjection({ projection }: BusinessProjectionProps) {
  return (
    <SectionCard
      id="projections"
      eyebrow="Business projection"
      title="Next Week Outlook"
      action={
        <span className="section-stat">
          <BarChart3 aria-hidden="true" size={17} />
          forecast
        </span>
      }
    >
      <div className="projection-grid">
        <div className="projection-tile projection-tile--green">
          <TrendingUp aria-hidden="true" size={22} />
          <span>Projected revenue</span>
          <strong>{formatCurrency(projection.projectedNextWeekRevenue)}</strong>
        </div>
        <div className="projection-tile projection-tile--blue">
          <Activity aria-hidden="true" size={22} />
          <span>Projected profit</span>
          <strong>{formatCurrency(projection.projectedNextWeekProfit)}</strong>
        </div>
        <div className="projection-note">
          <span>Risk summary</span>
          <p>{projection.riskSummary}</p>
        </div>
        <div className="projection-note projection-note--risk">
          <span>
            <TrendingDown aria-hidden="true" size={18} />
            What-if scenario
          </span>
          <p>{projection.whatIfScenario}</p>
        </div>
      </div>
    </SectionCard>
  );
}
