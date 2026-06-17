import { PackageCheck } from "lucide-react";
import type { InventoryItem } from "../data/mockRestaurantData";
import { calculateDaysLeft } from "../utils/calculations";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

interface InventoryRiskTableProps {
  items: InventoryItem[];
}

export function InventoryRiskTable({ items }: InventoryRiskTableProps) {
  const criticalCount = items.filter((item) => item.status === "Critical").length;

  return (
    <SectionCard
      id="inventory"
      eyebrow="Inventory risk"
      title="Stock Coverage"
      action={
        <span className="section-stat">
          <PackageCheck aria-hidden="true" size={17} />
          {criticalCount} critical
        </span>
      }
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Current Stock</th>
              <th>Daily Usage</th>
              <th>Days Left</th>
              <th>Reorder Level</th>
              <th>Suggested Reorder</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const daysLeft = calculateDaysLeft(item.currentStock, item.dailyUsage);

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.item}</strong>
                    <span>{item.unit}</span>
                  </td>
                  <td>
                    {item.currentStock} {item.unit}
                  </td>
                  <td>
                    {item.dailyUsage} {item.unit}
                  </td>
                  <td>{daysLeft.toFixed(1)}</td>
                  <td>
                    {item.reorderLevel} {item.unit}
                  </td>
                  <td>
                    {item.suggestedReorder} {item.unit}
                  </td>
                  <td>
                    <StatusBadge label={item.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
