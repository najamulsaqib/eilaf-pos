import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { Fragment, type ComponentType } from 'react';

export interface DropdownMenuItem {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  badge?: string | number;
  divider?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  buttonLabel?: string;
  buttonVariant?: 'icon' | 'text' | 'ghost';
}

export default function DropdownMenu({
  items,
  buttonLabel = 'Options',
  buttonVariant = 'icon',
}: DropdownMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {buttonVariant === 'ghost' ? (
        <MenuButton className="inline-flex items-center justify-center rounded-md p-1 text-ink-ghost hover:text-ink-dim hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-all">
          <EllipsisHorizontalIcon
            className="h-5 w-5"
            aria-label={buttonLabel}
          />
        </MenuButton>
      ) : (
        <MenuButton className="inline-flex items-center justify-center gap-2 rounded-lg border border-edge bg-surface px-3.5 py-2 text-sm font-medium text-ink-dim shadow-sm hover:bg-surface-raised hover:border-edge-strong focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-all">
          {buttonVariant === 'icon' ? (
            <EllipsisHorizontalIcon
              className="h-5 w-5 text-ink-dim"
              aria-label={buttonLabel}
            />
          ) : (
            <>
              <span>{buttonLabel}</span>
              <EllipsisHorizontalIcon className="h-4 w-4 text-ink-faint" />
            </>
          )}
        </MenuButton>
      )}

      <MenuItems
        transition
        anchor="bottom end"
        className="z-50 w-64 divide-y divide-edge rounded-xl bg-surface shadow-xl ring-1 ring-slate-900/5 dark:ring-slate-700/50 focus:outline-none overflow-hidden origin-top-right transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        <div className="py-1.5">
          {items.map((item, index) => (
            <Fragment key={index}>
              <MenuItem disabled={item.disabled}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`${
                      focus
                        ? item.variant === 'danger'
                          ? 'bg-red-50 dark:bg-red-900/30'
                          : 'bg-surface-raised'
                        : ''
                    } ${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    } group flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer`}
                  >
                    {item.icon && (
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          focus
                            ? item.variant === 'danger'
                              ? 'bg-red-100 dark:bg-red-900/50'
                              : 'bg-primary-100 dark:bg-primary-900/30'
                            : 'bg-surface-muted'
                        } transition-colors`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${
                            focus
                              ? item.variant === 'danger'
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-primary-700 dark:text-primary-400'
                              : 'text-ink-dim'
                          }`}
                        />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div
                        className={`font-medium ${
                          focus
                            ? item.variant === 'danger'
                              ? 'text-red-900 dark:text-red-300'
                              : 'text-primary-900 dark:text-primary-200'
                            : item.variant === 'danger'
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-ink'
                        }`}
                      >
                        {item.label}
                      </div>
                    </div>
                    {item.badge !== undefined && (
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-primary-600 text-xs font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
              </MenuItem>
              {item.divider && index < items.length - 1 && (
                <div className="my-1 border-t border-edge-muted" />
              )}
            </Fragment>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
