import { useTranslation } from 'react-i18next';
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/20/solid';
import SelectField from '@components/ui/SelectField';
import { useLocale } from '@contexts/LocaleContext';

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100, 250, 500];

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-edge bg-surface">
      {/* Left: summary and page size */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-ink-dim">
          {total === 0
            ? t('table.noRecords')
            : `${from}–${to} ${t('common.of')} ${total.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-2 border-l border-edge pl-4">
          <span className="text-ink-dim">{t('table.rowsPerPage')}</span>
          <SelectField
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={PAGE_SIZE_OPTIONS.map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            size="sm"
            className="shrink-0 w-22"
          />
        </div>
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="text-ink-ghost hover:text-ink-dim cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={t('table.firstPage')}
          title={t('table.firstPage')}
        >
          {isRTL ? (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          ) : (
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="text-primary-600 hover:text-primary-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          aria-label={t('table.previous')}
        >
          {t('table.previous')}
        </button>

        <div className="flex items-center gap-1 mx-2">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={page + 1}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val >= 1 && val <= totalPages) {
                onPageChange(val - 1);
              }
            }}
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'textfield',
              appearance: 'textfield',
            }}
            className="w-16 h-7 border border-edge-strong bg-surface rounded px-2 text-center text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
          />
          <span className="text-sm text-ink-dim font-medium">
            {t('common.of')} {totalPages}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="text-primary-600 hover:text-primary-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          aria-label={t('table.next')}
        >
          {t('table.next')}
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="text-ink-ghost hover:text-ink-dim cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={t('table.lastPage')}
          title={t('table.lastPage')}
        >
          {isRTL ? (
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          ) : (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
