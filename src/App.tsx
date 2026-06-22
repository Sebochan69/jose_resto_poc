import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarRange,
  CircleDollarSign,
  ClipboardList,
  Percent,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
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
  calculateEstimatedProfit,
  calculateHealthScore,
  calculateMarginPercent,
  calculateTotalLeakage,
  formatCurrency,
  formatPercent,
} from "./utils/calculations";

const cloneData = (data: RestaurantData): RestaurantData =>
  JSON.parse(JSON.stringify(data)) as RestaurantData;

const defaultOverviewCardIds = [
  "total-revenue",
  "estimated-profit",
  "profit-margin",
  "food-cost-percent",
  "payroll-percent",
  "health-score",
  "estimated-leakage",
  "critical-inventory",
  "underpriced-menu",
  "forecast-revenue",
];

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

const unique = (values: string[]) => Array.from(new Set(values));

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
  const [data, setData] = useState<RestaurantData>(() =>
    cloneData(mockRestaurantData),
  );
  const [lastSynced, setLastSynced] = useState(() => new Date());
  const [dataSourceMode, setDataSourceMode] =
    useState<DataSourceMode>("CSV sample data");
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
  const [overviewCardIds, setOverviewCardIds] = useState<string[]>(
    defaultOverviewCardIds,
  );
  const [overviewIntent, setOverviewIntent] = useState("");
  const [overviewLayoutNote, setOverviewLayoutNote] = useState<string | null>(null);

  const derivedTotalLeakage = useMemo(
    () => calculateTotalLeakage(data.profitLeaks),
    [data.profitLeaks],
  );

  const totalLeakage = automationTotalLeakage ?? derivedTotalLeakage;

  const criticalInventoryCount = useMemo(
    () => data.inventory.filter((item) => item.status === "Critical").length,
    [data.inventory],
  );

  const inventoryRiskCount = useMemo(
    () => data.inventory.filter((item) => item.status !== "Safe").length,
    [data.inventory],
  );

  const underpricedMenuItems = useMemo(
    () =>
      data.menuProfitability.filter(
        (item) =>
          calculateMarginPercent(item.sellingPrice, item.foodCost) <
          item.targetMarginPercent,
      ).length,
    [data.menuProfitability],
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

  const overviewCards: OverviewCardDefinition[] = [
    {
      id: "total-revenue",
      label: "Total Revenue",
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
      label: "Payroll %",
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
      id: "critical-inventory",
      label: "Critical Inventory Count",
      value: String(criticalInventoryCount),
      helper: "Items that need immediate reorder attention",
      tone: "violet",
      icon: CalendarRange,
    },
    {
      id: "underpriced-menu",
      label: "Underpriced Menu Items",
      value: String(underpricedMenuItems),
      helper: "Items below target margin",
      tone: "amber",
      icon: Utensils,
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
      id: "revenue-today",
      label: "Revenue Today",
      value: formatCurrency(data.overview.revenueToday),
      helper: "Latest daily sales snapshot",
      tone: "ink",
      icon: CircleDollarSign,
    },
  ];

  const visibleOverviewCards = overviewCards.filter((card) =>
    overviewCardIds.includes(card.id),
  );

  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      const automationRefresh = await refreshDashboardFromAutomation();
      applyAutomationContext(automationRefresh);
      setRefreshWarning(null);
      setDataSourceMode("Live n8n data");
    } catch (error) {
      console.warn(error);
      setData(cloneData(mockRestaurantData));
      setAutomationForecast(undefined);
      setAutomationHealthScore(undefined);
      setAutomationTotalLeakage(undefined);
      setLastSynced(new Date());
      setDataSourceMode("Demo fallback data");
      setRefreshWarning("Using demo data because live automation is unavailable.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyAutomationContext = (payload: AutomationDashboardPayload) => {
    const appliedRefresh = applyAutomationRefresh(data, payload);

    setData(appliedRefresh.data);
    setAutomationForecast(appliedRefresh.forecast);
    setAutomationHealthScore(appliedRefresh.healthScore);
    setAutomationTotalLeakage(appliedRefresh.totalEstimatedLeakage);
    setDataSourceMode("Live n8n data");

    if (appliedRefresh.generatedAt) {
      setLastSynced(appliedRefresh.generatedAt);
    }
  };

  const applyOverviewCustomization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const intent = overviewIntent.trim().toLowerCase();

    if (!intent) {
      setOverviewCardIds(defaultOverviewCardIds);
      setOverviewLayoutNote("AI-assisted layout reset to owner snapshot.");
      return;
    }

    const groups = [
      {
        keywords: ["owner", "owner-level", "executive", "summary"],
        cards: [
          "total-revenue",
          "estimated-profit",
          "profit-margin",
          "health-score",
          "estimated-leakage",
          "forecast-revenue",
        ],
      },
      {
        keywords: ["inventory", "stock", "reorder", "supplier"],
        cards: ["critical-inventory", "estimated-leakage"],
      },
      {
        keywords: ["leak", "leakage", "risk", "loss"],
        cards: ["estimated-leakage", "health-score", "critical-inventory", "underpriced-menu"],
      },
      {
        keywords: ["forecast", "next week", "next 7", "projection"],
        cards: ["forecast-revenue", "forecast-profit", "estimated-profit"],
      },
      {
        keywords: ["profit", "margin", "food cost", "cost"],
        cards: ["estimated-profit", "profit-margin", "food-cost-percent", "forecast-profit"],
      },
      {
        keywords: ["payroll", "labor", "staff", "overtime"],
        cards: ["payroll-percent", "estimated-leakage", "health-score"],
      },
      {
        keywords: ["menu", "pricing", "price", "underpriced"],
        cards: ["underpriced-menu", "profit-margin", "food-cost-percent"],
      },
      {
        keywords: ["today", "daily"],
        cards: ["revenue-today", "health-score", "critical-inventory"],
      },
    ];

    const matchedCards = unique(
      groups.flatMap((group) =>
        group.keywords.some((keyword) => intent.includes(keyword)) ? group.cards : [],
      ),
    );
    const requestedCards = matchedCards.length > 0 ? matchedCards : defaultOverviewCardIds;
    const shouldAdd = intent.includes("add") || intent.includes("include");
    const nextIds = shouldAdd
      ? unique([...overviewCardIds, ...requestedCards])
      : requestedCards;

    setOverviewCardIds(
      overviewCards.map((card) => card.id).filter((id) => nextIds.includes(id)),
    );
    setOverviewLayoutNote("AI-assisted layout suggestion applied.");
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
              <strong>Customize the owner snapshot</strong>
            </div>
            <form onSubmit={applyOverviewCustomization}>
              <input
                aria-label="Customize overview metrics"
                onChange={(event) => setOverviewIntent(event.target.value)}
                placeholder="Try: Show food cost risk, reorder urgency, top profit leak, forecasted profit..."
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
          <InventoryRiskTable items={data.inventory} />
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

    return <AiReportsPanel reports={data.reportTemplates} />;
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
