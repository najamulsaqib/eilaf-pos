import FloatingActionBar from '@components/common/FloatingActionBar';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import DataTable from '@components/table/DataTable';
import Button from '@components/ui/Button';
import CheckboxField from '@components/ui/CheckboxField';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import IconButton from '@components/ui/IconButton';
import Modal from '@components/ui/Modal';
import TextField from '@components/ui/TextField';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useProducts } from '@hooks/useProducts';
import { printApi } from '@services/db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface IOptionForm {
  unit: string;
  price: string;
  allowsDecimal: boolean;
  isDefault: boolean;
}

interface IProductForm {
  name: string;
  barcode: string;
  category: string;
  pricingOptions: IOptionForm[];
}

const emptyOption: IOptionForm = {
  unit: 'piece',
  price: '',
  allowsDecimal: false,
  isDefault: true,
};

const emptyForm: IProductForm = {
  name: '',
  barcode: '',
  category: '',
  pricingOptions: [emptyOption],
};

export default function IProductsPage() {
  const { t } = useTranslation();
  const { products, loading, createProduct, updateProduct, deleteProduct } =
    useProducts();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IProduct | null>(null);
  const [form, setForm] = useState<IProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [printingLabels, setPrintingLabels] = useState(false);
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (p: IProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      barcode: p.barcode ?? '',
      category: p.category ?? '',
      pricingOptions:
        p.pricing_options.length > 0
          ? p.pricing_options.map((opt) => ({
              unit: opt.unit,
              price: String(opt.price),
              allowsDecimal: opt.allows_decimal === 1,
              isDefault: opt.is_default === 1,
            }))
          : [{ ...emptyOption, price: String(p.price) }],
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const options = form.pricingOptions
      .map((opt) => ({
        unit: opt.unit.trim(),
        price: parseFloat(opt.price),
        allows_decimal: opt.allowsDecimal,
        is_default: opt.isDefault,
      }))
      .filter(
        (opt) => opt.unit && Number.isFinite(opt.price) && opt.price >= 0,
      );

    if (!form.name.trim() || options.length === 0) return;

    if (!options.some((opt) => opt.is_default)) {
      options[0].is_default = true;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        barcode: form.barcode.trim() || undefined,
        category: form.category.trim() || undefined,
        pricing_options: options,
      };
      if (editing) {
        await updateProduct(editing.id, data);
        toast.success(t('products.updated'));
      } else {
        await createProduct(data);
        toast.success(t('products.created'));
      }
      setFormOpen(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(t('products.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const generateBarcode = () => {
    const prefix = '8963';
    const random = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 10),
    ).join('');
    const partial = prefix + random;
    const sum = partial
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d, 10) * (i % 2 === 0 ? 1 : 3), 0);
    const check = (10 - (sum % 10)) % 10;
    setForm((f) => ({ ...f, barcode: partial + check }));
  };

  const field = (key: 'name' | 'barcode' | 'category') => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setForm((f) => ({ ...f, [key]: value }));
    },
  });

  const updateOption = (index: number, patch: Partial<IOptionForm>) => {
    setForm((prev) => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map((opt, idx) =>
        idx === index ? { ...opt, ...patch } : opt,
      ),
    }));
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.barcode ?? '').includes(search) ||
          (p.category ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  const selectedPrintable = products.filter(
    (p) => selectedIds.includes(p.id) && p.barcode,
  );

  const barcodedInView = filtered.filter((p) => Boolean(p.barcode));
  const allBarcodedSelected =
    barcodedInView.length > 0 &&
    barcodedInView.every((p) => selectedIds.includes(p.id));

  const selectAllWithBarcodes = () => {
    setSelectedIds(barcodedInView.map((p) => p.id));
  };

  const toggleSelectAll = () => {
    if (allBarcodedSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !barcodedInView.some((p) => p.id === id)),
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...barcodedInView.filter((p) => !prev.includes(p.id)).map((p) => p.id),
      ]);
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handlePrintSelectedBarcodes = async () => {
    if (selectedPrintable.length === 0) return;
    setPrintingLabels(true);
    try {
      await printApi.productBarcodes(
        selectedPrintable.map((p) => ({
          productId: p.id,
          name: p.name,
          barcode: p.barcode ?? '',
          price: p.price,
          copies: 1,
        })),
      );
      toast.success(t('products.barcodePrinted'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPrintingLabels(false);
    }
  };

  const setDefaultOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map((opt, idx) => ({
        ...opt,
        isDefault: idx === index,
      })),
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      pricingOptions: [
        ...prev.pricingOptions,
        {
          unit: '',
          price: '',
          allowsDecimal: false,
          isDefault: prev.pricingOptions.length === 0,
        },
      ],
    }));
  };

  const removeOption = (index: number) => {
    setForm((prev) => {
      if (prev.pricingOptions.length <= 1) {
        return prev;
      }

      const next = prev.pricingOptions.filter((_, idx) => idx !== index);
      if (!next.some((opt) => opt.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }

      return { ...prev, pricingOptions: next };
    });
  };

  const columns = [
    {
      id: 'checkbox',
      header: (
        <CheckboxField
          id="product-select-all"
          label=" "
          checked={allBarcodedSelected}
          disabled={barcodedInView.length === 0}
          onChange={toggleSelectAll}
          className="justify-center"
        />
      ),
      render: (p: IProduct) => (
        <CheckboxField
          id={`product-select-${p.id}`}
          label=" "
          checked={selectedIds.includes(p.id)}
          disabled={!p.barcode}
          onChange={() => toggleSelected(p.id)}
          className="justify-center"
        />
      ),
    },
    {
      id: 'name',
      header: t('products.name'),
      render: (p: IProduct) => (
        <span className="font-medium text-slate-900">{p.name}</span>
      ),
    },
    {
      id: 'barcode',
      header: t('products.barcode'),
      render: (p: IProduct) => (
        <span className="font-mono text-xs text-slate-600">
          {p.barcode ?? t('products.noBarcode')}
        </span>
      ),
    },
    {
      id: 'price',
      header: t('products.price'),
      render: (p: IProduct) => (
        <div className="flex flex-col">
          {p.pricing_options.map((opt) => (
            <span key={opt.id} className="font-semibold text-blue-700 text-xs">
              Rs {opt.price.toLocaleString()} / {opt.unit}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'category',
      header: t('products.category'),
      render: (p: IProduct) => (
        <span className="text-slate-500">{p.category ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      render: (p: IProduct) => (
        <div className="flex items-center gap-1 justify-end">
          <IconButton
            icon={<PencilIcon className="w-4 h-4" />}
            title={t('common.edit')}
            onClick={() => openEdit(p)}
            size="sm"
          />
          <IconButton
            icon={<TrashIcon className="w-4 h-4" />}
            title={t('common.delete')}
            variant="danger"
            onClick={() => setDeleteTarget(p)}
            size="sm"
          />
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {t('products.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} {t('products.total')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="text-sm text-slate-800 bg-transparent focus:outline-none w-44 placeholder:text-slate-400"
            />
          </div>
          <Button icon={PlusIcon} onClick={openAdd}>
            {t('products.add')}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered || []}
            getRowId={(p) => p.id}
            onRowClick={openEdit}
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('products.edit') : t('products.add')}
        size="sm"
        maxHeight="max-h-[80vh]"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFormOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              busy={saving}
              onClick={handleSave}
              disabled={!form.name.trim()}
            >
              {t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextField
            id="p-name"
            label={t('products.name')}
            required
            {...field('name')}
          />

          <TextField
            id="p-barcode"
            label={t('products.barcode')}
            placeholder={t('products.barcodePlaceholder')}
            readOnly={Boolean(editing?.barcode)}
            suffix={
              editing?.barcode ? (
                <LockClosedIcon className="w-4 h-4 text-slate-400" />
              ) : (
                <IconButton
                  icon={<ArrowPathIcon className="w-4 h-4" />}
                  title={t('products.generateBarcode')}
                  size="sm"
                  variant="subtle"
                  onClick={generateBarcode}
                />
              )
            }
            {...field('barcode')}
          />

          {editing?.barcode && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {t('products.barcodeLocked')}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {t('products.pricingOptions')}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={PlusCircleIcon}
                onClick={addOption}
              >
                {t('products.addPricingOption')}
              </Button>
            </div>

            {form.pricingOptions.map((option, idx) => (
              <div
                key={`opt-${idx}`}
                className="rounded-lg border border-slate-200 p-3 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    id={`p-option-unit-${idx}`}
                    label={t('products.unit')}
                    placeholder={t('products.unitPlaceholder')}
                    value={option.unit}
                    onChange={(e) =>
                      updateOption(idx, { unit: e.target.value })
                    }
                  />
                  <TextField
                    id={`p-option-price-${idx}`}
                    label={t('products.price')}
                    type="number"
                    min="0"
                    prefix="Rs"
                    value={option.price}
                    onChange={(e) =>
                      updateOption(idx, { price: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="grid grid-cols-1 gap-1">
                    <CheckboxField
                      id={`p-option-decimal-${idx}`}
                      label={t('products.allowDecimalQty')}
                      checked={option.allowsDecimal}
                      onChange={(e) =>
                        updateOption(idx, { allowsDecimal: e.target.checked })
                      }
                    />
                    <CheckboxField
                      id={`p-option-default-${idx}`}
                      label={t('products.defaultPricingOption')}
                      checked={option.isDefault}
                      onChange={() => setDefaultOption(idx)}
                    />
                  </div>

                  <IconButton
                    icon={<TrashIcon className="w-4 h-4" />}
                    title={t('products.removePricingOption')}
                    variant="danger"
                    disabled={form.pricingOptions.length <= 1}
                    onClick={() => removeOption(idx)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <TextField
            id="p-category"
            label={t('products.category')}
            placeholder={t('products.categoryPlaceholder')}
            {...field('category')}
          />
        </div>
      </Modal>

      <FloatingActionBar
        selectedCount={selectedIds.length}
        printableCount={selectedPrintable.length}
        printing={printingLabels}
        onSelectAllBarcoded={selectAllWithBarcodes}
        onClearSelection={clearSelection}
        onPrint={handlePrintSelectedBarcodes}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('products.deleteTitle')}
        message={t('products.deleteConfirm', { name: deleteTarget?.name })}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
