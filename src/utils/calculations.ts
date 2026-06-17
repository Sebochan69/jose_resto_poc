import type { ProfitLeak } from "../data/mockRestaurantData";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const calculateMarginPercent = (sellingPrice: number, foodCost: number) => {
  if (sellingPrice <= 0) {
    return 0;
  }

  return ((sellingPrice - foodCost) / sellingPrice) * 100;
};

export const calculatePayrollPercent = (payrollCost: number, sales: number) => {
  if (sales <= 0) {
    return 0;
  }

  return (payrollCost / sales) * 100;
};

export const calculateDaysLeft = (currentStock: number, dailyUsage: number) => {
  if (dailyUsage <= 0) {
    return 0;
  }

  return currentStock / dailyUsage;
};

export const calculateEstimatedProfit = (
  revenue: number,
  foodCostPercent: number,
  payrollPercent: number,
  otherOperatingCostPercent: number,
) => {
  const expensePercent =
    foodCostPercent + payrollPercent + otherOperatingCostPercent;

  return revenue * (1 - expensePercent / 100);
};

export const calculateTotalLeakage = (profitLeaks: ProfitLeak[]) =>
  profitLeaks.reduce((total, leak) => total + leak.estimatedWeeklyLoss, 0);

interface HealthScoreInput {
  foodCostPercent: number;
  payrollPercent: number;
  inventoryRiskCount: number;
  totalLeakage: number;
  revenueThisWeek: number;
}

export const calculateHealthScore = ({
  foodCostPercent,
  payrollPercent,
  inventoryRiskCount,
  totalLeakage,
  revenueThisWeek,
}: HealthScoreInput) => {
  const leakageRate = revenueThisWeek > 0 ? totalLeakage / revenueThisWeek : 0;
  const foodCostPenalty = Math.max(0, foodCostPercent - 32) * 1.6;
  const payrollPenalty = Math.max(0, payrollPercent - 25) * 2;
  const inventoryPenalty = inventoryRiskCount * 3.2;
  const leakagePenalty = leakageRate * 100 * 0.7;

  return Math.round(
    clamp(
      96 - foodCostPenalty - payrollPenalty - inventoryPenalty - leakagePenalty,
      35,
      99,
    ),
  );
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatPercent = (value: number, digits = 1) =>
  `${value.toFixed(digits)}%`;
