import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BanknotesIcon,
  DocumentTextIcon,
  PrinterIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import StatCard from '@components/common/StatCard';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';
import Pagination from '@components/table/Pagination';
import DataTable from '@components/table/DataTable';
import { useBills } from '@hooks/useBills';
import { billsApi, printApi } from '@services/db';

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
  const [deletingBill, setDeletingBill] = useState(false);

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
    setDeletingBill(true);
    try {
      await billsApi.delete(selected.id);
      setSelected(null);
      reload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeletingBill(false);
    }
  };

  const columns = [
    {
      id: 'bill_number',
      header: t('bills.number'),
      render: (b: IBill) => (
        <span className="font-mono font-semibold text-blue-700">
          {b.bill_number}
        </span>
      ),
    },
    {
      id: 'customer_name',
      header: t('bills.customer'),
      render: (b: IBill) => (
        <span
          className={
            b.customer_name ? 'text-slate-900' : 'text-slate-400 italic'
          }
        >
          {b.customer_name || t('bills.noCustomer')}
        </span>
      ),
    },
    {
      id: 'item_count',
      header: t('bills.items'),
      render: (b: IBill) => (
        <span className="text-slate-600">{b.item_count ?? 0}</span>
      ),
    },
    {
      id: 'total',
      header: t('bills.total'),
      render: (b: IBill) => (
        <span className="font-semibold text-slate-900">{fmt(b.total)}</span>
      ),
    },
    {
      id: 'created_at',
      header: t('bills.date'),
      render: (b: IBill) => (
        <span className="text-sm text-slate-500">
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
          color="blue"
        />
        <StatCard
          label={t('pos.todayRevenue')}
          value={fmt(stats.revenue)}
          icon={BanknotesIcon}
          color="green"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="md" />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState
            icon={<DocumentTextIcon className="w-12 h-12" />}
            title={t('bills.empty')}
            description={t('bills.emptyDesc')}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={bills}
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
                <Button
                  variant="danger"
                  icon={TrashIcon}
                  busy={deletingBill}
                  onClick={handleDeleteBill}
                >
                  {t('common.delete')}
                </Button>
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
          <div className="space-y-4">
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 pb-3 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-slate-400" />
                {selected.customer_name || t('bills.noCustomer')}
              </span>
              <span className="text-slate-400">
                {formatDate(selected.created_at)}
              </span>
            </div>

            {/* Items table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-start pb-2 font-medium">
                    {t('bills.detail.name')}
                  </th>
                  <th className="text-center pb-2 font-medium w-16">
                    {t('bills.detail.qty')}
                  </th>
                  <th className="text-end pb-2 font-medium w-24">
                    {t('bills.detail.price')}
                  </th>
                  <th className="text-end pb-2 font-medium w-24">
                    {t('bills.detail.total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(selected.items ?? []).map((item: IBillItem) => (
                  <tr key={item.id}>
                    <td className="py-2 text-slate-900 font-medium">
                      {item.name}
                    </td>
                    <td className="py-2 text-center text-slate-600">
                      {fmtQty(item.quantity)}
                      {item.unit ? ` ${item.unit}` : ''}
                    </td>
                    <td className="py-2 text-end text-slate-600">
                      {fmt(item.price)}
                    </td>
                    <td className="py-2 text-end font-semibold text-slate-900">
                      {fmt(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>{t('bills.detail.subtotal')}</span>
                <span>{fmt(selected.subtotal)}</span>
              </div>
              {selected.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('pos.discount')}</span>
                  <span>- {fmt(selected.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>{t('pos.total')}</span>
                <span className="text-blue-700">{fmt(selected.total)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppLayout>
  );
}
