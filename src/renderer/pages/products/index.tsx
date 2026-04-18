import FloatingActionBar from '@components/common/FloatingActionBar';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import Pagination from '@components/table/Pagination';
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
  PrinterIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useProductsCatalog } from '@hooks/useProductsCatalog';
import { productsApi, printApi } from '@services/db';
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

// TODO: find some way to print full batch without limits!
// INFO: works fast till 441 limit, after that it doesn't print anything at all,
// not even an error. only loading spinner keeps spinning. This is likely due to
// thermal printer buffer overflow or something. Need to investigate more.
const PRINT_LIMIT = 400;

const emptyForm: IProductForm = {
  name: '',
  barcode: '',
  category: '',
  pricingOptions: [emptyOption],
};

export default function IProductsPage() {
  const { t } = useTranslation();
  const {
    products,
    total,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    search,
    setSearch,
    category,
    setCategory,
    allCategories,
    reload,
  } = useProductsCatalog({ orderBy: 'default', pageSize: 30 });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IProduct | null>(null);
  const [form, setForm] = useState<IProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Map<number, IBarcodePrintItemInput>
  >(new Map());
  const [printingLabels, setPrintingLabels] = useState(false);

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
        await productsApi.update(editing.id, data);
        toast.success(t('products.updated'));
      } else {
        await productsApi.create(data);
        toast.success(t('products.created'));
      }
      setFormOpen(false);
      reload();
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
      await productsApi.delete(deleteTarget.id);
      toast.success(t('products.deleted'));
      setDeleteTarget(null);
      reload();
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

  const toPrintItem = (p: IProduct): IBarcodePrintItemInput => ({
    productId: p.id,
    name: p.name,
    barcode: p.barcode ?? '',
    price: p.price,
    copies: 1,
  });

  const toggleSelected = (p: IProduct) => {
    if (!p.barcode) return;
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.set(p.id, toPrintItem(p));
      return next;
    });
  };

  const barcodedInView = products.filter((p) => Boolean(p.barcode));
  const allBarcodedSelected =
    barcodedInView.length > 0 &&
    barcodedInView.every((p) => selectedItems.has(p.id));

  const selectAllWithBarcodes = async () => {
    const all = await productsApi.barcodeBulk({ search, category });
    const capped = all.slice(0, PRINT_LIMIT);
    if (all.length > PRINT_LIMIT) {
      toast.info(t('products.selectionCapped', { limit: PRINT_LIMIT }));
    }
    setSelectedItems(
      new Map(
        capped.map((p) => [
          p.id,
          {
            productId: p.id,
            name: p.name,
            barcode: p.barcode,
            price: p.price,
            copies: 1,
          },
        ]),
      ),
    );
  };

  const toggleSelectAll = () => {
    if (allBarcodedSelected) {
      setSelectedItems((prev) => {
        const next = new Map(prev);
        barcodedInView.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedItems((prev) => {
        const next = new Map(prev);
        let count = next.size;
        for (const p of barcodedInView) {
          if (!p.barcode || next.has(p.id)) continue;
          if (count >= PRINT_LIMIT) {
            toast.info(t('products.selectionCapped', { limit: PRINT_LIMIT }));
            break;
          }
          next.set(p.id, toPrintItem(p));
          count++;
        }
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedItems(new Map());

  const selectedPrintable = Array.from(selectedItems.values());

  const handlePrintSelectedBarcodes = async () => {
    if (selectedPrintable.length === 0) return;
    if (selectedPrintable.length > PRINT_LIMIT) {
      toast.error(
        t('products.printLimitExceeded', {
          limit: PRINT_LIMIT,
          count: selectedPrintable.length,
        }),
      );
      return;
    }
    setPrintingLabels(true);
    try {
      await printApi.productBarcodes(selectedPrintable);
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
      if (prev.pricingOptions.length <= 1) return prev;
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
          checked={selectedItems.has(p.id)}
          disabled={!p.barcode}
          onChange={() => toggleSelected(p)}
          className="justify-center"
        />
      ),
    },
    {
      id: 'name',
      header: t('products.name'),
      render: (p: IProduct) => (
        <span className="font-medium text-ink">{p.name}</span>
      ),
    },
    {
      id: 'barcode',
      header: t('products.barcode'),
      render: (p: IProduct) => (
        <span className="font-mono text-xs text-ink-dim">
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
            <span
              key={opt.id}
              className="font-semibold text-primary-700 text-xs"
            >
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
        <span className="text-ink-faint">{p.category ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      render: (p: IProduct) => (
        <div className="flex items-center gap-1 justify-end">
          <IconButton
            icon={PencilIcon}
            title={t('common.edit')}
            onClick={() => openEdit(p)}
            size="sm"
          />
          <IconButton
            icon={TrashIcon}
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">{t('products.title')}</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            {total.toLocaleString()} {t('products.total')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface border border-edge rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-focus-ring focus-within:border-focus-ring">
            <MagnifyingGlassIcon className="w-4 h-4 text-ink-ghost shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="text-sm text-ink bg-transparent focus:outline-none w-44 placeholder:text-ink-ghost focus:w-64 transition-[width] duration-300"
            />
          </div>
          <Button
            icon={PrinterIcon}
            onClick={handlePrintSelectedBarcodes}
            disabled={selectedPrintable.length === 0 || printingLabels}
            busy={printingLabels}
          >
            {t('products.printBarcodes')} ({selectedPrintable.length})
          </Button>
          <Button icon={PlusIcon} onClick={openAdd}>
            {t('products.add')}
          </Button>
        </div>
      </div>

      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              category === ''
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-surface text-ink-dim border-edge hover:bg-surface-muted'
            }`}
          >
            {t('pos.allCategories')}
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface text-ink-dim border-edge hover:bg-surface-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-edge">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={products}
            getRowId={(p) => p.id}
            onRowClick={openEdit}
            footer={
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            }
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('products.edit') : t('products.add')}
        size="lg"
        maxHeight="max-h-[80vh]"
        bodyClassName="px-5 py-5 sm:px-6"
        footer={
          <div className="flex items-center justify-end gap-3">
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
        <div className="space-y-5">
          <section className="rounded-xl border border-edge bg-surface-raised p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="p-name"
                label={t('products.name')}
                placeholder={t('products.namePlaceholder')}
                required
                {...field('name')}
              />
              <TextField
                id="p-category"
                label={t('products.category')}
                placeholder={t('products.categoryPlaceholder')}
                {...field('category')}
              />
            </div>

            <div className="mt-4">
              <TextField
                id="p-barcode"
                label={t('products.barcode')}
                placeholder={t('products.barcodePlaceholder')}
                readOnly={Boolean(editing?.barcode)}
                suffix={
                  editing?.barcode ? (
                    <LockClosedIcon className="h-4 w-4 text-ink-ghost" />
                  ) : (
                    <IconButton
                      icon={ArrowPathIcon}
                      title={t('products.generateBarcode')}
                      size="sm"
                      variant="subtle"
                      onClick={generateBarcode}
                    />
                  )
                }
                {...field('barcode')}
              />
            </div>

            {editing?.barcode && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-edge bg-surface px-3 py-2.5">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <p className="text-xs text-ink-faint">
                  {t('products.barcodeLocked')}
                </p>
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-edge bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
              <p className="text-sm font-semibold text-ink">
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

            <div className="space-y-3">
              {form.pricingOptions.map((option, idx) => (
                <div
                  key={`opt-${idx}`}
                  className="rounded-xl border border-edge bg-surface-raised p-3 sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      {t('products.unit')} #{idx + 1}
                    </p>
                    <IconButton
                      icon={TrashIcon}
                      title={t('products.removePricingOption')}
                      variant="danger"
                      disabled={form.pricingOptions.length <= 1}
                      onClick={() => removeOption(idx)}
                      size="sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
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

                  <div className="mt-3 grid gap-1 rounded-lg border border-edge bg-surface p-2">
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
                </div>
              ))}
            </div>
          </section>
        </div>
      </Modal>

      <FloatingActionBar
        selectedCount={selectedItems.size}
        printableCount={selectedPrintable.length}
        printing={printingLabels}
        onSelectAllBarcoded={selectAllWithBarcodes}
        onClearSelection={clearSelection}
        onPrint={handlePrintSelectedBarcodes}
      />

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
