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
import { ForecastScenarioSimulator } from "./components/ForecastScenarioSimulator";
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
import { refreshDashboardFromAutomation } from "./services/n8nApi";
import type { ForecastData } from "./types";
import { applyAutomationRefresh } from "./utils/automationRefresh";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [automationForecast, setAutomationForecast] = useState<
    ForecastData | undefined
  >();
  const [automationHealthScore, setAutomationHealthScore] = useState<
    number | undefined
  >();
  const [automationTotalLeakage, setAutomationTotalLeakage] = useState<
    number | undefined
  >();

  const derivedTotalLeakage = useMemo(
    () => calculateTotalLeakage(data.profitLeaks),
    [data.profitLeaks],
  );

  const totalLeakage = automationTotalLeakage ?? derivedTotalLeakage;

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

  const derivedHealthScore = useMemo(
    () =>
      calculateHealthScore({
        foodCostPercent: data.overview.foodCostPercent,
        payrollPercent: data.overview.payrollPercent,
        inventoryRiskCount,
        totalLeakage: derivedTotalLeakage,
        revenueThisWeek: data.overview.revenueThisWeek,
      }),
    [data.overview, inventoryRiskCount, derivedTotalLeakage],
  );

  const healthScore = automationHealthScore ?? derivedHealthScore;

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
      helper: "Latest automation snapshot",
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
      helper: "Latest leakage intelligence",
      tone: "coral",
      icon: TrendingUp,
    },
  ] as const;

  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      const automationRefresh = await refreshDashboardFromAutomation();
      const appliedRefresh = applyAutomationRefresh(data, automationRefresh);

      setData(appliedRefresh.data);
      setAutomationForecast(appliedRefresh.forecast);
      setAutomationHealthScore(appliedRefresh.healthScore);
      setAutomationTotalLeakage(appliedRefresh.totalEstimatedLeakage);
      setLastSynced(appliedRefresh.generatedAt ?? new Date());
      setRefreshWarning(null);
    } catch (error) {
      console.warn(error);
      setData(cloneData(mockRestaurantData));
      setAutomationForecast(undefined);
      setAutomationHealthScore(undefined);
      setAutomationTotalLeakage(undefined);
      setLastSynced(new Date());
      setRefreshWarning("Using demo data because live automation is unavailable.");
    } finally {
      setIsRefreshing(false);
    }
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
            <button
              className="button button--primary"
              disabled={isRefreshing}
              onClick={() => void refreshData()}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={isRefreshing ? "button-icon--spin" : undefined}
                size={18}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </header>

        {refreshWarning ? (
          <div className="report-warning refresh-warning" role="status">
            <AlertTriangle aria-hidden="true" size={16} />
            {refreshWarning}
          </div>
        ) : null}

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
        <ForecastScenarioSimulator forecast={automationForecast} />
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
