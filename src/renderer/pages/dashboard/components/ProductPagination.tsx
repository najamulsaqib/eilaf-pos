import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

type ProductPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function ProductPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPrevious,
  onNext,
}: ProductPaginationProps) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-edge bg-surface text-sm">
      <span className="text-ink-dim">
        {total === 0
          ? ''
          : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} ${t('common.of')} ${total.toLocaleString()}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={onPrevious}
          className="p-1 rounded text-ink-ghost hover:text-ink-dim disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-ink-dim font-medium">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={onNext}
          className="p-1 rounded text-ink-ghost hover:text-ink-dim disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
