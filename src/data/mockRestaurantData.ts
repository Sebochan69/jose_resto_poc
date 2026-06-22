import type { ReportType } from "../types";

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type InventoryStatus = "Critical" | "Watch" | "Safe";
export type PayrollStatus = "High" | "Watch" | "On Track";

export interface OverviewMetrics {
  revenueToday: number;
  revenueThisWeek: number;
  foodCostPercent: number;
  payrollPercent: number;
  otherOperatingCostPercent: number;
}

export interface ProfitLeak {
  id: string;
  source: string;
  category: string;
  estimatedWeeklyLoss: number;
  severity: Severity;
  recommendedAction: string;
}

export interface InventoryItem {
  id: string;
  item: string;
  category?: string;
  supplier?: string;
  currentStock: number;
  unit: string;
  dailyUsage: number;
  reorderLevel: number;
  suggestedReorder: number;
  status: InventoryStatus;
}

export interface InventorySummary {
  criticalCount?: number;
  watchCount?: number;
  safeCount?: number;
  totalItems?: number;
}

export interface MenuItemProfitability {
  id: string;
  menuItem: string;
  category?: string;
  sellingPrice: number;
  foodCost: number;
  targetMarginPercent: number;
  salesVolume: number;
  recommendation: string;
}

export interface PayrollMetric {
  totalPayrollThisWeek: number;
  targetPayrollRange: string;
  estimatedPayrollLeakage: number;
  overstaffedDays: number;
  netPayroll?: number;
  overtimeCost?: number;
  staffCount?: number;
  payrollStatus?: string;
}

export interface PayrollDay {
  id: string;
  day: string;
  sales: number;
  staffCount: number;
  payrollCost: number;
  status: PayrollStatus;
  recommendation: string;
}

export interface PayrollStaffShift {
  id: string;
  day: string;
  employeeName: string;
  role: string;
  shift: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  payrollCost: number;
}

export interface BusinessProjection {
  projectedNextWeekRevenue: number;
  projectedNextWeekProfit: number;
  riskSummary: string;
  whatIfScenario: string;
}

export interface AiReportTemplate {
  id: ReportType;
  title: string;
  summary: string;
  keyFindings: string[];
  recommendedActions: string[];
}

export interface RestaurantData {
  restaurant: {
    name: string;
    location: string;
    serviceModel: string;
  };
  overview: OverviewMetrics;
  aiSummary: string;
  profitLeaks: ProfitLeak[];
  inventory: InventoryItem[];
  inventorySummary?: InventorySummary;
  menuProfitability: MenuItemProfitability[];
  payrollMetrics: PayrollMetric;
  payroll: PayrollDay[];
  payrollStaffShifts: PayrollStaffShift[];
  businessProjection: BusinessProjection;
  reportTemplates: AiReportTemplate[];
  consultantResponses: Record<string, string>;
}

export const samplePrompts = [
  "Why is profit almost zero even if revenue is high?",
  "What should I fix first today?",
  "Which item should I reorder first?",
  "Which menu item is hurting margin?",
  "Is payroll efficient this week?",
  "What should I prepare for next week?",
];

