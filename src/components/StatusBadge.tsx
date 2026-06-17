interface StatusBadgeProps {
  label: string;
}

export function StatusBadge({ label }: StatusBadgeProps) {
  const tone = label.toLowerCase().replace(/\s+/g, "-");

  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}
