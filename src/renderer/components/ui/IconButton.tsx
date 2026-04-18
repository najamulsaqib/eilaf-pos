import React from 'react';

interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  variant?: 'default' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const variantClasses = {
  default:
    'text-ink-faint hover:bg-edge/40 active:bg-edge-strong/40 hover:text-ink transition-colors rounded-md',
  subtle:
    'text-ink-faint hover:bg-surface-muted/40 active:bg-edge/40 hover:text-ink transition-colors rounded-md',
  danger:
    'text-stat-red-icon hover:bg-stat-red-icon-bg active:bg-stat-red-icon-bg transition-colors rounded-md',
};

export default function IconButton({
  icon,
  onClick: onClickProp,
  disabled = false,
  title,
  type = 'button',
  className = '',
  variant = 'default',
  size = 'md',
}: IconButtonProps) {
  const Icon = icon;

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClickProp?.();
  };

  return (
    <button
      type={type}
      onClick={handleOnClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <Icon className={iconSizeClasses[size]} />
    </button>
  );
}