export const mockRestaurantData: RestaurantData = {
  restaurant: {
    name: "JOSE RESTO POC",
    location: "Quezon City flagship",
    serviceModel: "Casual dining and delivery",
  },
  overview: {
    revenueToday: 48250,
    revenueThisWeek: 325900,
    foodCostPercent: 34.8,
    payrollPercent: 28.4,
    otherOperatingCostPercent: 12.5,
  },
  aiSummary:
    "Your restaurant is profitable, but profit leakage is coming from payroll inefficiency, underpriced menu items, and inventory risk.",
  profitLeaks: [
    {
      id: "leak-1",
      source: "Underpriced menu items",
      category: "Menu pricing",
      estimatedWeeklyLoss: 9200,
      severity: "High",
      recommendedAction:
        "Increase Beef Pares and Crispy Chicken pricing by 8% to 12% or reduce portion cost.",
    },
    {
      id: "leak-2",
      source: "Excess ingredient usage",
      category: "Inventory",
      estimatedWeeklyLoss: 6800,
      severity: "Medium",
      recommendedAction:
        "Standardize beef and rice portions during peak delivery hours.",
    },
    {
      id: "leak-3",
      source: "Overstaffing",
      category: "Payroll",
      estimatedWeeklyLoss: 11400,
      severity: "High",
      recommendedAction:
        "Reduce one service staff slot on Tuesday and Wednesday lunch shifts.",
    },
    {
      id: "leak-4",
      source: "Overtime leakage",
      category: "Payroll",
      estimatedWeeklyLoss: 5400,
      severity: "Medium",
      recommendedAction:
        "Move closing prep earlier and cap kitchen overtime after 9:30 PM.",
    },
    {
      id: "leak-5",
      source: "Stockout risk",
      category: "Inventory",
      estimatedWeeklyLoss: 7600,
      severity: "Critical",
      recommendedAction:
        "Reorder chicken thigh, garlic, and takeout containers before dinner service.",
    },
  ],
  inventory: [
    {
      id: "inv-1",
      item: "Chicken thigh",
      category: "Meat",
      supplier: "ABC Poultry Supply",
      currentStock: 18,
      unit: "kg",
      dailyUsage: 11,
      reorderLevel: 25,
      suggestedReorder: 55,
      status: "Critical",
    },
    {
      id: "inv-2",
      item: "Beef brisket",
      category: "Meat",
      supplier: "Prime Meat Trading",
      currentStock: 26,
      unit: "kg",
      dailyUsage: 8,
      reorderLevel: 24,
      suggestedReorder: 38,
      status: "Watch",
    },
    {
      id: "inv-3",
      item: "Rice",
      category: "Dry Goods",
      supplier: "Bigas Center PH",
      currentStock: 90,
      unit: "kg",
      dailyUsage: 18,
      reorderLevel: 45,
      suggestedReorder: 80,
      status: "Safe",
    },
    {
      id: "inv-4",
      item: "Garlic",
      category: "Produce",
      supplier: "Wet Market Supplier",
      currentStock: 4,
      unit: "kg",
      dailyUsage: 2.5,
      reorderLevel: 8,
      suggestedReorder: 15,
      status: "Critical",
    },
    {
      id: "inv-5",
      item: "Cooking oil",
      category: "Kitchen Supply",
      supplier: "Golden Fry Distributor",
      currentStock: 24,
      unit: "L",
      dailyUsage: 5,
      reorderLevel: 20,
      suggestedReorder: 28,
      status: "Watch",
    },
    {
      id: "inv-6",
      item: "Takeout containers",
      category: "Packaging",
      supplier: "PackPro PH",
      currentStock: 220,
      unit: "pcs",
      dailyUsage: 96,
      reorderLevel: 300,
      suggestedReorder: 600,
      status: "Critical",
    },
  ],
  menuProfitability: [
    {
      id: "menu-1",
      menuItem: "Beef Pares",
      category: "Rice Meal",
      sellingPrice: 165,
      foodCost: 72,
      targetMarginPercent: 62,
      salesVolume: 184,
      recommendation:
        "Increase Beef Pares from PHP 165 to PHP 185 or reduce portion cost by 8%.",
    },
    {
      id: "menu-2",
      menuItem: "Crispy Chicken Rice",
      category: "Rice Meal",
      sellingPrice: 145,
      foodCost: 59,
      targetMarginPercent: 61,
      salesVolume: 212,
      recommendation:
        "Bundle with iced tea instead of discounting the base meal.",
    },
    {
      id: "menu-3",
      menuItem: "Garlic Beef Bowl",
      category: "Rice Meal",
      sellingPrice: 189,
      foodCost: 68,
      targetMarginPercent: 64,
      salesVolume: 96,
      recommendation:
        "Promote during lunch; margin is healthy and sales velocity is rising.",
    },
    {
      id: "menu-4",
      menuItem: "Pork Sisig Plate",
      category: "Rice Meal",
      sellingPrice: 175,
      foodCost: 63,
      targetMarginPercent: 63,
      salesVolume: 121,
      recommendation:
        "Keep price stable and tighten garnish waste by one prep batch daily.",
    },
    {
      id: "menu-5",
      menuItem: "Mango Float Cup",
      category: "Dessert",
      sellingPrice: 95,
      foodCost: 31,
      targetMarginPercent: 65,
      salesVolume: 146,
      recommendation:
        "Use as an add-on offer for delivery orders above PHP 450.",
    },
  ],
  payrollMetrics: {
    totalPayrollThisWeek: 92500,
    targetPayrollRange: "22% - 26%",
    estimatedPayrollLeakage: 16800,
    overstaffedDays: 3,
  },
  payroll: [
    {
      id: "pay-1",
      day: "Monday",
      sales: 42600,
      staffCount: 10,
      payrollCost: 12400,
      status: "High",
      recommendation: "Trim one dining room staff slot during 2 PM to 5 PM.",
    },
    {
      id: "pay-2",
      day: "Tuesday",
      sales: 38100,
      staffCount: 10,
      payrollCost: 12800,
      status: "High",
      recommendation: "Schedule six floor hours against prep instead of service.",
    },
    {
      id: "pay-3",
      day: "Wednesday",
      sales: 39400,
      staffCount: 9,
      payrollCost: 11900,
      status: "Watch",
      recommendation: "Move one runner to split shift only if delivery demand spikes.",
    },
    {
      id: "pay-4",
      day: "Thursday",
      sales: 47650,
      staffCount: 9,
      payrollCost: 12200,
      status: "On Track",
      recommendation: "Keep roster; sales coverage is inside target range.",
    },
    {
      id: "pay-5",
      day: "Friday",
      sales: 58900,
      staffCount: 12,
      payrollCost: 16400,
      status: "Watch",
      recommendation: "Protect peak crew, but end prep shift 30 minutes earlier.",
    },
    {
      id: "pay-6",
      day: "Saturday",
      sales: 63400,
      staffCount: 13,
      payrollCost: 17300,
      status: "Watch",
      recommendation: "Keep kitchen coverage and reduce front counter overlap.",
    },
    {
      id: "pay-7",
      day: "Sunday",
      sales: 35900,
      staffCount: 9,
      payrollCost: 9500,
      status: "On Track",
      recommendation: "Keep lean Sunday roster unless reservations exceed 70 covers.",
    },
  ],
  payrollStaffShifts: [
    {
      id: "shift-1",
      day: "Monday",
      employeeName: "Ana Cruz",
      role: "Cashier",
      shift: "10:00 AM - 6:00 PM",
      regularHours: 8,
      overtimeHours: 0,
      hourlyRate: 85,
      payrollCost: 680,
    },
    {
      id: "shift-2",
      day: "Monday",
      employeeName: "Marco Santos",
      role: "Line Cook",
      shift: "9:00 AM - 7:00 PM",
      regularHours: 8,
      overtimeHours: 2,
      hourlyRate: 110,
      payrollCost: 1155,
    },
    {
      id: "shift-3",
      day: "Tuesday",
      employeeName: "Liza Reyes",
      role: "Server",
      shift: "11:00 AM - 8:00 PM",
      regularHours: 8,
      overtimeHours: 1,
      hourlyRate: 90,
      payrollCost: 833,
    },
    {
      id: "shift-4",
      day: "Tuesday",
      employeeName: "Nico Lim",
      role: "Prep Cook",
      shift: "8:00 AM - 5:00 PM",
      regularHours: 8,
      overtimeHours: 1,
      hourlyRate: 95,
      payrollCost: 879,
    },
    {
      id: "shift-5",
      day: "Wednesday",
      employeeName: "Mia Garcia",
      role: "Runner",
      shift: "12:00 PM - 7:00 PM",
      regularHours: 7,
      overtimeHours: 0,
      hourlyRate: 82,
      payrollCost: 574,
    },
    {
      id: "shift-6",
      day: "Thursday",
      employeeName: "Paolo Dela Cruz",
      role: "Grill Cook",
      shift: "10:00 AM - 7:00 PM",
      regularHours: 8,
      overtimeHours: 1,
      hourlyRate: 115,
      payrollCost: 1064,
    },
    {
      id: "shift-7",
      day: "Friday",
      employeeName: "Sofia Ramos",
      role: "Shift Lead",
      shift: "11:00 AM - 10:00 PM",
      regularHours: 8,
      overtimeHours: 3,
      hourlyRate: 130,
      payrollCost: 1528,
    },
    {
      id: "shift-8",
      day: "Friday",
      employeeName: "Ken Bautista",
      role: "Server",
      shift: "3:00 PM - 11:00 PM",
      regularHours: 8,
      overtimeHours: 0,
      hourlyRate: 90,
      payrollCost: 720,
    },
    {
      id: "shift-9",
      day: "Saturday",
      employeeName: "Jessa Tan",
      role: "Cashier",
      shift: "10:00 AM - 8:00 PM",
      regularHours: 8,
      overtimeHours: 2,
      hourlyRate: 88,
      payrollCost: 924,
    },
    {
      id: "shift-10",
      day: "Saturday",
      employeeName: "Arvin Lee",
      role: "Line Cook",
      shift: "12:00 PM - 11:00 PM",
      regularHours: 8,
      overtimeHours: 3,
      hourlyRate: 112,
      payrollCost: 1316,
    },
    {
      id: "shift-11",
      day: "Sunday",
      employeeName: "Ivy Mendoza",
      role: "Server",
      shift: "11:00 AM - 6:00 PM",
      regularHours: 7,
      overtimeHours: 0,
      hourlyRate: 88,
      payrollCost: 616,
    },
    {
      id: "shift-12",
      day: "Sunday",
      employeeName: "Ramon Flores",
      role: "Dishwasher",
      shift: "12:00 PM - 7:00 PM",
      regularHours: 7,
      overtimeHours: 0,
      hourlyRate: 78,
      payrollCost: 546,
    },
  ],
  businessProjection: {
    projectedNextWeekRevenue: 348500,
    projectedNextWeekProfit: 80200,
    riskSummary:
      "Profit should improve if menu price adjustments go live before Friday and chicken stockouts are avoided.",
    whatIfScenario:
      "If chicken and beef costs increase by 10%, weekly profit may drop by PHP 8,000 to PHP 12,000.",
  },
  reportTemplates: [
    {
      id: "overall",
      title: "Overall AI Report",
      summary:
        "JOSE RESTO POC sees a profitable week with controllable leakage concentrated in labor scheduling, fast-moving inventory, and two menu prices below target margin.",
      keyFindings: [
        "Estimated weekly leakage is mostly payroll-driven.",
        "Chicken thigh, garlic, and takeout containers are at critical stock levels.",
        "Beef Pares is below target margin despite high demand.",
      ],
      recommendedActions: [
        "Adjust two low-margin prices before the weekend rush.",
        "Reorder critical inventory today and confirm supplier cutoffs.",
        "Rebalance Tuesday and Wednesday schedules against demand.",
      ],
    },
    {
      id: "inventory",
      title: "Inventory Report",
      summary:
        "Inventory exposure is led by chicken thigh and packaging stockouts that could interrupt dinner and delivery sales.",
      keyFindings: [
        "Three items are marked critical.",
        "Takeout containers have less than three days of expected coverage.",
        "Cooking oil is safe for now but close to watch range.",
      ],
      recommendedActions: [
        "Place suggested reorder quantities for critical items.",
        "Use daily prep sheets to reduce beef and garlic variance.",
        "Confirm packaging lead time with the supplier.",
      ],
    },
    {
      id: "menu",
      title: "Menu Pricing Report",
      summary:
        "Menu profitability is healthy overall, but high-volume rice meals need tighter pricing and portion discipline.",
      keyFindings: [
        "Beef Pares has strong sales but misses the target margin.",
        "Garlic Beef Bowl is a good candidate for lunch promotion.",
        "Dessert add-ons can lift average order value without kitchen strain.",
      ],
      recommendedActions: [
        "Raise Beef Pares to PHP 185 or reduce portion cost by 8%.",
        "Promote Garlic Beef Bowl in lunch bundles.",
        "Attach Mango Float Cup offers to delivery orders above PHP 450.",
      ],
    },
    {
      id: "payroll",
      title: "Payroll Report",
      summary:
        "Payroll is above the target range because slower weekdays are staffed too close to weekend levels.",
      keyFindings: [
        "Payroll leakage is estimated at PHP 16,800 this week.",
        "Monday and Tuesday are the highest risk days.",
        "Weekend payroll is defensible because revenue is materially higher.",
      ],
      recommendedActions: [
        "Trim one service slot on Monday and Tuesday afternoons.",
        "Move prep work earlier to reduce closing overtime.",
        "Review split-shift rules before publishing next week's roster.",
      ],
    },
    {
      id: "projection",
      title: "Business Projection Report",
      summary:
        "Next week is projected to improve if revenue stays on trend and current leakage controls are applied.",
      keyFindings: [
        "Projected next week revenue is PHP 348,500.",
        "Projected next week profit is PHP 80,200.",
        "Ingredient inflation remains the largest outside risk.",
      ],
      recommendedActions: [
        "Lock supplier pricing for chicken and beef if possible.",
        "Run the weekend menu changes before Friday.",
        "Use the projection again after the next data refresh.",
      ],
    },
  ],
  consultantResponses: {
    "What should I prepare for next week?":
      "Prepare for weekend demand, ingredient cost pressure, and inventory lead times. Lock critical stock, confirm staff coverage for peak periods, and run margin-safe bundles.",
    "Is payroll efficient this week?":
      "Payroll is above the target band. Treat this as a scheduling optimization issue: reduce low-traffic overlap, protect peak coverage, and move prep earlier to avoid closing overtime.",
    "Which menu item is hurting margin?":
      "Beef Pares is the clearest margin risk because it has strong demand but misses the target margin. Raise the price or reduce portion cost before the weekend rush.",
    "Which item should I reorder first?":
      "Reorder chicken thigh, garlic, and takeout containers first because they are closest to interrupting dinner and delivery sales.",
    "What should I fix first today?":
      "Fix the most immediate cash leak first: reorder critical inventory, then adjust the underpriced high-volume menu items and review weekday staffing coverage.",
    "Why is profit almost zero even if revenue is high?":
      "Revenue is high, but margin is being compressed by payroll over target, food-cost drift, and underpriced high-volume items. Start with menu pricing and weekday staffing before adding more promotions.",
    "Why did profit drop this week?":
      "Profit dropped because payroll ran above target on slower weekdays and Beef Pares is selling below its target margin. Fixing those two issues protects roughly PHP 20,000 to PHP 25,000 per week.",
    "What should I reorder today?":
      "Reorder chicken thigh, garlic, and takeout containers today. Beef brisket and cooking oil are in watch range, so confirm supplier lead times before the weekend.",
    "Is payroll too high?":
      "Yes. Payroll is at 28.4% of sales versus the 22% to 26% target range. Monday and Tuesday are the main schedule risks.",
    "Which menu item should I promote?":
      "Promote Garlic Beef Bowl during lunch and attach Mango Float Cup to larger delivery baskets. Both protect margin better than discounting core meals.",
    "How much money are we leaking this week?":
      "Mock analysis estimates PHP 40,400 in weekly leakage across payroll, inventory risk, overtime, and underpriced menu items.",
  },
};
