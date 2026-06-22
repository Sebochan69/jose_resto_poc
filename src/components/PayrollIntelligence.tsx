import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
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

const allDates = "All Dates";
const allRoles = "All Roles";
const allShifts = "All Shifts";
const allStatuses = "All Statuses";
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type ShiftPeriod = "Lunch" | "Dinner" | "Closing";
type EmployeeStatus = "Normal" | "Overtime Watch";
type SortMode = "date" | "payroll" | "overtime";

const getShiftPeriod = (shift: string): ShiftPeriod => {
  const lowerShift = shift.toLowerCase();

  if (lowerShift.includes("10:00 pm") || lowerShift.includes("11:00 pm")) {
    return "Closing";
  }

  if (
    lowerShift.startsWith("8") ||
    lowerShift.startsWith("9") ||
    lowerShift.startsWith("10") ||
    lowerShift.startsWith("11")
  ) {
    return "Lunch";
  }

  return "Dinner";
};

const getEmployeeStatus = (shift: PayrollStaffShift): EmployeeStatus =>
  shift.overtimeHours > 0 ? "Overtime Watch" : "Normal";

const getDayIndex = (day: string) => {
  const index = dayOrder.indexOf(day);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export function PayrollIntelligence({
  metrics,
  payroll,
  staffShifts,
}: PayrollIntelligenceProps) {
  const [selectedDate, setSelectedDate] = useState(allDates);
  const [selectedRole, setSelectedRole] = useState(allRoles);
  const [selectedShift, setSelectedShift] = useState<typeof allShifts | ShiftPeriod>(allShifts);
  const [selectedStatus, setSelectedStatus] = useState<typeof allStatuses | EmployeeStatus>(allStatuses);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  const weeklySales = payroll.reduce((total, day) => total + day.sales, 0);
  const overtimeCost = staffShifts.reduce(
    (total, shift) => total + shift.overtimeHours * shift.hourlyRate * 1.25,
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
  const estimatedDeductions = metrics.totalPayrollThisWeek * 0.08;
  const estimatedNetPayroll = metrics.totalPayrollThisWeek - estimatedDeductions;
  const staffCount = new Set(staffShifts.map((shift) => shift.employeeName)).size;
  const payrollStatus = payrollPercent > 28 ? "Overtime Watch" : "Normal";

  const dateOptions = [allDates, ...dayOrder.filter((day) => payroll.some((item) => item.day === day))];
  const roleOptions = [
    allRoles,
    ...Array.from(new Set(staffShifts.map((shift) => shift.role))).sort(),
  ];
  const shiftOptions: Array<typeof allShifts | ShiftPeriod> = [allShifts, "Lunch", "Dinner", "Closing"];
  const statusOptions: Array<typeof allStatuses | EmployeeStatus> = [
    allStatuses,
    "Normal",
    "Overtime Watch",
  ];

  const filteredEmployees = useMemo(() => {
    const searchTerm = employeeSearch.trim().toLowerCase();

    return staffShifts
      .filter((shift) => selectedDate === allDates || shift.day === selectedDate)
      .filter((shift) => selectedRole === allRoles || shift.role === selectedRole)
      .filter(
        (shift) => selectedShift === allShifts || getShiftPeriod(shift.shift) === selectedShift,
      )
      .filter(
        (shift) =>
          selectedStatus === allStatuses || getEmployeeStatus(shift) === selectedStatus,
      )
      .filter(
        (shift) =>
          !searchTerm || shift.employeeName.toLowerCase().includes(searchTerm),
      )
      .sort((a, b) => {
        if (sortMode === "payroll") {
          return b.payrollCost - a.payrollCost;
        }

        if (sortMode === "overtime") {
          return b.overtimeHours - a.overtimeHours;
        }

        return getDayIndex(a.day) - getDayIndex(b.day);
      });
  }, [employeeSearch, selectedDate, selectedRole, selectedShift, selectedStatus, sortMode, staffShifts]);

  const visibleEmployees = showAllEmployees
    ? filteredEmployees
    : filteredEmployees.slice(0, 8);

  const roleBreakdown = useMemo(() => {
    const totals = new Map<string, number>();

    staffShifts.forEach((shift) => {
      totals.set(shift.role, (totals.get(shift.role) ?? 0) + shift.payrollCost);
    });

    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [staffShifts]);

  const shiftBreakdown = useMemo(() => {
    const totals = new Map<ShiftPeriod, number>();

    staffShifts.forEach((shift) => {
      const period = getShiftPeriod(shift.shift);
      totals.set(period, (totals.get(period) ?? 0) + shift.payrollCost);
    });

    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [staffShifts]);

  return (
    <SectionCard
      id="payroll"
      eyebrow="Payroll intelligence"
      title="Payroll Tracker"
      action={
        <span className="section-stat">
          <Users aria-hidden="true" size={17} />
          {staffCount} staff
        </span>
      }
    >
      {payroll.length === 0 && staffShifts.length === 0 ? (
        <div className="empty-state">No payroll data is available yet.</div>
      ) : (
        <>
          <div className="payroll-command-strip">
            <div>
              <span>Ready for payroll review</span>
              <strong>{formatCurrency(estimatedNetPayroll)}</strong>
              <p>Estimated net payroll after draft deductions. Use filters below to inspect who gets paid and which shifts need review.</p>
            </div>
            <div>
              <StatusBadge label={payrollStatus} />
              <p>{totalOvertimeHours.toFixed(1)} overtime hours tracked this week.</p>
            </div>
          </div>

          <div className="metric-strip metric-strip--six payroll-summary-strip">
            <div>
              <span>Gross payroll</span>
              <strong>{formatCurrency(metrics.totalPayrollThisWeek)}</strong>
            </div>
            <div>
              <span>Net payroll est.</span>
              <strong>{formatCurrency(estimatedNetPayroll)}</strong>
            </div>
            <div>
              <span>Overtime cost</span>
              <strong>{formatCurrency(overtimeCost)}</strong>
            </div>
            <div>
              <span>Payroll % sales</span>
              <strong>{formatPercent(payrollPercent)}</strong>
            </div>
            <div>
              <span>Staff count</span>
              <strong>{staffCount}</strong>
            </div>
            <div>
              <span>Target range</span>
              <strong>{metrics.targetPayrollRange}</strong>
            </div>
          </div>

          <div className="filter-bar filter-bar--stacked payroll-filter-bar" aria-label="Payroll filters">
            <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
              {dateOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              {roleOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select value={selectedShift} onChange={(event) => setSelectedShift(event.target.value as typeof allShifts | ShiftPeriod)}>
              {shiftOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as typeof allStatuses | EmployeeStatus)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="date">Sort by date</option>
              <option value="payroll">Sort by payroll cost</option>
              <option value="overtime">Sort by overtime cost</option>
            </select>
            <label className="search-field">
              <Search aria-hidden="true" size={16} />
              <input
                aria-label="Search employee"
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Search employee"
                type="search"
                value={employeeSearch}
              />
            </label>
          </div>

          <div className="subsection-heading payroll-section-heading">
            <div>
              <h3>Payment Tracking</h3>
              <p>Filtered employee-level view for gross pay, net pay, overtime, and status.</p>
            </div>
            <span>{filteredEmployees.length} matching rows</span>
          </div>

          <div className="table-wrap payroll-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>Daily Rate</th>
                  <th>OT Pay</th>
                  <th>Deductions</th>
                  <th>Gross Pay</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((shift) => {
                  const otPay = shift.overtimeHours * shift.hourlyRate * 1.25;
                  const deductions = shift.payrollCost * 0.08;
                  const netPay = shift.payrollCost - deductions;

                  return (
                    <tr key={shift.id}>
                      <td><strong>{shift.day}</strong></td>
                      <td>{shift.employeeName}</td>
                      <td>{shift.role}</td>
                      <td>{shift.shift}</td>
                      <td>{formatCurrency(shift.hourlyRate * 8)}</td>
                      <td>{formatCurrency(otPay)}</td>
                      <td>{formatCurrency(deductions)}</td>
                      <td>{formatCurrency(shift.payrollCost)}</td>
                      <td><strong>{formatCurrency(netPay)}</strong></td>
                      <td><StatusBadge label={getEmployeeStatus(shift)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length > 8 ? (
            <button
              className="button button--ghost show-more-button"
              onClick={() => setShowAllEmployees((current) => !current)}
              type="button"
            >
              {showAllEmployees ? "Show fewer rows" : "Show more employee rows"}
            </button>
          ) : null}

          <div className="breakdown-grid payroll-breakdown-grid">
            <div>
              <div className="subsection-heading subsection-heading--compact">
                <div>
                  <h3>Role Cost Breakdown</h3>
                  <p>Cost grouped by staffing function.</p>
                </div>
              </div>
              <div className="mini-list">
                {roleBreakdown.map(([role, cost]) => (
                  <span key={role}>
                    {role}
                    <strong>{formatCurrency(cost)}</strong>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="subsection-heading subsection-heading--compact">
                <div>
                  <h3>Shift Cost Breakdown</h3>
                  <p>Cost grouped by daypart.</p>
                </div>
              </div>
              <div className="mini-list">
                {shiftBreakdown.map(([shift, cost]) => (
                  <span key={shift}>
                    {shift}
                    <strong>{formatCurrency(cost)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <details className="payroll-date-details">
            <summary>
              <span>Payroll by Date</span>
              <strong>{payroll.length} days</strong>
            </summary>
            <div className="table-wrap table-wrap--spaced">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sales</th>
                    <th>Staff Count</th>
                    <th>Payroll Cost</th>
                    <th>Payroll % of Sales</th>
                    <th>Status</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((day) => (
                    <tr key={day.id}>
                      <td><strong>{day.day}</strong></td>
                      <td>{formatCurrency(day.sales)}</td>
                      <td>{day.staffCount}</td>
                      <td>{formatCurrency(day.payrollCost)}</td>
                      <td>{formatPercent(calculatePayrollPercent(day.payrollCost, day.sales))}</td>
                      <td><StatusBadge label={day.status} /></td>
                      <td>{day.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </SectionCard>
  );
}
