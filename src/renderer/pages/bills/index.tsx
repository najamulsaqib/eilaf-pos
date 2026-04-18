import LoadingSpinner from '@components/common/LoadingSpinner';
import StatCard from '@components/common/StatCard';
import AppLayout from '@components/layout/AppLayout';
import DataTable from '@components/table/DataTable';
import Pagination from '@components/table/Pagination';
import { BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useBills } from '@hooks/useBills';
import ReceiptModal from '@pages/dashboard/components/ReceiptModal';
import { billsApi } from '@services/db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
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
      <h1 className="text-xl font-bold text-ink mb-4">{t('nav.bills')}</h1>
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
      <ReceiptModal
        isOpen={!!selected}
        receipt={selected}
        receiptCart={[]}
        loading={loadingDetail}
        onClose={() => setSelected(null)}
        formatCurrency={fmt}
        onDelete={isDev ? handleDeleteBill : undefined}
      />
    </AppLayout>
  );
}
