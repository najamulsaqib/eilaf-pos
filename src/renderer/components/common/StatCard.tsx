import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'orange' | 'red' | 'theme' | 'neon';
}

const colorClasses = {
  green: {
    border: 'border-stat-green-border',
    iconBg: 'bg-stat-green-icon-bg',
    icon: 'text-stat-green-icon',
  },
  orange: {
    border: 'border-stat-orange-border',
    iconBg: 'bg-stat-orange-icon-bg',
    icon: 'text-stat-orange-icon',
  },
  yellow: {
    border: 'border-stat-yellow-border',
    iconBg: 'bg-stat-yellow-icon-bg',
    icon: 'text-stat-yellow-icon',
  },
  red: {
    border: 'border-stat-red-border',
    iconBg: 'bg-stat-red-icon-bg',
    icon: 'text-stat-red-icon',
  },
  theme: {
    border: 'border-stat-theme-border',
    iconBg: 'bg-stat-theme-icon-bg',
    icon: 'text-stat-theme-icon',
  },
  neon: {
    border: 'border-stat-neon-border',
    iconBg: 'bg-stat-neon-icon-bg',
    icon: 'text-stat-neon-icon',
  },
};

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: StatCardProps) {
  const c = colorClasses[color] ?? colorClasses.theme;
  return (
    <div
      className={`flex items-center gap-3 bg-surface rounded-xl border border-l-4 ${c.border} px-4 py-3 sm:px-5 sm:py-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div
        className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-ink-ghost uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-ink leading-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-[10px] sm:text-xs text-ink-ghost truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
