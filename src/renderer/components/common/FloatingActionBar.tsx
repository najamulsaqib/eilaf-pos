import IconButton from '@components/ui/IconButton';
import {
  CheckCircleIcon,
  PrinterIcon,
  XMarkIcon,
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
          <IconButton
            icon={CheckCircleIcon}
            onClick={onSelectAllBarcoded}
            size="sm"
            title={t('products.selectAllBarcoded')}
          />
          <IconButton
            icon={PrinterIcon}
            onClick={onPrint}
            disabled={printableCount === 0 || printing}
            title={t('products.printBarcodes')}
            size="sm"
            variant="danger"
            busy={printing}
          />
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
