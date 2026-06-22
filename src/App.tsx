import {
  Activity,
  AlertTriangle,
  Banknote,
  Clock3,
  CircleDollarSign,
  ClipboardList,
  Moon,
  PackageCheck,
  Percent,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingUp,
  Truck,
  Utensils,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AiActionBox } from "./components/AiActionBox";
import { AiConsultant } from "./components/AiConsultant";
import { AiReportsPanel } from "./components/AiReportsPanel";
import { BusinessProjection } from "./components/BusinessProjection";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { ForecastScenarioSimulator } from "./components/ForecastScenarioSimulator";
import { InventoryRiskTable } from "./components/InventoryRiskTable";
import { KpiCard } from "./components/KpiCard";
import { MenuProfitabilityTable } from "./components/MenuProfitabilityTable";
import { PayrollIntelligence } from "./components/PayrollIntelligence";
import { PageReportAction } from "./components/PageReportAction";
import { ProfitLeakDetector } from "./components/ProfitLeakDetector";
import { Sidebar } from "./components/Sidebar";
import {
  mockRestaurantData,
  type RestaurantData,
} from "./data/mockRestaurantData";
import { refreshDashboardFromAutomation } from "./services/n8nApi";
import type {
  AutomationDashboardPayload,
  DashboardPage,
  DataSourceMode,
  ForecastData,
  ReportType,
} from "./types";
import { applyAutomationRefresh } from "./utils/automationRefresh";
import {
  calculateDaysLeft,
  calculateEstimatedProfit,
  calculateHealthScore,
  calculateMarginPercent,
  calculateTotalLeakage,
  formatCurrency,
  formatPercent,
} from "./utils/calculations";

const cloneData = (data: RestaurantData): RestaurantData =>
  JSON.parse(JSON.stringify(data)) as RestaurantData;

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  const savedTheme = window.localStorage.getItem("restopilot-theme");
  const initialTheme =
    savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  document.documentElement.dataset.theme = initialTheme;
  return initialTheme;
};

type OverviewLayoutPreset =
  | "Owner Summary"
  | "Profit Leaks"
  | "Inventory Risk"
  | "Forecast View"
  | "Payroll View"
  | "Menu Pricing";

const overviewLayoutPresets: Record<OverviewLayoutPreset, string[]> = {
  "Owner Summary": [
    "revenue",
    "estimated-profit",
    "profit-margin",
    "health-score",
    "estimated-leakage",
    "food-cost-percent",
    "payroll-percent",
    "forecast-revenue",
  ],
  "Profit Leaks": [
    "estimated-leakage",
    "biggest-leak",
    "food-cost-percent",
    "menu-pricing-leakage",
    "inventory-risk-count",
    "payroll-percent",
    "recommended-action",
  ],
  "Inventory Risk": [
    "critical-items",
    "watch-items",
    "safe-items",
    "top-reorder-priority",
    "lowest-days-left",
    "stockout-impact",
    "supplier-count",
  ],
  "Forecast View": [
    "forecast-revenue",
    "forecast-profit",
    "forecast-confidence",
    "forecast-trend",
    "best-scenario",
    "worst-scenario",
    "forecast-main-risk",
  ],
  "Payroll View": [
    "gross-payroll",
    "net-payroll",
    "overtime-cost",
    "payroll-percent",
    "staff-count",
    "payroll-status",
  ],
  "Menu Pricing": [
    "underpriced-items",
    "average-margin",
    "food-cost-percent",
    "menu-pricing-leakage",
    "top-underpriced-item",
    "recommended-price-action",
  ],
};

const overviewLayoutOptions = Object.keys(
  overviewLayoutPresets,
) as OverviewLayoutPreset[];

