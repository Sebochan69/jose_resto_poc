import type { ReactNode } from "react";

interface SectionCardProps {
  id?: string;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  id,
  eyebrow,
  title,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section id={id} className={`section-card ${className}`.trim()}>
      <div className="section-card__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="section-card__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
