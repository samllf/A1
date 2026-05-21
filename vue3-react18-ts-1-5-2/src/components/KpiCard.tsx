import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: 'green' | 'blue' | 'amber';
}

export const KpiCard = ({ label, value, icon, tone = 'green' }: KpiCardProps) => {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
};
