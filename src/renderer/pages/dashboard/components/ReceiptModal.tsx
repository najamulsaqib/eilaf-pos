import Button from '@components/ui/Button';
import IconButton from '@components/ui/IconButton';
import DataTable from '@components/table/DataTable';
import LoadingSpinner from '@components/common/LoadingSpinner';
import Modal from '@components/ui/Modal';
import { PrinterIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { printApi } from '@services/db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function fmtQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/\.?0+$/, '');
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type ReceiptModalProps = {
  isOpen: boolean;
  receipt: IBill | null;
  receiptCart: ICartItem[];
  onClose: () => void;
  formatCurrency: (n: number) => string;
  loading?: boolean;
  onDelete?: () => Promise<void>;
};

export default function ReceiptModal({
  isOpen,
  receipt,
  receiptCart,
  onClose,
  formatCurrency,
  loading = false,
  onDelete,
}: ReceiptModalProps) {
  const { t } = useTranslation();
  const [printing, setPrinting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  const handlePrint = async () => {
    if (!receipt) return;
    setPrinting(true);
    try {
      await printApi.bill(receipt.id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPrinting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        receipt ? `${t('bills.detail.title')} — ${receipt.bill_number}` : ''
      }
      size="lg"
      maxHeight="max-h-[85vh]"
      footer={
        receipt ? (
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5 rounded-lg border border-edge bg-surface-raised p-3 text-sm shrink-0">
              <div className="flex items-center justify-between text-ink-faint">
                <span>{t('bills.detail.subtotal')}</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex items-center justify-between text-primary-700">
                  <span>{t('pos.discount')}</span>
                  <span>- {formatCurrency(receipt.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-edge pt-2 text-base font-bold text-ink">
                <span>{t('pos.total')}</span>
                <span className="text-primary-700">
                  {formatCurrency(receipt.total)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              {isDev && onDelete && (
                <IconButton
                  variant="danger"
                  icon={TrashIcon}
                  onClick={handleDelete}
                  disabled={deleting}
                />
              )}
              <div className="ms-auto">
                <Button
                  icon={PrinterIcon}
                  busy={printing}
                  onClick={handlePrint}
                >
                  {t('bills.print')}
                </Button>
              </div>
            </div>
          </div>
        ) : undefined
      }
      header={
        receipt ? (
          <div className="rounded-lg border border-edge bg-surface-raised p-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge bg-surface text-ink-faint shrink-0">
                  <UserIcon className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-ghost">
                  {t('bills.customer')}
                </p>
                <p className="truncate text-sm font-medium text-ink">
                  {receipt.customer_name || t('bills.noCustomer')}
                </p>
              </div>

              <div className="flex gap-4 shrink-0 items-center">
                <div className="flex items-center gap-1">
                  <p className="text-xs uppercase tracking-wide text-ink-ghost">
                    {t('bills.items')}:
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {receiptCart.length > 0
                      ? receiptCart.length
                      : (receipt?.items?.length ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xs uppercase tracking-wide text-ink-ghost">
                    {t('bills.date')}:
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-ink-faint">
                    {formatDate(receipt.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : receipt ? (
        <div className="rounded-xl overflow-hidden border border-edge">
          <DataTable
            columns={[
              {
                id: 'name',
                header: t('bills.detail.name'),
                render: (item) => (
                  <span className="font-medium text-ink">{item.name}</span>
                ),
              },
              {
                id: 'qty',
                header: t('bills.detail.qty'),
                align: 'center',
                size: '80px',
                render: (item) => (
                  <span className="text-ink-faint">
                    {`${fmtQty(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`}
                  </span>
                ),
              },
              {
                id: 'price',
                header: t('bills.detail.price'),
                align: 'right',
                render: (item) => (
                  <span className="text-ink-faint">
                    {formatCurrency(item.price)}
                  </span>
                ),
              },
              {
                id: 'total',
                header: t('bills.detail.total'),
                align: 'right',
                render: (item) => (
                  <span className="font-semibold text-ink">
                    {formatCurrency(item.total ?? item.price * item.quantity)}
                  </span>
                ),
              },
            ]}
            rows={
              receiptCart.length > 0
                ? receiptCart
                : ((receipt?.items ?? []) as any[])
            }
            getRowId={(item) =>
              `${item.product_id}-${item.quantity}-${item.price}`
            }
            emptyMessage={t('common.empty')}
          />
        </div>
      ) : null}
    </Modal>
  );
}
