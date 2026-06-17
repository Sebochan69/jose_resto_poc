import {
  AlertTriangle,
  BarChart3,
  Bot,
  FileText,
  Gauge,
  LayoutDashboard,
  Package,
  Utensils,
  Users,
} from "lucide-react";

const navItems = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#profit-leaks", label: "Profit Leaks", icon: AlertTriangle },
  { href: "#inventory", label: "Inventory", icon: Package },
  { href: "#menu-pricing", label: "Menu Pricing", icon: Utensils },
  { href: "#payroll", label: "Payroll", icon: Users },
  { href: "#projections", label: "Projections", icon: BarChart3 },
  { href: "#ai-reports", label: "AI Reports", icon: FileText },
  { href: "#ai-consultant", label: "AI Consultant", icon: Bot },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="JOSE RESTO POC overview">
        <span className="brand__mark">
          <Gauge aria-hidden="true" size={22} />
        </span>
        <span>
          <strong>JOSE RESTO</strong>
          <small>POC Control Room</small>
        </span>
      </a>

      <nav className="nav" aria-label="Dashboard sections">
        {navItems.map(({ href, label, icon: Icon }) => (
          <a href={href} key={href}>
            <Icon aria-hidden="true" size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
