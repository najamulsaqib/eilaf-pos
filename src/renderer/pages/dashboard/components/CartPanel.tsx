import IconButton from '@components/ui/IconButton';
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid';
import {
  DocumentTextIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

type CartPanelProps = {
  cart: ICartItem[];
  customerName: string;
  discount: string;
  subtotal: number;
  discountAmt: number;
  total: number;
  creating: boolean;
  onCustomerNameChange: (value: string) => void;
  onDiscountChange: (value: string) => void;
  onClearCart: () => void;
  onChangeQty: (idx: number, delta: number) => void;
  onSetItemQty: (idx: number, value: string) => void;
  onRemoveItem: (idx: number) => void;
  onCreateBill: () => void;
};

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

function fmtQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/\.?0+$/, '');
}

export default function CartPanel({
  cart,
  customerName,
  discount,
  subtotal,
  discountAmt,
  total,
  creating,
  onCustomerNameChange,
  onDiscountChange,
  onClearCart,
  onChangeQty,
  onSetItemQty,
  onRemoveItem,
  onCreateBill,
}: CartPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="my-3 me-3 flex w-100 flex-col rounded-2xl border border-edge bg-surface shadow-sm">
      <div className="shrink-0 border-b border-edge px-5 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-ink-ghost" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-dim">
              {t('pos.currentBill')}
            </h2>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="cursor-pointer rounded-md p-1 text-ink-ghost transition-colors hover:bg-stat-red-icon-bg hover:text-stat-red-icon"
              title={t('pos.clearCart')}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder={t('pos.customer')}
            className="w-full rounded-xl border border-edge bg-surface-muted py-2 pe-3 ps-9 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-ink-ghost">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
              <DocumentTextIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-faint">
                {t('pos.emptyCart')}
              </p>
              <p className="mt-0.5 text-xs text-ink-ghost">
                {t('pos.emptyCartDesc')}
              </p>
            </div>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-edge bg-surface-raised px-3 py-2.5 transition-colors hover:border-edge-strong"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-bold text-ink">
                  {item.name}
                </p>
                <IconButton
                  icon={XMarkIcon}
                  onClick={() => onRemoveItem(idx)}
                  className="shrink-0"
                  aria-label={t('common.delete')}
                  variant="danger"
                />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-ink-ghost">
                    {t('bills.detail.price')}
                    {item.unit ? ` / ${item.unit}` : ''}
                  </p>
                  <p className="truncate text-xs font-semibold text-ink-dim">
                    {fmt(item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <IconButton
                    icon={MinusIcon}
                    onClick={() => onRemoveItem(idx)}
                    className="shrink-0 bg-ink-ghost text-white hover:bg-ink-dim"
                    aria-label={t('common.delete')}
                    size="sm"
                  />
                  <input
                    type="number"
                    min={item.allows_decimal ? '0.01' : '1'}
                    step={item.allows_decimal ? '0.25' : '1'}
                    value={fmtQty(item.quantity)}
                    onChange={(e) => onSetItemQty(idx, e.target.value)}
                    className="w-14 h-7 rounded-lg border border-edge bg-surface px-1 py-1 text-center text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  <IconButton
                    icon={PlusIcon}
                    onClick={() => onChangeQty(idx, 1)}
                    className="shrink-0 bg-primary-500 text-white hover:bg-primary-500"
                    size="sm"
                  />
                </div>

                <div className="text-end">
                  <p className="text-[10px] uppercase tracking-wide text-ink-ghost">
                    {t('bills.detail.total')}
                  </p>
                  <p className="text-sm font-extrabold text-ink">
                    {fmt(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-edge-muted px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-ghost">
            {t('pos.discount')}
          </span>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value)}
            placeholder="0"
            className="flex-1 rounded-xl border border-edge bg-surface-muted px-3 py-1.5 text-end text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-1.5 rounded-xl bg-surface-muted px-3 py-2.5">
          <div className="flex justify-between text-xs text-ink-faint">
            <span>{t('pos.subtotal')}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-xs text-primary-700">
              <span>{t('pos.discount')}</span>
              <span>- {fmt(discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-edge pt-1.5 text-base font-bold text-ink">
            <span>{t('pos.total')}</span>
            <span className="text-lg text-primary-700">{fmt(total)}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0 || creating}
          onClick={onCreateBill}
          className="w-full cursor-pointer rounded-2xl bg-primary-600 py-3 text-sm font-bold text-button-on-dark shadow-sm transition-all hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint"
        >
          {creating ? '…' : t('pos.createBill')}
        </button>
      </div>
    </div>
  );
}
