import type {
  BusinessProjection,
  InventoryItem,
  MenuItemProfitability,
  PayrollDay,
  PayrollMetric,
  PayrollStaffShift,
  ProfitLeak,
  RestaurantData,
  Severity,
} from "../data/mockRestaurantData";
import type {
  ForecastData,
  ForecastScenario,
  N8nRefreshDashboardResponse,
} from "../types";

interface AppliedAutomationRefresh {
  data: RestaurantData;
  forecast?: ForecastData;
  generatedAt?: Date;
  healthScore?: number;
  totalEstimatedLeakage?: number;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isObjectArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isObject);

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asString = (value: unknown) => (typeof value === "string" ? value : undefined);

const titleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1).toLowerCase()}`)
    .join(" ");

const pickNumber = (
  source: Record<string, unknown>,
  keys: string[],
  fallback: number,
) => {
  for (const key of keys) {
    const value = asNumber(source[key]);

    if (value !== undefined) {
      return value;
    }
  }

  return fallback;
};

const pickString = (
  source: Record<string, unknown>,
  keys: string[],
  fallback: string,
) => {
  for (const key of keys) {
    const value = asString(source[key]);

    if (value !== undefined && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
};

const pickObject = (
  source: Record<string, unknown> | undefined,
  keys: string[],
) => {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];

    if (isObject(value)) {
      return value;
    }
  }

  return undefined;
};

const pickArray = (
  source: Record<string, unknown> | undefined,
  keys: string[],
) => {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];

    if (isObjectArray(value)) {
      return value;
    }
  }

  return undefined;
};

const isSeverity = (value: string): value is Severity =>
  ["Critical", "High", "Medium", "Low"].includes(value);

const normalizeSeverity = (value: unknown, fallback: Severity): Severity => {
  const label = titleCase(String(value ?? fallback));
  return isSeverity(label) ? label : fallback;
};

const normalizeInventoryStatus = (
  value: unknown,
  currentStock: number,
  reorderLevel: number,
): InventoryItem["status"] => {
  const label = titleCase(String(value ?? ""));

  if (label === "Critical" || label === "Watch" || label === "Safe") {
    return label;
  }

  if (currentStock <= reorderLevel) {
    return "Critical";
  }

  if (currentStock <= reorderLevel * 1.35) {
    return "Watch";
  }

  return "Safe";
};

const normalizePayrollStatus = (value: unknown): PayrollDay["status"] => {
  const label = titleCase(String(value ?? ""));

  if (label === "High" || label === "Watch" || label === "On Track") {
    return label;
  }

  return "Watch";
};

const normalizeOverview = (
  current: RestaurantData["overview"],
  metrics?: Record<string, unknown>,
): RestaurantData["overview"] => {
  const overview = pickObject(metrics, ["overview", "kpis", "summaryMetrics"]);
  const source = overview ?? metrics;

  if (!source) {
    return current;
  }

  return {
    revenueToday: pickNumber(
      source,
      ["revenueToday", "todayRevenue", "revenue_today"],
      current.revenueToday,
    ),
    revenueThisWeek: pickNumber(
      source,
      ["revenueThisWeek", "weeklyRevenue", "totalRevenue", "revenue_this_week"],
      current.revenueThisWeek,
    ),
    foodCostPercent: pickNumber(
      source,
      ["foodCostPercent", "foodCostPct", "food_cost_percent"],
      current.foodCostPercent,
    ),
    payrollPercent: pickNumber(
      source,
      ["payrollPercent", "payrollPct", "payroll_percent"],
      current.payrollPercent,
    ),
    otherOperatingCostPercent: pickNumber(
      source,
      [
        "otherOperatingCostPercent",
        "operatingCostPercent",
        "expensePercent",
        "other_operating_cost_percent",
      ],
      current.otherOperatingCostPercent,
    ),
  };
};

const normalizeProfitLeaks = (
  current: ProfitLeak[],
  metrics?: Record<string, unknown>,
  intelligence?: Record<string, unknown>,
) => {
  const rows = pickArray(intelligence, ["profitLeaks", "leaks", "riskSignals"]) ??
    pickArray(metrics, ["profitLeaks", "leaks", "riskSignals"]);

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => ({
    id: pickString(row, ["id"], `leak-${index + 1}`),
    source: pickString(row, ["source", "name", "risk", "title"], "Profit risk"),
    category: pickString(row, ["category", "type"], "Operations"),
    estimatedWeeklyLoss: pickNumber(
      row,
      ["estimatedWeeklyLoss", "estimatedLoss", "loss", "amount", "profitImpact"],
      0,
    ),
    severity: normalizeSeverity(row.severity, "Medium"),
    recommendedAction: pickString(
      row,
      ["recommendedAction", "recommendation", "action"],
      "Review this signal during the next operator check-in.",
    ),
  }));
};

const normalizeInventory = (
  current: InventoryItem[],
  metrics?: Record<string, unknown>,
  intelligence?: Record<string, unknown>,
) => {
  const rows = pickArray(intelligence, ["inventory", "inventoryRisks", "stockRisks"]) ??
    pickArray(metrics, ["inventory", "inventoryRisks", "stockRisks"]);

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => {
    const currentStock = pickNumber(row, ["currentStock", "current_stock", "stock"], 0);
    const reorderLevel = pickNumber(row, ["reorderLevel", "reorder_level"], 0);
    const dailyUsage = pickNumber(row, ["dailyUsage", "daily_usage"], 0);
    const unit = pickString(row, ["unit"], "unit");

    return {
      id: pickString(row, ["id"], `inv-${index + 1}`),
      item: pickString(row, ["item", "name"], "Inventory item"),
      currentStock,
      unit,
      dailyUsage,
      reorderLevel,
      suggestedReorder: pickNumber(
        row,
        ["suggestedReorder", "suggested_reorder", "reorderQuantity"],
        Math.max(reorderLevel * 2 - currentStock, reorderLevel),
      ),
      status: normalizeInventoryStatus(row.status, currentStock, reorderLevel),
    };
  });
};

const normalizeMenuProfitability = (
  current: MenuItemProfitability[],
  metrics?: Record<string, unknown>,
  intelligence?: Record<string, unknown>,
) => {
  const rows = pickArray(intelligence, ["menuProfitability", "menuItems", "menuRisks"]) ??
    pickArray(metrics, ["menuProfitability", "menuItems", "menuRisks"]);

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => ({
    id: pickString(row, ["id"], `menu-${index + 1}`),
    menuItem: pickString(row, ["menuItem", "menu_item", "name"], "Menu item"),
    sellingPrice: pickNumber(row, ["sellingPrice", "selling_price", "price"], 0),
    foodCost: pickNumber(row, ["foodCost", "food_cost", "cost"], 0),
    targetMarginPercent: pickNumber(
      row,
      ["targetMarginPercent", "target_margin", "targetMargin"],
      0,
    ),
    salesVolume: pickNumber(row, ["salesVolume", "sales_volume", "quantitySold"], 0),
    recommendation: pickString(
      row,
      ["recommendation", "recommendedAction", "action"],
      "Review pricing, cost, and promo positioning.",
    ),
  }));
};

const normalizePayrollMetrics = (
  current: PayrollMetric,
  metrics?: Record<string, unknown>,
) => {
  const source = pickObject(metrics, ["payrollMetrics", "payrollSummary", "labor"]);

  if (!source) {
    return current;
  }

  return {
    totalPayrollThisWeek: pickNumber(
      source,
      ["totalPayrollThisWeek", "totalPayroll", "grossPayroll"],
      current.totalPayrollThisWeek,
    ),
    targetPayrollRange: pickString(
      source,
      ["targetPayrollRange", "targetRange"],
      current.targetPayrollRange,
    ),
    estimatedPayrollLeakage: pickNumber(
      source,
      ["estimatedPayrollLeakage", "payrollLeakage", "leakage"],
      current.estimatedPayrollLeakage,
    ),
    overstaffedDays: pickNumber(
      source,
      ["overstaffedDays", "overstaffed_days"],
      current.overstaffedDays,
    ),
  };
};

const normalizePayroll = (current: PayrollDay[], metrics?: Record<string, unknown>) => {
  const rows = pickArray(metrics, ["payroll", "payrollDays", "laborDays"]);

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => ({
    id: pickString(row, ["id"], `payroll-${index + 1}`),
    day: pickString(row, ["day", "date"], "Day"),
    sales: pickNumber(row, ["sales", "revenue"], 0),
    staffCount: pickNumber(row, ["staffCount", "staff_count"], 0),
    payrollCost: pickNumber(row, ["payrollCost", "payroll_cost", "grossPay"], 0),
    status: normalizePayrollStatus(row.status),
    recommendation: pickString(
      row,
      ["recommendation", "recommendedAction", "action"],
      "Review staffing against sales demand.",
    ),
  }));
};

const normalizeStaffShifts = (
  current: PayrollStaffShift[],
  metrics?: Record<string, unknown>,
) => {
  const rows = pickArray(metrics, ["payrollStaffShifts", "staffShifts", "shifts"]);

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => ({
    id: pickString(row, ["id"], `shift-${index + 1}`),
    day: pickString(row, ["day", "date"], "Day"),
    employeeName: pickString(
      row,
      ["employeeName", "employee_name", "employee"],
      "Team member",
    ),
    role: pickString(row, ["role"], "Staff"),
    shift: pickString(row, ["shift"], "Shift"),
    regularHours: pickNumber(row, ["regularHours", "regular_hours"], 0),
    overtimeHours: pickNumber(row, ["overtimeHours", "overtime_hours"], 0),
    hourlyRate: pickNumber(row, ["hourlyRate", "hourly_rate", "rate"], 0),
    payrollCost: pickNumber(row, ["payrollCost", "payroll_cost", "grossPay"], 0),
  }));
};

const isForecastScenario = (value: unknown): value is ForecastScenario =>
  isObject(value) &&
  typeof value.name === "string" &&
  typeof value.description === "string" &&
  typeof value.profitImpact === "number" &&
  ["Positive", "Negative", "Neutral"].includes(String(value.severity));

export const isForecastData = (value: unknown): value is ForecastData =>
  isObject(value) &&
  typeof value.next7DaysRevenue === "number" &&
  typeof value.next7DaysFoodCost === "number" &&
  typeof value.next7DaysPayroll === "number" &&
  typeof value.next7DaysExpenses === "number" &&
  typeof value.next7DaysProfit === "number" &&
  ["Low", "Medium", "High"].includes(String(value.confidence)) &&
  typeof value.trend === "string" &&
  Array.isArray(value.revenueForecast) &&
  value.revenueForecast.every(
    (point) =>
      isObject(point) &&
      typeof point.date === "string" &&
      typeof point.projectedRevenue === "number",
  ) &&
  Array.isArray(value.scenarios) &&
  value.scenarios.every(isForecastScenario);

const normalizeBusinessProjection = (
  current: BusinessProjection,
  forecast: unknown,
) => {
  if (!isForecastData(forecast)) {
    return current;
  }

  const largestScenario = forecast.scenarios
    .slice()
    .sort((a, b) => Math.abs(b.profitImpact) - Math.abs(a.profitImpact))[0];

  return {
    projectedNextWeekRevenue: forecast.next7DaysRevenue,
    projectedNextWeekProfit: forecast.next7DaysProfit,
    riskSummary: forecast.trend,
    whatIfScenario: largestScenario
      ? `${largestScenario.name}: ${largestScenario.description}`
      : current.whatIfScenario,
  };
};

export const applyAutomationRefresh = (
  currentData: RestaurantData,
  response: N8nRefreshDashboardResponse,
): AppliedAutomationRefresh => {
  const metrics = isObject(response.metrics) ? response.metrics : undefined;
  const intelligence = isObject(response.intelligence)
    ? response.intelligence
    : undefined;

  const forecast = isForecastData(response.forecast) ? response.forecast : undefined;
  const nextData: RestaurantData = {
    ...currentData,
    overview: normalizeOverview(currentData.overview, metrics),
    profitLeaks: normalizeProfitLeaks(currentData.profitLeaks, metrics, intelligence),
    inventory: normalizeInventory(currentData.inventory, metrics, intelligence),
    menuProfitability: normalizeMenuProfitability(
      currentData.menuProfitability,
      metrics,
      intelligence,
    ),
    payrollMetrics: normalizePayrollMetrics(currentData.payrollMetrics, metrics),
    payroll: normalizePayroll(currentData.payroll, metrics),
    payrollStaffShifts: normalizeStaffShifts(currentData.payrollStaffShifts, metrics),
    businessProjection: normalizeBusinessProjection(
      currentData.businessProjection,
      response.forecast,
    ),
  };

  return {
    data: nextData,
    forecast,
    generatedAt:
      response.generatedAt && !Number.isNaN(Date.parse(response.generatedAt))
        ? new Date(response.generatedAt)
        : undefined,
    healthScore: asNumber(response.healthScore),
    totalEstimatedLeakage: asNumber(response.totalEstimatedLeakage),
  };
};
