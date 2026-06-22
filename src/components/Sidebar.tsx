import {
  AlertTriangle,
  FileText,
  Gauge,
  LayoutDashboard,
  Package,
  TrendingUp,
  Utensils,
  Users,
} from "lucide-react";
import type { DashboardPage } from "../types";

interface SidebarProps {
  activePage: DashboardPage;
  onPageChange: (page: DashboardPage) => void;
}

const navItems: Array<{
  page: DashboardPage;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "profit-leaks", label: "Profit Leaks", icon: AlertTriangle },
  { page: "forecast", label: "Forecast", icon: TrendingUp },
  { page: "inventory", label: "Inventory", icon: Package },
  { page: "menu-pricing", label: "Menu Pricing", icon: Utensils },
  { page: "payroll", label: "Payroll", icon: Users },
  { page: "reports", label: "Reports", icon: FileText },
];

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <button
        className="brand"
        onClick={() => onPageChange("overview")}
        type="button"
        aria-label="JOSE RESTO POC overview"
      >
        <span className="brand__mark">
          <Gauge aria-hidden="true" size={22} />
        </span>
        <span>
          <strong>JOSE RESTO</strong>
          <small>POC Control Room</small>
        </span>
      </button>

      <nav className="nav" aria-label="Dashboard pages">
        {navItems.map(({ page, label, icon: Icon }) => (
          <button
            aria-current={activePage === page ? "page" : undefined}
            className={activePage === page ? "nav__item nav__item--active" : "nav__item"}
            key={page}
            onClick={() => onPageChange(page)}
            type="button"
          >
            <Icon aria-hidden="true" size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
