import { Users } from "lucide-react";
import type {
  PayrollDay,
  PayrollMetric,
  PayrollStaffShift,
} from "../data/mockRestaurantData";
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
  staffShifts: PayrollStaffShift[];
}

export function PayrollIntelligence({
  metrics,
  payroll,
  staffShifts,
}: PayrollIntelligenceProps) {
  const weeklySales = payroll.reduce((total, day) => total + day.sales, 0);
  const totalStaffHours = staffShifts.reduce(
    (total, shift) => total + shift.regularHours + shift.overtimeHours,
    0,
  );
  const totalOvertimeHours = staffShifts.reduce(
    (total, shift) => total + shift.overtimeHours,
    0,
  );
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

      <div className="subsection-heading">
        <div>
          <h3>Staff Hours Breakdown</h3>
          <p>Who worked, shift length, overtime, and estimated labor cost.</p>
        </div>
        <span>
          {totalStaffHours.toFixed(1)} total hours |{" "}
          {totalOvertimeHours.toFixed(1)} OT hours
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Staff</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Regular Hours</th>
              <th>OT Hours</th>
              <th>Total Hours</th>
              <th>Rate</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {staffShifts.map((shift) => {
              const totalHours = shift.regularHours + shift.overtimeHours;

              return (
                <tr key={shift.id}>
                  <td>
                    <strong>{shift.day}</strong>
                  </td>
                  <td>{shift.employeeName}</td>
                  <td>{shift.role}</td>
                  <td>{shift.shift}</td>
                  <td>{shift.regularHours.toFixed(1)}</td>
                  <td>{shift.overtimeHours.toFixed(1)}</td>
                  <td>{totalHours.toFixed(1)}</td>
                  <td>{formatCurrency(shift.hourlyRate)}</td>
                  <td>{formatCurrency(shift.payrollCost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
