import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  tone: "emerald" | "amber" | "coral" | "blue" | "violet" | "ink";
  icon: LucideIcon;
}

export function KpiCard({ label, value, helper, tone, icon: Icon }: KpiCardProps) {
  const hasLongValue = value.length > 24;

  return (
    <article
      className={`kpi-card kpi-card--${tone}${
        hasLongValue ? " kpi-card--long-value" : ""
      }`}
    >
      <div className="kpi-card__topline">
        <span>{label}</span>
        <Icon aria-hidden="true" size={20} />
      </div>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}
