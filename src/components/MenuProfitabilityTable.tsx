import { Utensils } from "lucide-react";
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

export function MenuProfitabilityTable({ items }: MenuProfitabilityTableProps) {
  const needsPricingWork = items.filter(
    (item) =>
      calculateMarginPercent(item.sellingPrice, item.foodCost) <
      item.targetMarginPercent,
  ).length;

  return (
    <SectionCard
      id="menu-pricing"
      eyebrow="Menu profitability"
      title="Pricing and Margin Control"
      action={
        <span className="section-stat">
          <Utensils aria-hidden="true" size={17} />
          {needsPricingWork} below target
        </span>
      }
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Menu Item</th>
              <th>Selling Price</th>
              <th>Food Cost</th>
              <th>Margin</th>
              <th>Target Margin</th>
              <th>Sales Volume</th>
              <th>AI Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const margin = calculateMarginPercent(
                item.sellingPrice,
                item.foodCost,
              );
              const status = margin >= item.targetMarginPercent ? "Safe" : "Watch";

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.menuItem}</strong>
                    <StatusBadge label={status} />
                  </td>
                  <td>{formatCurrency(item.sellingPrice)}</td>
                  <td>{formatCurrency(item.foodCost)}</td>
                  <td>{formatPercent(margin)}</td>
                  <td>{formatPercent(item.targetMarginPercent, 0)}</td>
                  <td>{item.salesVolume}</td>
                  <td>{item.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