const detectOverviewLayout = (request: string): OverviewLayoutPreset => {
  const normalizedRequest = request.toLowerCase();

  if (
    ["inventory", "stock", "reorder", "supplier"].some((keyword) =>
      normalizedRequest.includes(keyword),
    )
  ) {
    return "Inventory Risk";
  }

  if (
    ["leak", "loss", "profit leak", "waste", "margin issue"].some(
      (keyword) => normalizedRequest.includes(keyword),
    )
  ) {
    return "Profit Leaks";
  }

  if (
    ["forecast", "projection", "next week", "next 7 days"].some((keyword) =>
      normalizedRequest.includes(keyword),
    )
  ) {
    return "Forecast View";
  }

  if (
    ["payroll", "staff", "overtime", "labor"].some((keyword) =>
      normalizedRequest.includes(keyword),
    )
  ) {
    return "Payroll View";
  }

  if (
    ["menu", "pricing", "price", "food cost", "margin"].some((keyword) =>
      normalizedRequest.includes(keyword),
    )
  ) {
    return "Menu Pricing";
  }

  return "Owner Summary";
};

const pageMeta: Record<DashboardPage, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Owner snapshot",
    title: "Overview",
    description: "High-level business health, profit, leakage, and forecast signals.",
  },
  "profit-leaks": {
    eyebrow: "Money at risk",
    title: "Profit Leaks",
    description: "Ranked leakage signals and AI-recommended operating actions.",
  },
  forecast: {
    eyebrow: "Forward view",
    title: "Forecast",
    description: "Next 7 days revenue, profit, confidence, and scenario impact.",
  },
  inventory: {
    eyebrow: "Stock control",
    title: "Inventory",
    description: "Critical reorder needs, coverage risk, and supplier-ready actions.",
  },
  "menu-pricing": {
    eyebrow: "Margin control",
    title: "Menu Pricing",
    description: "Menu margin health, pricing opportunities, and item-level recommendations.",
  },
  payroll: {
    eyebrow: "Labor intelligence",
    title: "Payroll",
    description: "Readable payroll summaries, filters, and shift optimization signals.",
  },
  reports: {
    eyebrow: "Automation outputs",
    title: "Reports",
    description: "Generate AI reports and dispatch daily summaries through n8n.",
  },
};

interface OverviewCardDefinition {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: "emerald" | "amber" | "coral" | "blue" | "violet" | "ink";
  icon: LucideIcon;
}

interface DashboardState {
  data: RestaurantData;
  forecast?: ForecastData;
  healthScore?: number;
  totalEstimatedLeakage?: number;
  generatedAt: Date;
  dataSourceMode: DataSourceMode;
  latestAutomationPayload?: AutomationDashboardPayload;
}

const pageReportTypes: Partial<Record<DashboardPage, ReportType>> = {
  overview: "overall",
  "profit-leaks": "overall",
  forecast: "projection",
  inventory: "inventory",
  "menu-pricing": "menu",
  payroll: "payroll",
};

