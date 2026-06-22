import { Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import type { MenuItemProfitability } from "../data/mockRestaurantData";
import {
  calculateMarginPercent,
  formatCurrency,
  formatPercent,
} from "../utils/calculations";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

interface MenuProfitabilityTableProps {
  items: MenuItemProfitability[];
}

const reviewModes = ["Weekly Review", "Monthly Review"] as const;

export function MenuProfitabilityTable({ items }: MenuProfitabilityTableProps) {
  const [reviewMode, setReviewMode] = useState<(typeof reviewModes)[number]>(
    "Weekly Review",
  );

  const itemStats = useMemo(
    () =>
      items.map((item) => {
        const margin = calculateMarginPercent(item.sellingPrice, item.foodCost);
        const isHealthy = margin >= item.targetMarginPercent;

        return {
          ...item,
          margin,
          isHealthy,
          estimatedFoodCost: item.foodCost * item.salesVolume,
        };
      }),
    [items],
  );

  const underpricedCount = itemStats.filter((item) => !item.isHealthy).length;
  const healthyCount = itemStats.length - underpricedCount;
  const averageMargin = itemStats.length
    ? itemStats.reduce((total, item) => total + item.margin, 0) / itemStats.length
    : 0;
  const estimatedFoodCost = itemStats.reduce(
    (total, item) => total + item.estimatedFoodCost,
    0,
  );

  return (
    <SectionCard
      id="menu-pricing"
      eyebrow="Menu profitability"
      title="Pricing and Margin Control"
      action={
        <span className="section-stat">
          <Utensils aria-hidden="true" size={17} />
          {underpricedCount} below target
        </span>
      }
    >
      {items.length === 0 ? (
        <div className="empty-state">No menu pricing data is available yet.</div>
      ) : (
        <>
          <div className="filter-bar" aria-label="Menu review timeframe">
            {reviewModes.map((mode) => (
              <button
                aria-pressed={reviewMode === mode}
                className={reviewMode === mode ? "filter-chip filter-chip--active" : "filter-chip"}
                key={mode}
                onClick={() => setReviewMode(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="metric-strip metric-strip--five">
            <div>
              <span>Underpriced items</span>
              <strong>{underpricedCount}</strong>
            </div>
            <div>
              <span>Healthy items</span>
              <strong>{healthyCount}</strong>
            </div>
            <div>
              <span>Average margin</span>
              <strong>{formatPercent(averageMargin)}</strong>
            </div>
            <div>
              <span>Estimated food cost</span>
              <strong>{formatCurrency(estimatedFoodCost)}</strong>
            </div>
            <div>
              <span>Review context</span>
              <strong>{reviewMode}</strong>
            </div>
          </div>

          <div className="insight-panel">
            Prioritize high-volume items below target margin. Use price changes, portion discipline, or high-margin bundles before broad discounting.
          </div>

          <div className="table-wrap table-wrap--spaced">
            <table>
              <thead>
                <tr>
                  <th>Menu Item</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Food Cost</th>
                  <th>Margin</th>
                  <th>Target Margin</th>
                  <th>Sales Volume</th>
                  <th>Status</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {itemStats.map((item) => {
                  const status = item.isHealthy ? "Safe" : "Watch";

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.menuItem}</strong>
                      </td>
                      <td>{item.category ?? "Menu item"}</td>
                      <td>{formatCurrency(item.sellingPrice)}</td>
                      <td>{formatCurrency(item.foodCost)}</td>
                      <td>{formatPercent(item.margin)}</td>
                      <td>{formatPercent(item.targetMarginPercent, 0)}</td>
                      <td>{item.salesVolume}</td>
                      <td>
                        <StatusBadge label={status} />
                      </td>
                      <td>{item.recommendation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionCard>
  );
}
