import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-ink-ghost mb-4">
          {icon}
        </div>
      )}
      <h3 className="mt-2 text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-ink-faint">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
