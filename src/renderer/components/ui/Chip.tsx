import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'grey' | 'primary' | 'outline' | 'green' | 'red' | 'amber' | 'purple' | 'blue' | 'teal' | 'cyan' | 'indigo' | 'violet' | 'fuchsia' | 'pink' | 'rose' | 'sky' | 'emerald' | 'lime' | 'yellow' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'default' | 'full';
  icon?: React.ReactNode;
  onRemove?: () => void;
  clickable?: boolean;
}

const variantClasses = {
  default: 'bg-surface-muted text-ink-dim',
  grey: 'bg-edge text-ink-dim',
  primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  outline: 'border border-edge-strong bg-transparent text-ink-dim',
  green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  blue: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300',
  pink: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  lime: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const roundedClasses = {
  default: 'rounded-md',
  full: 'rounded-full',
};

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      children,
      variant = 'default',
      size = 'sm',
      rounded = 'default',
      className = '',
      icon,
      onRemove,
      clickable = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const Component = clickable || onClick ? 'button' : 'div';

    return (
      <Component
        ref={ref as any}
        className={`
          inline-flex items-center font-medium transition-colors
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${roundedClasses[rounded]}
          ${clickable || onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2' : ''}
          ${className}
        `}
        onClick={onClick}
        type={Component === 'button' ? 'button' : undefined}
        {...(props as any)}
      >
        {icon && <span className="mr-1.5 flex items-center">{icon}</span>}
        <span className="flex items-center capitalize">{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1.5 inline-flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Remove"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </Component>
    );
  }
);

Chip.displayName = 'Chip';
