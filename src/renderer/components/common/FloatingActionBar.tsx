import {
  XMarkIcon,
  PrinterIcon,
  CheckCircleIcon,
} from '@heroicons/react/20/solid';
import { useTranslation } from 'react-i18next';

interface FloatingActionBarProps {
  selectedCount: number;
  printableCount: number;
  printing?: boolean;
  onSelectAllBarcoded: () => void;
  onClearSelection: () => void;
  onPrint: () => void;
}

export default function FloatingActionBar({
  selectedCount,
  printableCount,
  printing = false,
  onSelectAllBarcoded,
  onClearSelection,
  onPrint,
}: FloatingActionBarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-s-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-stretch gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 whitespace-nowrap">
        {/* Count */}
        <div className="flex items-center gap-1.5 pe-3 border-e border-slate-700 text-sm">
          <span className="font-semibold">{selectedCount}</span>
          <span className="text-slate-400">{t('products.selected')}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSelectAllBarcoded}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {t('products.selectAllBarcoded')}
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={printableCount === 0 || printing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <PrinterIcon className="w-4 h-4" />
            {t('products.printBarcodes')} ({printableCount})
          </button>
        </div>

        {/* Clear */}
        <div className="flex items-center ps-3 border-s border-slate-700">
          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title={t('products.clearSelection')}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
