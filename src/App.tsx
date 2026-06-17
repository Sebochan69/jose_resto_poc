import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarRange,
  CircleDollarSign,
  ClipboardList,
  Percent,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AiConsultant } from "./components/AiConsultant";
import { AiReportsPanel } from "./components/AiReportsPanel";
import { BusinessProjection } from "./components/BusinessProjection";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { InventoryRiskTable } from "./components/InventoryRiskTable";
import { KpiCard } from "./components/KpiCard";
import { MenuProfitabilityTable } from "./components/MenuProfitabilityTable";
import { PayrollIntelligence } from "./components/PayrollIntelligence";
import { ProfitLeakDetector } from "./components/ProfitLeakDetector";
import { Sidebar } from "./components/Sidebar";
import {
  mockRestaurantData,
  type RestaurantData,
} from "./data/mockRestaurantData";
import {
  calculateEstimatedProfit,
  calculateHealthScore,
  calculateTotalLeakage,
  formatCurrency,
  formatPercent,
} from "./utils/calculations";

const cloneData = (data: RestaurantData): RestaurantData =>
  JSON.parse(JSON.stringify(data)) as RestaurantData;

function App() {
  const [data, setData] = useState<RestaurantData>(() =>
    cloneData(mockRestaurantData),
  );
  const [lastSynced, setLastSynced] = useState(() => new Date());

  const totalLeakage = useMemo(
    () => calculateTotalLeakage(data.profitLeaks),
    [data.profitLeaks],
  );

  const inventoryRiskCount = useMemo(
    () => data.inventory.filter((item) => item.status !== "Safe").length,
    [data.inventory],
  );

  const estimatedProfit = useMemo(
    () =>
      calculateEstimatedProfit(
        data.overview.revenueThisWeek,
        data.overview.foodCostPercent,
        data.overview.payrollPercent,
        data.overview.otherOperatingCostPercent,
      ),
    [data.overview],
  );

  const healthScore = useMemo(
    () =>
      calculateHealthScore({
        foodCostPercent: data.overview.foodCostPercent,
        payrollPercent: data.overview.payrollPercent,
        inventoryRiskCount,
        totalLeakage,
        revenueThisWeek: data.overview.revenueThisWeek,
      }),
    [data.overview, inventoryRiskCount, totalLeakage],
  );

  const kpis = [
    {
      label: "Restaurant Health Score",
      value: `${healthScore}/100`,
      helper: "Weighted by cost, labor, leakage, and inventory risk",
      tone: "emerald",
      icon: Activity,
    },
    {
      label: "Revenue Today",
      value: formatCurrency(data.overview.revenueToday),
      helper: "Live mock sales snapshot",
      tone: "blue",
      icon: CircleDollarSign,
    },
    {
      label: "Revenue This Week",
      value: formatCurrency(data.overview.revenueThisWeek),
      helper: "Week-to-date sales",
      tone: "ink",
      icon: CalendarRange,
    },
    {
      label: "Estimated Profit",
      value: formatCurrency(estimatedProfit),
      helper: "After food, payroll, and operating costs",
      tone: "emerald",
      icon: Banknote,
    },
    {
      label: "Food Cost %",
      value: formatPercent(data.overview.foodCostPercent),
      helper: "Target is around 30% to 32%",
      tone: "amber",
      icon: Percent,
    },
    {
      label: "Payroll % of Sales",
      value: formatPercent(data.overview.payrollPercent),
      helper: "Target range is 22% to 26%",
      tone: "coral",
      icon: ClipboardList,
    },
    {
      label: "Inventory Risk Count",
      value: String(inventoryRiskCount),
      helper: "Critical and watch inventory items",
      tone: "violet",
      icon: AlertTriangle,
    },
    {
      label: "Estimated Profit Leakage",
      value: formatCurrency(totalLeakage),
      helper: "Mock weekly loss estimate",
      tone: "coral",
      icon: TrendingUp,
    },
  ] as const;

  const refreshData = () => {
    setData((currentData) => {
      const nextData = cloneData(currentData);
      const revenuePulse = 1 + (Math.random() * 0.04 - 0.012);
      const weeklyPulse = 1 + (Math.random() * 0.025 - 0.008);

      nextData.overview.revenueToday = Math.round(
        nextData.overview.revenueToday * revenuePulse,
      );
      nextData.overview.revenueThisWeek = Math.round(
        nextData.overview.revenueThisWeek * weeklyPulse,
      );
      nextData.overview.foodCostPercent = Number(
        (nextData.overview.foodCostPercent + (Math.random() - 0.45) * 0.4).toFixed(
          1,
        ),
      );
      nextData.overview.payrollPercent = Number(
        (nextData.overview.payrollPercent + (Math.random() - 0.5) * 0.3).toFixed(1),
      );

      return nextData;
    });
    setLastSynced(new Date());
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{data.restaurant.location}</p>
            <h1>JOSE RESTO POC Dashboard</h1>
            <span>{data.restaurant.serviceModel}</span>
          </div>

          <div className="sync-cluster">
            <span>Last synced: {lastSynced.toLocaleString()}</span>
            <button className="button button--primary" onClick={refreshData} type="button">
              <RefreshCw aria-hidden="true" size={18} />
              Refresh Data
            </button>
          </div>
        </header>

        <ExecutiveSummary
          data={data}
          estimatedProfit={estimatedProfit}
          healthScore={healthScore}
          totalLeakage={totalLeakage}
        />

        <section className="kpi-grid" aria-label="Executive KPIs">
          {kpis.map((kpi) => (
            <KpiCard
              helper={kpi.helper}
              icon={kpi.icon}
              key={kpi.label}
              label={kpi.label}
              tone={kpi.tone}
              value={kpi.value}
            />
          ))}
        </section>

        <ProfitLeakDetector leaks={data.profitLeaks} />
        <InventoryRiskTable items={data.inventory} />
        <MenuProfitabilityTable items={data.menuProfitability} />
        <PayrollIntelligence
          metrics={data.payrollMetrics}
          payroll={data.payroll}
          staffShifts={data.payrollStaffShifts}
        />
        <BusinessProjection projection={data.businessProjection} />
        <AiReportsPanel reports={data.reportTemplates} />
        <AiConsultant responses={data.consultantResponses} />
      </main>
    </div>
  );
}

export default App;
