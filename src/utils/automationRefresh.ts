import type {
  BusinessProjection,
  InventoryItem,
  InventorySummary,
  MenuItemProfitability,
  PayrollDay,
  PayrollMetric,
  PayrollStaffShift,
  ProfitLeak,
  RestaurantData,
  Severity,
} from "../data/mockRestaurantData";
import type {
  AutomationDashboardPayload,
  ForecastData,
  ForecastScenario,
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

const asNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
};

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

const pickOptionalNumber = (
  source: Record<string, unknown>,
  keys: string[],
  fallback?: number,
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

const pickNestedArray = (
  source: Record<string, unknown> | undefined,
  containerKeys: string[],
  rowKeys: string[],
) => {
  const container = pickObject(source, containerKeys);
  return pickArray(container, rowKeys);
};

const pickNumberFromSources = (
  sources: Array<Record<string, unknown> | undefined>,
  keys: string[],
  fallback: number,
) => {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    const value = pickNumber(source, keys, Number.NaN);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
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

  if (label === "Good" || label === "Normal" || label === "Efficient") {
    return "On Track";
  }

  return "Watch";
};

const normalizeOverview = (
  current: RestaurantData["overview"],
  metrics?: Record<string, unknown>,
): RestaurantData["overview"] => {
  const overview = pickObject(metrics, ["overview", "kpis", "summaryMetrics"]);
  const sales = pickObject(metrics, ["sales", "revenue"]);
  const foodCost = pickObject(metrics, ["foodCost", "food_cost"]);
  const payroll = pickObject(metrics, ["payroll", "payrollSummary", "labor"]);
  const payrollSummary = pickObject(payroll, ["summary", "metrics"]);
  const expenses = pickObject(metrics, ["expenses", "operatingExpenses"]);

  if (!metrics) {
    return current;
  }

  return {
    revenueToday: pickNumberFromSources(
      [overview, sales, metrics],
      ["revenueToday", "todayRevenue", "revenue_today", "today"],
      current.revenueToday,
    ),
    revenueThisWeek: pickNumberFromSources(
      [overview, sales, metrics],
      [
        "revenueThisWeek",
        "weeklyRevenue",
        "totalRevenue",
        "revenue_this_week",
        "revenue",
      ],
      current.revenueThisWeek,
    ),
    foodCostPercent: pickNumberFromSources(
      [overview, foodCost, metrics],
      [
        "foodCostPercent",
        "foodCostPct",
        "food_cost_percent",
        "percentage",
        "percent",
        "pct",
      ],
      current.foodCostPercent,
    ),
    payrollPercent: pickNumberFromSources(
      [overview, payrollSummary, payroll, metrics],
      [
        "payrollPercent",
        "payrollPct",
        "payroll_percent",
        "payrollPctOfSales",
        "percentage",
        "percent",
        "pct",
      ],
      current.payrollPercent,
    ),
    otherOperatingCostPercent: pickNumberFromSources(
      [overview, expenses, metrics],
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
  const rows =
    pickArray(intelligence, [
      "profitLeaks",
      "leaks",
      "riskSignals",
      "risks",
    ]) ??
    pickNestedArray(
      intelligence,
      ["profitLeakAnalysis", "riskIntelligence"],
      ["profitLeaks", "leaks", "riskSignals", "risks", "items"],
    ) ??
    pickArray(metrics, ["profitLeaks", "leaks", "riskSignals", "risks"]);

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
  const liveInventory = metrics?.inventory;
  const liveInventoryRows = isObjectArray(liveInventory)
    ? liveInventory
    : isObject(liveInventory)
      ? pickArray(liveInventory, ["items", "all", "rows", "data"]) ?? []
      : undefined;
  const rows =
    liveInventoryRows ??
    pickArray(metrics, ["inventoryItems", "inventoryRisks", "stockRisks"]) ??
    pickNestedArray(
      metrics,
      ["inventoryMetrics", "stock"],
      ["items", "all", "rows", "data", "risks", "inventory"],
    ) ??
    pickArray(intelligence, [
      "inventory",
      "inventoryItems",
      "inventoryRisks",
      "stockRisks",
    ]) ??
    pickNestedArray(
      intelligence,
      ["inventory", "inventoryIntelligence", "stock"],
      ["items", "all", "rows", "data", "risks", "inventory"],
    );

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
      category: pickString(row, ["category", "type"], "Core item"),
      supplier: pickString(row, ["supplier", "vendor"], "Preferred supplier"),
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

const normalizeInventorySummary = (
  metrics: Record<string, unknown> | undefined,
  inventory: InventoryItem[],
): InventorySummary => {
  const liveInventory = isObject(metrics?.inventory)
    ? metrics.inventory
    : undefined;

  return {
    criticalCount: liveInventory
      ? pickNumber(
          liveInventory,
          ["criticalCount", "critical_count"],
          inventory.filter((item) => item.status === "Critical").length,
        )
      : undefined,
    watchCount: liveInventory
      ? pickNumber(
          liveInventory,
          ["watchCount", "watch_count"],
          inventory.filter((item) => item.status === "Watch").length,
        )
      : undefined,
    safeCount: liveInventory
      ? pickNumber(
          liveInventory,
          ["safeCount", "safe_count"],
          inventory.filter((item) => item.status === "Safe").length,
        )
      : undefined,
    totalItems: liveInventory
      ? pickNumber(
          liveInventory,
          ["totalItems", "total_items", "count"],
          inventory.length,
        )
      : undefined,
  };
};

const normalizeMenuProfitability = (
  current: MenuItemProfitability[],
  metrics?: Record<string, unknown>,
  intelligence?: Record<string, unknown>,
) => {
  const rows =
    pickArray(metrics, [
      "menuProfitability",
      "menuItems",
      "menuRisks",
      "menu",
    ]) ??
    pickNestedArray(
      metrics,
      ["menu", "menuMetrics", "menuPricing"],
      ["items", "rows", "data", "menuItems", "menuProfitability"],
    ) ??
    pickArray(intelligence, [
      "menuProfitability",
      "menuItems",
      "menuRisks",
      "menu",
    ]) ??
    pickNestedArray(
      intelligence,
      ["menu", "menuIntelligence", "menuPricing"],
      ["items", "rows", "data", "menuItems", "menuProfitability"],
    );

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => ({
    id: pickString(row, ["id"], `menu-${index + 1}`),
    menuItem: pickString(row, ["menuItem", "menu_item", "name"], "Menu item"),
    category: pickString(row, ["category", "type"], "Menu item"),
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
  const payroll = pickObject(metrics, ["payroll", "labor"]);
  const source =
    pickObject(metrics, ["payrollMetrics", "payrollSummary"]) ??
    pickObject(payroll, ["summary", "metrics"]) ??
    payroll;

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
    netPayroll: pickOptionalNumber(
      source,
      ["netPayroll", "net_payroll"],
      current.netPayroll,
    ),
    overtimeCost: pickOptionalNumber(
      source,
      ["overtimeCost", "overtime_cost", "otPay", "ot_pay"],
      current.overtimeCost,
    ),
    staffCount: pickOptionalNumber(
      source,
      ["staffCount", "staff_count", "employeeCount", "employee_count"],
      current.staffCount,
    ),
    payrollStatus: pickString(
      source,
      ["payrollStatus", "payroll_status", "status"],
      current.payrollStatus ?? "",
    ),
  };
};

const normalizePayroll = (current: PayrollDay[], metrics?: Record<string, unknown>) => {
  const rows =
    pickArray(metrics, ["payrollDays", "laborDays", "payrollDaily"]) ??
    pickNestedArray(
      metrics,
      ["payroll", "labor"],
      ["daily", "days", "rows", "data", "payrollDays"],
    );

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
  const rows =
    pickArray(metrics, ["payrollStaffShifts", "staffShifts", "shifts"]) ??
    pickNestedArray(
      metrics,
      ["payroll", "labor"],
      ["staffShifts", "shifts", "employees", "rows", "data"],
    );

  if (!rows) {
    return current;
  }

  return rows.map((row, index) => {
    const dailyRate = pickNumber(row, ["dailyRate", "daily_rate"], 0);
    const hourlyRate = pickNumber(
      row,
      ["hourlyRate", "hourly_rate", "rate"],
      dailyRate > 0 ? dailyRate / 8 : 0,
    );
    const overtimePay = pickNumber(row, ["otPay", "ot_pay", "overtimePay"], 0);
    const daysWorked = pickNumber(row, ["daysWorked", "days_worked"], 1);

    return {
      id: pickString(row, ["id"], `shift-${index + 1}`),
      day: pickString(row, ["day", "date"], "Day"),
      employeeName: pickString(
        row,
        ["employeeName", "employee_name", "employee"],
        "Team member",
      ),
      role: pickString(row, ["role"], "Staff"),
      shift: pickString(row, ["shift"], "Shift"),
      regularHours: pickNumber(
        row,
        ["regularHours", "regular_hours"],
        daysWorked * 8,
      ),
      overtimeHours: pickNumber(
        row,
        ["overtimeHours", "overtime_hours"],
        hourlyRate > 0 ? overtimePay / (hourlyRate * 1.25) : 0,
      ),
      hourlyRate,
      payrollCost: pickNumber(
        row,
        ["payrollCost", "payroll_cost", "grossPay", "gross_pay"],
        dailyRate + overtimePay,
      ),
    };
  });
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
  response: AutomationDashboardPayload,
): AppliedAutomationRefresh => {
  const metrics = isObject(response.metrics) ? response.metrics : undefined;
  const intelligence = isObject(response.intelligence)
    ? response.intelligence
    : undefined;

  const forecast = isForecastData(response.forecast) ? response.forecast : undefined;
  const inventory = normalizeInventory(
    currentData.inventory,
    metrics,
    intelligence,
  );
  const nextData: RestaurantData = {
    ...currentData,
    overview: normalizeOverview(currentData.overview, metrics),
    profitLeaks: normalizeProfitLeaks(currentData.profitLeaks, metrics, intelligence),
    inventory,
    inventorySummary: normalizeInventorySummary(metrics, inventory),
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
