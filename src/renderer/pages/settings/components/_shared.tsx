import { type ComponentType } from 'react';

export function PanelHeader({
  icon: Icon,
  title,
  desc,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="px-7 py-5 border-b border-edge-muted flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-ink-dim" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="text-xs text-ink-faint mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-7 py-2 bg-surface-muted/60">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-ghost">
        {label}
      </p>
    </div>
  );
}

export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-7 py-4 gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="text-xs text-ink-faint mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function PanelFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-7 py-4 bg-surface-muted/50 border-t border-edge-muted flex justify-end">
      {children}
    </div>
  );
}
