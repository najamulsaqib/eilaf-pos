import { useState, type ComponentType, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabBarProps {
  tabs: TabItem[];
  /** Controlled active tab id */
  value?: string;
  /** Initial tab id for uncontrolled mode */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** underline — navigation-style with bottom border indicator
   *  pills    — segmented toggle buttons (default) */
  variant?: 'underline' | 'pills';
  className?: string;
  /** Render prop receives the currently active tab id.
   *  Omit when you only need the tab bar (content rendered elsewhere). */
  children?: (activeId: string) => ReactNode;
}

export default function TabBar({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = 'pills',
  className = '',
  children,
}: TabBarProps) {
  const [internalActive, setInternalActive] = useState(
    defaultValue ?? tabs[0]?.id ?? '',
  );

  // Support both controlled (value prop) and uncontrolled mode
  const activeId = value ?? internalActive;

  const handleSelect = (id: string) => {
    if (value === undefined) setInternalActive(id);
    onChange?.(id);
  };

  return (
    <div className={className}>
      {/* ── Underline variant ── */}
      {variant === 'underline' && (
        <div className="border-b border-edge">
          <div className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => {
              const active = activeId === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-ink-faint hover:border-edge-strong hover:text-ink-dim'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-primary-600' : 'text-ink-ghost'}`}
                    />
                  )}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                        active
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-surface-muted text-ink-dim'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pills variant ── */}
      {variant === 'pills' && (
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-edge bg-surface-muted p-1.5">
          {tabs.map((tab) => {
            const active = activeId === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-faint hover:text-ink-dim'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-ink-ghost'}`}
                  />
                )}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      active
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-muted text-ink-dim'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab content via render prop */}
      {children && <div className="mt-4">{children(activeId)}</div>}
    </div>
  );
}
