import { type InputHTMLAttributes, type ReactNode } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export default function TextField({
  id,
  label,
  hint,
  error,
  prefix,
  suffix,
  className = '',
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-ink-dim">
        {label}
      </label>
      {hint && <p className="text-sm text-ink-faint">{hint}</p>}
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-sm font-medium text-ink-faint">{prefix}</span>
          </div>
        )}
        <input
          id={id}
          type="text"
          className={`
            block w-full rounded-lg border border-edge-strong bg-surface py-2.5 text-sm text-ink shadow-sm
            placeholder:text-ink-ghost
            focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
            disabled:bg-surface-muted disabled:text-ink-ghost disabled:cursor-not-allowed
            transition-colors
            ${prefix ? 'pl-12' : 'pl-3'}
            ${suffix ? 'pr-10' : 'pr-3'}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
