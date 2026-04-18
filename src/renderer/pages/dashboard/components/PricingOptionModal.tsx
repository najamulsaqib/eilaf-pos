import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import { useTranslation } from 'react-i18next';

type PricingOptionModalProps = {
  isOpen: boolean;
  product: IProduct | null;
  selectedPricingId: string;
  selectedPricingQty: string;
  pricingOptions: Array<{ value: string; label: string }>;
  selectedPricingOption: IProductPricingOption | undefined;
  onPricingIdChange: (value: string) => void;
  onPricingQtyChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PricingOptionModal({
  isOpen,
  product,
  selectedPricingId,
  selectedPricingQty,
  pricingOptions,
  selectedPricingOption,
  onPricingIdChange,
  onPricingQtyChange,
  onClose,
  onConfirm,
}: PricingOptionModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos.choosePricingOption')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!selectedPricingId || !selectedPricingQty}
          >
            {t('pos.addToBill')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {product && (
          <div className="pb-3 border-b border-edge-muted">
            <p className="text-sm text-ink-faint">{t('products.name')}</p>
            <p className="text-base font-semibold text-ink">{product.name}</p>
          </div>
        )}

        <SelectField
          id="pricing-option"
          label={t('products.pricingOptions')}
          value={selectedPricingId}
          onChange={onPricingIdChange}
          options={pricingOptions}
          placeholder={t('pos.choosePricingOption')}
        />

        <TextField
          id="pricing-qty"
          label={t('pos.quantity')}
          type="number"
          min={selectedPricingOption?.allows_decimal === 1 ? '0.01' : '1'}
          step={selectedPricingOption?.allows_decimal === 1 ? '0.25' : '1'}
          value={selectedPricingQty}
          onChange={(e) => onPricingQtyChange(e.target.value)}
        />
      </div>
    </Modal>
  );
}
