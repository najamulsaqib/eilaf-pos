import LoadingSpinner from '@components/common/LoadingSpinner';
import StatCard from '@components/common/StatCard';
import AppLayout from '@components/layout/AppLayout';
import DataTable from '@components/table/DataTable';
import Pagination from '@components/table/Pagination';
import Button from '@components/ui/Button';
import IconButton from '@components/ui/IconButton';
import Modal from '@components/ui/Modal';
import {
  BanknotesIcon,
  DocumentTextIcon,
  PrinterIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useBills } from '@hooks/useBills';
import { billsApi, printApi } from '@services/db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

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

export default function BillsPage() {
  const { t } = useTranslation();
  const {
    bills,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    stats,
    reload,
  } = useBills();

  const isDev = process.env.NODE_ENV !== 'production';

  const [selected, setSelected] = useState<IBill | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [printingBill, setPrintingBill] = useState(false);

  const handleRowClick = async (bill: IBill) => {
    setLoadingDetail(true);
    try {
      const full = await billsApi.get(bill.id);
      setSelected(full);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrintBill = async () => {
    if (!selected) return;
    setPrintingBill(true);
    try {
      await printApi.bill(selected.id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPrintingBill(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!selected) return;
    try {
      await billsApi.delete(selected.id);
      setSelected(null);
      reload();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const columns = [
    {
      id: 'bill_number',
      header: t('bills.number'),
      render: (b: IBill) => (
        <span className="font-mono font-semibold text-primary-700">
          {b.bill_number}
        </span>
      ),
    },
    {
      id: 'customer_name',
      header: t('bills.customer'),
      render: (b: IBill) => (
        <span
          className={b.customer_name ? 'text-ink' : 'text-ink-faint italic'}
        >
          {b.customer_name || t('bills.noCustomer')}
        </span>
      ),
    },
    {
      id: 'item_count',
      header: t('bills.items'),
      render: (b: IBill) => (
        <span className="text-ink">{b.item_count ?? 0}</span>
      ),
    },
    {
      id: 'total',
      header: t('bills.total'),
      render: (b: IBill) => (
        <span className="font-semibold text-ink">{fmt(b.total)}</span>
      ),
    },
    {
      id: 'created_at',
      header: t('bills.date'),
      render: (b: IBill) => (
        <span className="text-sm text-ink-faint">
          {formatDate(b.created_at)}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label={t('pos.todayBills')}
          value={stats.count}
          icon={DocumentTextIcon}
          color="theme"
        />
        <StatCard
          label={t('pos.todayRevenue')}
          value={fmt(stats.revenue)}
          icon={BanknotesIcon}
          color="green"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-edge">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={bills || []}
            getRowId={(b) => b.id}
            onRowClick={handleRowClick}
            footer={
              total > pageSize ? (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              ) : undefined
            }
          />
        )}
      </div>

      {/* Bill Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected ? `${t('bills.detail.title')} — ${selected.bill_number}` : ''
        }
        size="lg"
        maxHeight="max-h-[85vh]"
        footer={
          selected ? (
            <div className="flex justify-between items-center">
              {isDev && (
                <IconButton
                  variant="danger"
                  icon={TrashIcon}
                  onClick={handleDeleteBill}
                />
              )}
              <div className="ms-auto">
                <Button
                  icon={PrinterIcon}
                  busy={printingBill}
                  onClick={handlePrintBill}
                >
                  {t('bills.print')}
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : selected ? (
          <div className="space-y-5">
            {/* Meta */}
            <div className="rounded-xl border border-edge bg-surface-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-ghost">
                    {t('bills.customer')}
                  </p>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-ink-faint">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <p className="truncate text-sm font-medium text-ink">
                      {selected.customer_name || t('bills.noCustomer')}
                    </p>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[18rem]">
                  <div className="rounded-lg border border-edge bg-surface px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-ink-ghost">
                      {t('bills.date')}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-ink-faint">
                      {formatDate(selected.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-edge bg-surface px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-ink-ghost">
                      {t('bills.items')}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">
                      {selected.items?.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-hidden rounded-xl border border-edge bg-surface">
              <div className="border-b border-edge bg-surface-muted px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {t('bills.items')}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge text-xs uppercase tracking-wide text-ink-faint">
                      <th className="pb-2 ps-4 pt-3 text-start font-medium">
                        {t('bills.detail.name')}
                      </th>
                      <th className="w-20 pb-2 pt-3 text-center font-medium">
                        {t('bills.detail.qty')}
                      </th>
                      <th className="w-28 pb-2 pe-4 pt-3 text-end font-medium">
                        {t('bills.detail.price')}
                      </th>
                      <th className="w-28 pb-2 pe-4 pt-3 text-end font-medium">
                        {t('bills.detail.total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {(selected.items ?? []).map((item: IBillItem) => (
                      <tr key={item.id} className="hover:bg-surface-raised/60">
                        <td className="py-2.5 ps-4 font-medium text-ink">
                          {item.name}
                        </td>
                        <td className="py-2.5 text-center text-ink-faint">
                          {fmtQty(item.quantity)}
                          {item.unit ? ` ${item.unit}` : ''}
                        </td>
                        <td className="py-2.5 pe-4 text-end text-ink-faint">
                          {fmt(item.price)}
                        </td>
                        <td className="py-2.5 pe-4 text-end font-semibold text-ink">
                          {fmt(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 rounded-xl border border-edge bg-surface-raised p-4 text-sm">
              <div className="flex items-center justify-between text-ink-faint">
                <span>{t('bills.detail.subtotal')}</span>
                <span>{fmt(selected.subtotal)}</span>
              </div>
              {selected.discount > 0 && (
                <div className="flex items-center justify-between text-primary-700">
                  <span>{t('pos.discount')}</span>
                  <span>- {fmt(selected.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-edge pt-2 text-base font-bold text-ink">
                <span>{t('pos.total')}</span>
                <span className="text-primary-700">{fmt(selected.total)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppLayout>
  );
}
