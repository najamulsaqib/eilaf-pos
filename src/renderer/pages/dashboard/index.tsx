import EmptyState from '@components/common/EmptyState';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid';
import {
  CubeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PrinterIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useProducts } from '@hooks/useProducts';
import { billsApi, printApi } from '@services/db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

function fmtQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/\.?0+$/, '');
}

function pricingOptionsFor(p: IProduct): IProductPricingOption[] {
  if (p.pricing_options && p.pricing_options.length > 0) {
    return p.pricing_options;
  }
  return [
    {
      id: 0,
      product_id: p.id,
      unit: 'piece',
      price: p.price,
      allows_decimal: 0,
      is_default: 1,
      sort_order: 0,
    },
  ];
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { products, loading: productsLoading } = useProducts();

  // Cart state
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState('');
  const [creating, setCreating] = useState(false);

  // Product browsing
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  // Custom item modal
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Multi-pricing add modal
  const [pricingPickerProduct, setPricingPickerProduct] =
    useState<IProduct | null>(null);
  const [selectedPricingId, setSelectedPricingId] = useState('');
  const [selectedPricingQty, setSelectedPricingQty] = useState('1');

  // Receipt modal
  const [receipt, setReceipt] = useState<IBill | null>(null);
  const [receiptCart, setReceiptCart] = useState<ICartItem[]>([]);
  const [printing, setPrinting] = useState(false);

  // Derived
  const categories = [
    '',
    ...(Array.from(
      new Set(products.map((p) => p.category).filter(Boolean)),
    ) as string[]),
  ];

  const filtered = products.filter((p) => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const total = subtotal - discountAmt;

  // Cart operations
  const addProductWithPricing = (
    p: IProduct,
    pricing: IProductPricingOption,
    quantity: number,
  ) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.product_id === p.id &&
          i.unit === pricing.unit &&
          i.price === pricing.price,
      );
      if (idx >= 0) {
        return prev.map((i, n) =>
          n === idx ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name,
          unit: pricing.unit,
          allows_decimal: pricing.allows_decimal === 1,
          price: pricing.price,
          quantity,
        },
      ];
    });
  };

  const addProduct = (p: IProduct) => {
    const options = pricingOptionsFor(p);
    if (options.length === 1) {
      addProductWithPricing(p, options[0], 1);
      return;
    }

    const defaultOpt =
      options.find((opt) => opt.is_default === 1) ?? options[0];
    setPricingPickerProduct(p);
    setSelectedPricingId(String(defaultOpt.id));
    setSelectedPricingQty('1');
  };

  const changeQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const step = prev[idx]?.allows_decimal ? 0.25 : 1;
      const next = prev.map((i, n) =>
        n === idx ? { ...i, quantity: i.quantity + delta * step } : i,
      );
      return next.filter((i) => i.quantity > 0);
    });
  };

  const setItemQty = (idx: number, value: string) => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) return;

    setCart((prev) => {
      const next = [...prev];
      const item = next[idx];
      if (!item) return prev;
      const qty = item.allows_decimal ? parsed : Math.round(parsed);
      if (qty <= 0) {
        return prev.filter((_, n) => n !== idx);
      }
      next[idx] = { ...item, quantity: qty };
      return next;
    });
  };

  const removeItem = (idx: number) =>
    setCart((prev) => prev.filter((_, n) => n !== idx));

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setDiscount('');
  };

  const addCustomItem = () => {
    const price = parseFloat(customPrice);
    if (!customName.trim() || !price || price <= 0) return;
    setCart((prev) => [
      ...prev,
      { name: customName.trim(), unit: 'piece', price, quantity: 1 },
    ]);
    setCustomName('');
    setCustomPrice('');
    setCustomOpen(false);
  };

  const confirmPricingSelection = () => {
    if (!pricingPickerProduct || !selectedPricingId) return;

    const options = pricingOptionsFor(pricingPickerProduct);
    const option = options.find((opt) => String(opt.id) === selectedPricingId);
    if (!option) return;

    const qty = parseFloat(selectedPricingQty || '0');
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error(t('pos.invalidQty'));
      return;
    }

    if (option.allows_decimal === 0 && !Number.isInteger(qty)) {
      toast.error(t('pos.invalidQty'));
      return;
    }

    addProductWithPricing(pricingPickerProduct, option, qty);
    setPricingPickerProduct(null);
    setSelectedPricingId('');
    setSelectedPricingQty('1');
  };

  const pricingSelectOptions = pricingPickerProduct
    ? pricingOptionsFor(pricingPickerProduct).map((opt) => ({
        value: String(opt.id),
        label: `${opt.unit} - Rs ${opt.price.toLocaleString()}`,
      }))
    : [];

  const selectedPricingOption = pricingPickerProduct
    ? pricingOptionsFor(pricingPickerProduct).find(
        (opt) => String(opt.id) === selectedPricingId,
      )
    : undefined;

  const handleCreateBill = async () => {
    if (cart.length === 0) return;
    setCreating(true);
    try {
      const snapshot = [...cart];
      const bill = await billsApi.create({
        customer_name: customerName.trim() || undefined,
        items: cart,
        discount: discountAmt || undefined,
      });
      clearCart();
      setReceiptCart(snapshot);
      setReceipt(bill);
      toast.success(t('pos.billCreated'));
    } catch {
      toast.error(t('pos.billError'));
    } finally {
      setCreating(false);
    }
  };

  const handlePrint = async () => {
    if (!receipt) return;
    setPrinting(true);
    try {
      await printApi.bill(receipt.id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <AppLayout fullscreen>
      <div className="flex h-full">
        {/* ── Left: Products ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar: search */}
          <div className="shrink-0 px-4 py-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('pos.search')}
                className="w-full ps-9 pe-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="shrink-0 flex gap-1.5 px-4 pb-2.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat || '__all__'}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                {cat || t('pos.allCategories')}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filtered.map((p) => {
                  const defaultOpt =
                    pricingOptionsFor(p).find((o) => o.is_default === 1) ??
                    pricingOptionsFor(p)[0];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="group flex flex-col bg-white border border-slate-200 rounded-2xl p-3.5 text-start hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all active:scale-95 cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-3 shrink-0 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                        <CubeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug flex-1">
                        {p.name}
                      </p>
                      {p.category && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {p.category}
                        </p>
                      )}
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-sm font-bold text-blue-700">
                          {fmt(defaultOpt.price)}
                          <span className="text-[10px] text-slate-400 font-normal ms-1">
                            / {defaultOpt.unit}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Custom item tile */}
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-3.5 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer min-h-32"
                >
                  <PlusCircleIcon className="w-7 h-7" />
                  <p className="text-xs font-semibold">{t('pos.customItem')}</p>
                </button>

                {filtered.length === 0 && !search && (
                  <div className="col-span-4">
                    <EmptyState
                      icon={<CubeIcon className="w-12 h-12" />}
                      title={t('pos.noProducts')}
                      description={t('products.emptyDesc')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart ── */}
        <div className="w-80 flex flex-col bg-white my-3 me-3 rounded-2xl shadow-xl shadow-slate-300/40">
          {/* Cart header */}
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  {t('pos.currentBill')}
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                  title={t('pos.clearCart')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <UserIcon className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('pos.customer')}
                className="w-full ps-9 pe-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-300 px-4 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">
                    {t('pos.emptyCart')}
                  </p>
                  <p className="text-xs mt-0.5 text-slate-300">
                    {t('pos.emptyCartDesc')}
                  </p>
                </div>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {fmt(item.price)}
                      {item.unit ? ` / ${item.unit}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => changeQty(idx, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <MinusIcon className="w-3 h-3 text-slate-600" />
                    </button>
                    <input
                      type="number"
                      min={item.allows_decimal ? '0.01' : '1'}
                      step={item.allows_decimal ? '0.25' : '1'}
                      value={fmtQty(item.quantity)}
                      onChange={(e) => setItemQty(idx, e.target.value)}
                      className="w-12 rounded-lg border border-slate-200 bg-white px-1 py-0.5 text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => changeQty(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <PlusIcon className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-900 w-16 text-end shrink-0">
                    {fmt(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="shrink-0 text-slate-200 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals + Actions */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-20 shrink-0">
                {t('pos.discount')}
              </span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-end bg-slate-50"
              />
            </div>

            {/* Totals summary */}
            <div className="bg-slate-50 rounded-xl px-3 py-2.5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{t('pos.subtotal')}</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>{t('pos.discount')}</span>
                  <span>- {fmt(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>{t('pos.total')}</span>
                <span className="text-blue-700 text-lg">{fmt(total)}</span>
              </div>
            </div>

            {/* Create Bill button */}
            <button
              type="button"
              disabled={cart.length === 0 || creating}
              onClick={handleCreateBill}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {creating ? '…' : t('pos.createBill')}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Item Modal */}
      <Modal
        isOpen={customOpen}
        onClose={() => setCustomOpen(false)}
        title={t('pos.customItem')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCustomOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={addCustomItem}
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
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={t('pos.customItemNamePlaceholder')}
          />
          <TextField
            id="custom-price"
            label={t('pos.customItemPrice')}
            type="number"
            min="0"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="0"
            prefix="Rs"
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!pricingPickerProduct}
        onClose={() => setPricingPickerProduct(null)}
        title={t('pos.choosePricingOption')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPricingPickerProduct(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={confirmPricingSelection}
              disabled={!selectedPricingId || !selectedPricingQty}
            >
              {t('pos.addToBill')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <SelectField
            id="pricing-option"
            label={t('products.pricingOptions')}
            value={selectedPricingId}
            onChange={setSelectedPricingId}
            options={pricingSelectOptions}
            placeholder={t('pos.choosePricingOption')}
          />

          <TextField
            id="pricing-qty"
            label={t('pos.quantity')}
            type="number"
            min={selectedPricingOption?.allows_decimal === 1 ? '0.01' : '1'}
            step={selectedPricingOption?.allows_decimal === 1 ? '0.25' : '1'}
            value={selectedPricingQty}
            onChange={(e) => setSelectedPricingQty(e.target.value)}
          />
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        title={
          receipt ? `${t('bills.detail.title')} — ${receipt.bill_number}` : ''
        }
        size="md"
        maxHeight="max-h-[85vh]"
        footer={
          <div className="flex justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReceipt(null)}
            >
              {t('common.close')}
            </Button>
            <Button
              size="sm"
              icon={PrinterIcon}
              busy={printing}
              onClick={handlePrint}
            >
              {t('bills.print')}
            </Button>
          </div>
        }
      >
        {receipt && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 pb-3 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-slate-400" />
                {receipt.customer_name || t('bills.noCustomer')}
              </span>
              <span className="text-slate-400">
                {new Date(receipt.created_at).toLocaleString('en-PK', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

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
                {receiptCart.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-900 font-medium">
                      {item.name}
                    </td>
                    <td className="py-2 text-center text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-end text-slate-600">
                      {fmt(item.price)}
                    </td>
                    <td className="py-2 text-end font-semibold text-slate-900">
                      {fmt(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>{t('bills.detail.subtotal')}</span>
                <span>{fmt(receipt.subtotal)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('pos.discount')}</span>
                  <span>- {fmt(receipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>{t('pos.total')}</span>
                <span className="text-blue-700">{fmt(receipt.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