function App() {
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [dashboard, setDashboard] = useState<DashboardState>(() => ({
    data: cloneData(mockRestaurantData),
    generatedAt: new Date(),
    dataSourceMode: "CSV sample data",
  }));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [activeOverviewLayout, setActiveOverviewLayout] =
    useState<OverviewLayoutPreset>("Owner Summary");
  const [overviewCardIds, setOverviewCardIds] = useState<string[]>(
    overviewLayoutPresets["Owner Summary"],
  );
  const [overviewIntent, setOverviewIntent] = useState("");
  const [overviewLayoutNote, setOverviewLayoutNote] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("restopilot-theme", theme);
  }, [theme]);

  const {
    data,
    dataSourceMode,
    forecast: automationForecast,
    generatedAt: lastSynced,
    healthScore: automationHealthScore,
    totalEstimatedLeakage: automationTotalLeakage,
  } = dashboard;

  const derivedTotalLeakage = useMemo(
    () => calculateTotalLeakage(data.profitLeaks),
    [data.profitLeaks],
  );

  const totalLeakage = automationTotalLeakage ?? derivedTotalLeakage;

  const criticalInventoryCount =
    data.inventorySummary?.criticalCount ??
    data.inventory.filter((item) => item.status === "Critical").length;
  const watchInventoryCount =
    data.inventorySummary?.watchCount ??
    data.inventory.filter((item) => item.status === "Watch").length;
  const safeInventoryCount =
    data.inventorySummary?.safeCount ??
    data.inventory.filter((item) => item.status === "Safe").length;
  const inventoryRiskCount = criticalInventoryCount + watchInventoryCount;
  const inventoryByPriority = [...data.inventory].sort((a, b) => {
    const statusRank = { Critical: 0, Watch: 1, Safe: 2 };
    const statusDifference = statusRank[a.status] - statusRank[b.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return (
      calculateDaysLeft(a.currentStock, a.dailyUsage) -
      calculateDaysLeft(b.currentStock, b.dailyUsage)
    );
  });
  const topReorderPriority = inventoryByPriority.find(
    (item) => item.status !== "Safe",
  );
  const lowestCoverageItem = [...data.inventory]
    .filter((item) => item.dailyUsage > 0)
    .sort(
      (a, b) =>
        calculateDaysLeft(a.currentStock, a.dailyUsage) -
        calculateDaysLeft(b.currentStock, b.dailyUsage),
    )[0];
  const supplierCount = new Set(
    data.inventory
      .map((item) => item.supplier)
      .filter((supplier): supplier is string => Boolean(supplier)),
  ).size;

  const menuItemsWithMargin = data.menuProfitability.map((item) => ({
    ...item,
    margin: calculateMarginPercent(item.sellingPrice, item.foodCost),
  }));
  const underpricedItems = menuItemsWithMargin.filter(
    (item) => item.margin < item.targetMarginPercent,
  );
  const underpricedMenuItems = underpricedItems.length;
  const averageMenuMargin = menuItemsWithMargin.length
    ? menuItemsWithMargin.reduce((total, item) => total + item.margin, 0) /
      menuItemsWithMargin.length
    : 0;
  const topUnderpricedItem = [...underpricedItems].sort(
    (a, b) =>
      b.targetMarginPercent - b.margin - (a.targetMarginPercent - a.margin),
  )[0];

  const rankedProfitLeaks = [...data.profitLeaks].sort(
    (a, b) => b.estimatedWeeklyLoss - a.estimatedWeeklyLoss,
  );
  const biggestLeak = rankedProfitLeaks[0];
  const menuPricingLeakage = data.profitLeaks
    .filter((leak) =>
      `${leak.category} ${leak.source}`.toLowerCase().includes("menu"),
    )
    .reduce((total, leak) => total + leak.estimatedWeeklyLoss, 0);
  const estimatedStockoutImpact = data.profitLeaks
    .filter((leak) => {
      const searchableLeak = `${leak.category} ${leak.source}`.toLowerCase();
      return (
        searchableLeak.includes("inventory") ||
        searchableLeak.includes("stockout") ||
        searchableLeak.includes("stock out")
      );
    })
    .reduce((total, leak) => total + leak.estimatedWeeklyLoss, 0);

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

  const profitMargin = data.overview.revenueThisWeek > 0
    ? (estimatedProfit / data.overview.revenueThisWeek) * 100
    : 0;

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
  const forecastRevenue = automationForecast?.next7DaysRevenue ??
    data.businessProjection.projectedNextWeekRevenue;
  const forecastProfit = automationForecast?.next7DaysProfit ??
    data.businessProjection.projectedNextWeekProfit;
  const bestForecastScenario = automationForecast?.scenarios
    .slice()
    .sort((a, b) => b.profitImpact - a.profitImpact)[0];
  const worstForecastScenario = automationForecast?.scenarios
    .slice()
    .sort((a, b) => a.profitImpact - b.profitImpact)[0];
  const overtimeCost =
    data.payrollMetrics.overtimeCost ??
    data.payrollStaffShifts.reduce(
      (total, shift) =>
        total + shift.overtimeHours * shift.hourlyRate * 1.25,
      0,
    );
  const payrollStaffCount =
    data.payrollMetrics.staffCount ??
    new Set(data.payrollStaffShifts.map((shift) => shift.employeeName)).size;
  const payrollStatus =
    data.payrollMetrics.payrollStatus ||
    (data.overview.payrollPercent <= 26
      ? "On Track"
      : data.overview.payrollPercent > 28
        ? "High"
        : "Watch");

  const overviewCards: OverviewCardDefinition[] = [
    {
      id: "revenue",
      label: "Revenue",
      value: formatCurrency(data.overview.revenueThisWeek),
      helper: "Current week revenue snapshot",
      tone: "blue",
      icon: CircleDollarSign,
    },
    {
      id: "estimated-profit",
      label: "Estimated Profit",
      value: formatCurrency(estimatedProfit),
      helper: "After food, payroll, and operating costs",
      tone: "emerald",
      icon: Banknote,
    },
    {
      id: "profit-margin",
      label: "Profit Margin",
      value: formatPercent(profitMargin),
      helper: "Estimated profit as a share of revenue",
      tone: "emerald",
      icon: TrendingUp,
    },
    {
      id: "food-cost-percent",
      label: "Food Cost %",
      value: formatPercent(data.overview.foodCostPercent),
      helper: "Target is around 30% to 32%",
      tone: "amber",
      icon: Percent,
    },
    {
      id: "payroll-percent",
      label: "Payroll % of Sales",
      value: formatPercent(data.overview.payrollPercent),
      helper: "Target range is 22% to 26%",
      tone: "coral",
      icon: ClipboardList,
    },
    {
      id: "health-score",
      label: "Health Score",
      value: healthScore + "/100",
      helper: "Weighted by cost, labor, leakage, and stock risk",
      tone: "emerald",
      icon: Activity,
    },
    {
      id: "estimated-leakage",
      label: "Estimated Leakage",
      value: formatCurrency(totalLeakage),
      helper: "Latest leakage intelligence",
      tone: "coral",
      icon: AlertTriangle,
    },
    {
      id: "biggest-leak",
      label: "Biggest Leak",
      value: biggestLeak?.source ?? "No active leak",
      helper: biggestLeak
        ? formatCurrency(biggestLeak.estimatedWeeklyLoss) + " estimated impact"
        : "No current profit leak signal",
      tone: "coral",
      icon: ShieldAlert,
    },
    {
      id: "menu-pricing-leakage",
      label: "Menu Pricing Leakage",
      value: formatCurrency(menuPricingLeakage),
      helper: "Leakage attributed to menu pricing signals",
      tone: "amber",
      icon: Utensils,
    },
    {
      id: "inventory-risk-count",
      label: "Inventory Risk Count",
      value: String(inventoryRiskCount),
      helper: "Critical and watch inventory items",
      tone: "violet",
      icon: PackageCheck,
    },
    {
      id: "recommended-action",
      label: "Recommended Action",
      value: biggestLeak?.recommendedAction ?? "No action required",
      helper: biggestLeak?.source ?? "No active profit leak signal",
      tone: "coral",
      icon: Sparkles,
    },
    {
      id: "critical-items",
      label: "Critical Items",
      value: String(criticalInventoryCount),
      helper: "Items that need immediate reorder attention",
      tone: "coral",
      icon: ShieldAlert,
    },
    {
      id: "watch-items",
      label: "Watch Items",
      value: String(watchInventoryCount),
      helper: "Items approaching reorder level",
      tone: "amber",
      icon: PackageCheck,
    },
    {
      id: "safe-items",
      label: "Safe Items",
      value: String(safeInventoryCount),
      helper: "Items with healthy stock coverage",
      tone: "emerald",
      icon: PackageCheck,
    },
    {
      id: "top-reorder-priority",
      label: "Top Reorder Priority",
      value: topReorderPriority?.item ?? "No inventory data",
      helper: topReorderPriority
        ? `${topReorderPriority.suggestedReorder} ${topReorderPriority.unit} suggested reorder`
        : "Awaiting inventory rows",
      tone: "coral",
      icon: Truck,
    },
    {
      id: "lowest-days-left",
      label: "Lowest Days Left",
      value: lowestCoverageItem
        ? calculateDaysLeft(
            lowestCoverageItem.currentStock,
            lowestCoverageItem.dailyUsage,
          ).toFixed(1) + " days"
        : "Unavailable",
      helper: lowestCoverageItem?.item ?? "Awaiting inventory rows",
      tone: "amber",
      icon: Clock3,
    },
    {
      id: "stockout-impact",
      label: "Estimated Stockout Impact",
      value: formatCurrency(estimatedStockoutImpact),
      helper: "Current inventory and stockout leakage signals",
      tone: "coral",
      icon: AlertTriangle,
    },
    {
      id: "supplier-count",
      label: "Supplier Count",
      value: String(supplierCount),
      helper: "Unique suppliers in current inventory data",
      tone: "blue",
      icon: Truck,
    },
    {
      id: "forecast-revenue",
      label: "Next 7 Days Forecast Revenue",
      value: formatCurrency(forecastRevenue),
      helper: "Automation forecast or CSV sample projection",
      tone: "blue",
      icon: TrendingUp,
    },
    {
      id: "forecast-profit",
      label: "Forecasted Profit",
      value: formatCurrency(forecastProfit),
      helper: "Projected next 7 days profit",
      tone: "emerald",
      icon: Banknote,
    },
    {
      id: "forecast-confidence",
      label: "Forecast Confidence",
      value: automationForecast?.confidence ?? "Unavailable",
      helper: "Confidence returned by current forecast data",
      tone: "violet",
      icon: Activity,
    },
    {
      id: "forecast-trend",
      label: "Trend",
      value: automationForecast?.trend ?? "Unavailable",
      helper: "Current forecast trend",
      tone: "blue",
      icon: TrendingUp,
    },
    {
      id: "best-scenario",
      label: "Best Scenario",
      value: bestForecastScenario?.name ?? "Unavailable",
      helper: bestForecastScenario
        ? formatCurrency(bestForecastScenario.profitImpact) + " profit impact"
        : "Awaiting live scenarios",
      tone: "emerald",
      icon: TrendingUp,
    },
    {
      id: "worst-scenario",
      label: "Worst Scenario",
      value: worstForecastScenario?.name ?? "Unavailable",
      helper: worstForecastScenario
        ? formatCurrency(worstForecastScenario.profitImpact) + " profit impact"
        : "Awaiting live scenarios",
      tone: "coral",
      icon: AlertTriangle,
    },
    {
      id: "forecast-main-risk",
      label: "Main Forecast Risk",
      value: data.businessProjection.riskSummary || "Unavailable",
      helper: "Current projection risk summary",
      tone: "amber",
      icon: ShieldAlert,
    },
    {
      id: "gross-payroll",
      label: "Gross Payroll",
      value: formatCurrency(data.payrollMetrics.totalPayrollThisWeek),
      helper: "Gross payroll in current dashboard data",
      tone: "blue",
      icon: Users,
    },
    {
      id: "net-payroll",
      label: "Net Payroll",
      value:
        data.payrollMetrics.netPayroll !== undefined
          ? formatCurrency(data.payrollMetrics.netPayroll)
          : "Unavailable",
      helper: "Uses live net payroll when supplied",
      tone: "emerald",
      icon: Banknote,
    },
    {
      id: "overtime-cost",
      label: "Overtime Cost",
      value: formatCurrency(overtimeCost),
      helper: "Live summary or calculated from current shift rows",
      tone: "coral",
      icon: Clock3,
    },
    {
      id: "staff-count",
      label: "Staff Count",
      value: String(payrollStaffCount),
      helper: "Unique staff in current payroll data",
      tone: "violet",
      icon: Users,
    },
    {
      id: "payroll-status",
      label: "Payroll Status",
      value: payrollStatus,
      helper: "Compared with the current payroll target range",
      tone: payrollStatus === "On Track" ? "emerald" : "amber",
      icon: ClipboardList,
    },
    {
      id: "underpriced-items",
      label: "Underpriced Items",
      value: String(underpricedMenuItems),
      helper: "Items below target margin",
      tone: "amber",
      icon: Utensils,
    },
    {
      id: "average-margin",
      label: "Average Margin",
      value: formatPercent(averageMenuMargin),
      helper: "Average margin across current menu items",
      tone: "emerald",
      icon: Percent,
    },
    {
      id: "top-underpriced-item",
      label: "Top Underpriced Item",
      value: topUnderpricedItem?.menuItem ?? "No underpriced item",
      helper: topUnderpricedItem
        ? formatPercent(topUnderpricedItem.margin) + " current margin"
        : "All current items meet target",
      tone: "amber",
      icon: Utensils,
    },
    {
      id: "recommended-price-action",
      label: "Recommended Price Action",
      value: topUnderpricedItem?.recommendation ?? "No action required",
      helper: topUnderpricedItem?.menuItem ?? "No underpriced item",
      tone: "amber",
      icon: Sparkles,
    },
  ];

  const overviewCardsById = new Map(
    overviewCards.map((card) => [card.id, card]),
  );
  const visibleOverviewCards = overviewCardIds
    .map((cardId) => overviewCardsById.get(cardId))
    .filter((card): card is OverviewCardDefinition => Boolean(card));

  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      const response = await refreshDashboardFromAutomation();

      console.log("Refresh dashboard response", response);

      setDashboard((currentDashboard) => {
        const appliedRefresh = applyAutomationRefresh(
          currentDashboard.data,
          response,
        );

        return {
          data: appliedRefresh.data,
          forecast: appliedRefresh.forecast,
          healthScore: appliedRefresh.healthScore,
          totalEstimatedLeakage: appliedRefresh.totalEstimatedLeakage,
          generatedAt: appliedRefresh.generatedAt ?? new Date(),
          dataSourceMode: "Live n8n data",
          latestAutomationPayload: response,
        };
      });

      console.log("Updated dashboard state", response.generatedAt);
      setRefreshWarning(null);
    } catch (error) {
      console.warn(error);
      setDashboard({
        data: cloneData(mockRestaurantData),
        generatedAt: new Date(),
        dataSourceMode: "Demo fallback data",
      });
      setRefreshWarning("Using demo data because live automation is unavailable.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyAutomationContext = (payload: AutomationDashboardPayload) => {
    setDashboard((currentDashboard) => {
      const appliedRefresh = applyAutomationRefresh(
        currentDashboard.data,
        payload,
      );

      return {
        data: appliedRefresh.data,
        forecast: appliedRefresh.forecast ?? currentDashboard.forecast,
        healthScore: appliedRefresh.healthScore ?? currentDashboard.healthScore,
        totalEstimatedLeakage:
          appliedRefresh.totalEstimatedLeakage ??
          currentDashboard.totalEstimatedLeakage,
        generatedAt: appliedRefresh.generatedAt ?? currentDashboard.generatedAt,
        dataSourceMode: "Live n8n data",
        latestAutomationPayload: payload,
      };
    });
  };

  const applyOverviewLayout = (layout: OverviewLayoutPreset) => {
    setActiveOverviewLayout(layout);
    setOverviewCardIds([...overviewLayoutPresets[layout]]);
    setOverviewLayoutNote(`AI-assisted layout applied: ${layout}`);
  };

  const applyOverviewCustomization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyOverviewLayout(detectOverviewLayout(overviewIntent.trim()));
  };

  const page = pageMeta[activePage];
  const pageReportType = pageReportTypes[activePage];
  const pageFallbackReport = pageReportType
    ? data.reportTemplates.find((report) => report.id === pageReportType)
    : undefined;

  const renderActivePage = () => {
    if (activePage === "overview") {
      return (
        <>
          <ExecutiveSummary
            data={data}
            estimatedProfit={estimatedProfit}
            healthScore={healthScore}
            totalLeakage={totalLeakage}
          />

          <section className="overview-ai-control" aria-label="AI overview customization">
            <div>
              <span>
                <Sparkles aria-hidden="true" size={16} />
                AI layout assistant
              </span>
              <strong>Customize the Overview focus</strong>
            </div>

            <div className="overview-layout-presets" aria-label="Overview layout presets">
              {overviewLayoutOptions.map((layout) => (
                <button
                  aria-pressed={activeOverviewLayout === layout}
                  className={
                    activeOverviewLayout === layout
                      ? "filter-chip filter-chip--active"
                      : "filter-chip"
                  }
                  key={layout}
                  onClick={() => applyOverviewLayout(layout)}
                  type="button"
                >
                  {layout}
                </button>
              ))}
            </div>

            <form onSubmit={applyOverviewCustomization}>
              <input
                aria-label="Customize overview metrics"
                onChange={(event) => setOverviewIntent(event.target.value)}
                placeholder="Try: Focus on inventory risk, payroll, menu pricing, or next week..."
                type="text"
                value={overviewIntent}
              />
              <button className="button button--primary" type="submit">
                <Sparkles aria-hidden="true" size={17} />
                Apply
              </button>
            </form>
            {overviewLayoutNote ? <p>{overviewLayoutNote}</p> : null}
          </section>

          <section className="kpi-grid" aria-label="Executive KPIs">
            {visibleOverviewCards.map((kpi) => (
              <KpiCard
                helper={kpi.helper}
                icon={kpi.icon}
                key={kpi.id}
                label={kpi.label}
                tone={kpi.tone}
                value={kpi.value}
              />
            ))}
          </section>
        </>
      );
    }

    if (activePage === "profit-leaks") {
      return (
        <ProfitLeakDetector
          leaks={data.profitLeaks}
          onAutomationContext={applyAutomationContext}
          totalLeakage={totalLeakage}
        />
      );
    }

    if (activePage === "forecast") {
      return (
        <>
          <ForecastScenarioSimulator forecast={automationForecast} />
          <AiActionBox
            defaultQuestion="What could hurt next week's profit?"
            helper="Ask about forecast risk, weekend prep, or ingredient cost scenarios."
            onAutomationContext={applyAutomationContext}
            placeholder="Ask about forecast risk..."
            suggestedQuestions={[
              "What could hurt next week's profit?",
              "What should we prepare for this weekend?",
              "What happens if ingredient costs increase?",
            ]}
            title="Ask about forecast risk"
          />
          <BusinessProjection projection={data.businessProjection} />
        </>
      );
    }

    if (activePage === "inventory") {
      return (
        <>
          <InventoryRiskTable
            items={data.inventory}
            summary={data.inventorySummary}
          />
          <AiActionBox
            defaultQuestion="Which inventory items should I reorder first and why?"
            helper="Use this for reorder priority and supplier timing decisions."
            onAutomationContext={applyAutomationContext}
            placeholder="Ask which inventory items need attention..."
            suggestedQuestions={[
              "Which inventory items should I reorder first and why?",
              "Explain reorder priority for today.",
            ]}
            title="Inventory AI helper"
          />
        </>
      );
    }

    if (activePage === "menu-pricing") {
      return (
        <>
          <MenuProfitabilityTable items={data.menuProfitability} />
          <AiActionBox
            defaultQuestion="Which menu items should I adjust first and why?"
            helper="Get pricing explanation without calling AI directly from React."
            onAutomationContext={applyAutomationContext}
            placeholder="Ask for pricing explanation..."
            suggestedQuestions={[
              "Which menu items should I adjust first and why?",
              "What should I bundle with high-margin items?",
            ]}
            title="Menu pricing AI helper"
          />
        </>
      );
    }

    if (activePage === "payroll") {
      return (
        <>
          <PayrollIntelligence
            metrics={data.payrollMetrics}
            payroll={data.payroll}
            staffShifts={data.payrollStaffShifts}
          />
          <AiActionBox
            defaultQuestion="Analyze payroll efficiency and overtime risks. What should I adjust?"
            helper="Frames insights as staffing, shift, and role optimization."
            onAutomationContext={applyAutomationContext}
            placeholder="Ask about payroll efficiency..."
            suggestedQuestions={[
              "Analyze payroll efficiency and overtime risks. What should I adjust?",
              "Is payroll efficient this week?",
            ]}
            title="Payroll AI helper"
          />
        </>
      );
    }

    return (
      <AiReportsPanel
        dashboardHealthScore={healthScore}
        dashboardTotalLeakage={totalLeakage}
        reports={data.reportTemplates}
      />
    );
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />

      <main className="main-content">
        <header className="topbar">
          <div className="page-title-block">
            <p className="eyebrow">{data.restaurant.location} · {page.eyebrow}</p>
            <div className="page-title-row">
              <h1>{page.title}</h1>
              {pageReportType && pageFallbackReport ? (
                <PageReportAction
                  fallbackReport={pageFallbackReport}
                  pageLabel={page.title}
                  reportType={pageReportType}
                />
              ) : null}
            </div>
            <span>{page.description}</span>
          </div>

          <div className="sync-cluster">
            <span>Last updated: {lastSynced.toLocaleString()}</span>
            <span className="data-source-pill">Data source: {dataSourceMode}</span>
            <button
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="button button--ghost theme-toggle"
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "dark" ? "light" : "dark",
                )
              }
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              type="button"
            >
              {theme === "dark" ? (
                <Sun aria-hidden="true" size={18} />
              ) : (
                <Moon aria-hidden="true" size={18} />
              )}
            </button>
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

        <div className="page-stack">{renderActivePage()}</div>
      </main>

      <AiConsultant
        onAutomationContext={applyAutomationContext}
        responses={data.consultantResponses}
      />
    </div>
  );
}

export default App;
