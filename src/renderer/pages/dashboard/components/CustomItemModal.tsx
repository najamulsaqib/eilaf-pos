import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import TextField from '@components/ui/TextField';
import { useTranslation } from 'react-i18next';

type CustomItemModalProps = {
  isOpen: boolean;
  customName: string;
  customPrice: string;
  onCustomNameChange: (value: string) => void;
  onCustomPriceChange: (value: string) => void;
  onClose: () => void;
  onAdd: () => void;
};

export default function CustomItemModal({
  isOpen,
  customName,
  customPrice,
  onCustomNameChange,
  onCustomPriceChange,
  onClose,
  onAdd,
}: CustomItemModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos.customItem')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={onAdd}
            disabled={!customName.trim() || !customPrice}
          >
            {t('pos.addToBill')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextField
          id="custom-name"
          label={t('pos.customItemName')}
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          placeholder={t('pos.customItemNamePlaceholder')}
        />
        <TextField
          id="custom-price"
          label={t('pos.customItemPrice')}
          type="number"
          min="0"
          value={customPrice}
          onChange={(e) => onCustomPriceChange(e.target.value)}
          placeholder="0"
          prefix="Rs"
        />
      </div>
    </Modal>
  );
}
