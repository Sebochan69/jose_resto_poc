import { ChevronDown, ChevronUp, PackageCheck, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  InventoryItem,
  InventoryStatus,
  InventorySummary,
} from "../data/mockRestaurantData";
import { calculateDaysLeft } from "../utils/calculations";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

interface InventoryRiskTableProps {
  items: InventoryItem[];
  summary?: InventorySummary;
}

const filters: Array<"All" | InventoryStatus> = ["All", "Critical", "Watch", "Safe"];

export function InventoryRiskTable({ items, summary }: InventoryRiskTableProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [draftedReorder, setDraftedReorder] = useState<string | null>(null);
  const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>({});

  const criticalItems = useMemo(
    () => items.filter((item) => item.status === "Critical"),
    [items],
  );
  const visibleItems = useMemo(
    () =>
      activeFilter === "All"
        ? items
        : items.filter((item) => item.status === activeFilter),
    [activeFilter, items],
  );
  const criticalCount = summary?.criticalCount ?? criticalItems.length;
  const watchCount =
    summary?.watchCount ??
    items.filter((item) => item.status === "Watch").length;
  const safeCount =
    summary?.safeCount ??
    items.filter((item) => item.status === "Safe").length;
  const totalItems = summary?.totalItems ?? items.length;

  const getReorderQuantity = (item: InventoryItem) =>
    reorderQuantities[item.id] ?? item.suggestedReorder;

  const adjustReorderQuantity = (item: InventoryItem, direction: "up" | "down") => {
    const step = item.unit === "pcs" ? 10 : 1;
    const currentQuantity = getReorderQuantity(item);
    const nextQuantity =
      direction === "up"
        ? currentQuantity + step
        : Math.max(step, currentQuantity - step);

    setReorderQuantities((current) => ({
      ...current,
      [item.id]: Number(nextQuantity.toFixed(1)),
    }));
  };

  const draftReorder = (item: InventoryItem) => {
    setDraftedReorder(
      "Reorder request drafted for " +
        item.item +
        ": " +
        getReorderQuantity(item) +
        " " +
        item.unit +
        " from " +
        (item.supplier ?? "preferred supplier") +
        ".",
    );
  };

  const draftAllCriticalReorders = () => {
    const draftSummary = criticalItems
      .map((item) => getReorderQuantity(item) + " " + item.unit + " " + item.item)
      .join(", ");

    setDraftedReorder(
      "Bulk reorder drafted for " +
        criticalItems.length +
        " critical items: " +
        draftSummary +
        ".",
    );
  };

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
      <div className="metric-strip inventory-summary-strip" aria-label="Inventory summary">
        <div>
          <span>Critical</span>
          <strong>{criticalCount}</strong>
        </div>
        <div>
          <span>Watch</span>
          <strong>{watchCount}</strong>
        </div>
        <div>
          <span>Safe</span>
          <strong>{safeCount}</strong>
        </div>
        <div>
          <span>Total Items</span>
          <strong>{totalItems}</strong>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">No inventory data is available yet.</div>
      ) : (
        <>
          {criticalItems.length > 0 ? (
            <>
              <div className="inventory-bulk-action">
                <div>
                  <strong>Critical reorder batch</strong>
                  <p>Draft all critical reorder requests at once, or tune quantities per item below.</p>
                </div>
                <button
                  className="button button--primary"
                  onClick={draftAllCriticalReorders}
                  type="button"
                >
                  <ShoppingCart aria-hidden="true" size={16} />
                  Reorder All Critical
                </button>
              </div>

              <div className="warning-card-grid" aria-label="Critical inventory warnings">
                {criticalItems.map((item) => {
                  const daysLeft = calculateDaysLeft(item.currentStock, item.dailyUsage);

                  return (
                    <article className="warning-card warning-card--critical" key={item.id}>
                      <span>Critical stock</span>
                      <strong>{item.item}</strong>
                      <p>
                        {daysLeft.toFixed(1)} days left. Draft reorder for {getReorderQuantity(item)} {item.unit} with {item.supplier ?? "supplier"}.
                      </p>
                      <div className="reorder-card-actions">
                        <div className="reorder-stepper" aria-label={item.item + " reorder quantity"}>
                          <button
                            aria-label={"Decrease " + item.item + " reorder quantity"}
                            onClick={() => adjustReorderQuantity(item, "down")}
                            type="button"
                          >
                            <ChevronDown aria-hidden="true" size={15} />
                          </button>
                          <strong>{getReorderQuantity(item)} {item.unit}</strong>
                          <button
                            aria-label={"Increase " + item.item + " reorder quantity"}
                            onClick={() => adjustReorderQuantity(item, "up")}
                            type="button"
                          >
                            <ChevronUp aria-hidden="true" size={15} />
                          </button>
                        </div>
                        <button
                          className="button button--ghost"
                          onClick={() => draftReorder(item)}
                          type="button"
                        >
                          <ShoppingCart aria-hidden="true" size={16} />
                          Reorder
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="insight-panel insight-panel--positive">
              No critical stock warnings in the current dashboard data.
            </div>
          )}

          <div className="filter-bar" aria-label="Inventory status filters">
            {filters.map((filter) => (
              <button
                aria-pressed={activeFilter === filter}
                className={activeFilter === filter ? "filter-chip filter-chip--active" : "filter-chip"}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          {draftedReorder ? (
            <div className="daily-report-notice daily-report-notice--success" role="status">
              <ShoppingCart aria-hidden="true" size={16} />
              {draftedReorder}
            </div>
          ) : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Daily Usage</th>
                  <th>Days Left</th>
                  <th>Reorder Level</th>
                  <th>Suggested Reorder</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const daysLeft = calculateDaysLeft(item.currentStock, item.dailyUsage);

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.item}</strong>
                        <span>{item.unit}</span>
                      </td>
                      <td>{item.category ?? "Core item"}</td>
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
                        <div className="reorder-stepper reorder-stepper--table" aria-label={item.item + " reorder quantity"}>
                          <button
                            aria-label={"Decrease " + item.item + " reorder quantity"}
                            disabled={item.status === "Safe"}
                            onClick={() => adjustReorderQuantity(item, "down")}
                            type="button"
                          >
                            <ChevronDown aria-hidden="true" size={14} />
                          </button>
                          <strong>{getReorderQuantity(item)} {item.unit}</strong>
                          <button
                            aria-label={"Increase " + item.item + " reorder quantity"}
                            disabled={item.status === "Safe"}
                            onClick={() => adjustReorderQuantity(item, "up")}
                            type="button"
                          >
                            <ChevronUp aria-hidden="true" size={14} />
                          </button>
                        </div>
                      </td>
                      <td>{item.supplier ?? "Preferred supplier"}</td>
                      <td>
                        <StatusBadge label={item.status} />
                      </td>
                      <td>
                        <button
                          className="button button--ghost button--table"
                          disabled={item.status === "Safe"}
                          onClick={() => draftReorder(item)}
                          type="button"
                        >
                          <ShoppingCart aria-hidden="true" size={15} />
                          Reorder
                        </button>
                      </td>
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
