import { type InputHTMLAttributes } from 'react';

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string;
  hint?: string;
};

export default function CheckboxField({
  id,
  label,
  hint,
  className = '',
  ...props
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className={`flex w-full cursor-pointer items-center ${className}`}
    >
      <div className="flex h-5 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className="me-2 h-4 w-4 accent-primary-600 focus:ring-focus-ring not-checked:appearance-none not-checked:rounded not-checked:border not-checked:border-edge-strong not-checked:bg-surface-muted cursor-pointer"
          {...props}
        />
      </div>
      <div className="ms-3">
        <span className="text-sm font-medium text-ink-dim">{label}</span>
        {hint && <p className="text-sm text-ink-faint">{hint}</p>}
      </div>
    </label>
  );
}
