import { Users } from "lucide-react";
import type { PayrollDay, PayrollMetric } from "../data/mockRestaurantData";
import {
  calculatePayrollPercent,
  formatCurrency,
  formatPercent,
} from "../utils/calculations";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

interface PayrollIntelligenceProps {
  metrics: PayrollMetric;
  payroll: PayrollDay[];
}

export function PayrollIntelligence({
  metrics,
  payroll,
}: PayrollIntelligenceProps) {
  const weeklySales = payroll.reduce((total, day) => total + day.sales, 0);
  const payrollPercent = calculatePayrollPercent(
    metrics.totalPayrollThisWeek,
    weeklySales,
  );

  return (
    <SectionCard
      id="payroll"
      eyebrow="Payroll intelligence"
      title="Labor Efficiency"
      action={
        <span className="section-stat">
          <Users aria-hidden="true" size={17} />
          {metrics.overstaffedDays} overstaffed days
        </span>
      }
    >
      <div className="metric-strip">
        <div>
          <span>Total payroll this week</span>
          <strong>{formatCurrency(metrics.totalPayrollThisWeek)}</strong>
        </div>
        <div>
          <span>Payroll % of sales</span>
          <strong>{formatPercent(payrollPercent)}</strong>
        </div>
        <div>
          <span>Target payroll range</span>
          <strong>{metrics.targetPayrollRange}</strong>
        </div>
        <div>
          <span>Estimated leakage</span>
          <strong>{formatCurrency(metrics.estimatedPayrollLeakage)}</strong>
        </div>
      </div>

      <div className="table-wrap table-wrap--spaced">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Sales</th>
              <th>Staff Count</th>
              <th>Payroll Cost</th>
              <th>Payroll % of Sales</th>
              <th>Status</th>
              <th>AI Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((day) => (
              <tr key={day.id}>
                <td>
                  <strong>{day.day}</strong>
                </td>
                <td>{formatCurrency(day.sales)}</td>
                <td>{day.staffCount}</td>
                <td>{formatCurrency(day.payrollCost)}</td>
                <td>
                  {formatPercent(calculatePayrollPercent(day.payrollCost, day.sales))}
                </td>
                <td>
                  <StatusBadge label={day.status} />
                </td>
                <td>{day.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
