import EmptyState from '@components/common/EmptyState';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import IconButton from '@components/ui/IconButton';
import Modal from '@components/ui/Modal';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import {
  CubeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PrinterIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useProducts } from '@hooks/useProducts';
import CartPanel from '@pages/dashboard/components/CartPanel';
import ProductTile from '@pages/dashboard/components/ProductTile';
import { billsApi, printApi } from '@services/db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
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
              <MagnifyingGlassIcon className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-ghost pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('pos.search')}
                className="w-full ps-9 pe-10 py-2 text-sm border border-edge bg-surface text-ink placeholder:text-ink-ghost rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && (
                <IconButton
                  icon={XMarkIcon}
                  size="sm"
                  variant="subtle"
                  title={t('common.close')}
                  className="absolute inset-e-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSearch('')}
                />
              )}
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
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                    : 'bg-surface-muted text-ink-faint hover:bg-edge hover:text-ink-dim'
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((p) => (
                  <ProductTile
                    key={p.id}
                    product={p}
                    onAdd={addProduct}
                    formatCurrency={fmt}
                  />
                ))}

                {/* Custom item tile */}
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-edge rounded-xl p-2.5 text-ink-ghost hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all cursor-pointer min-h-28"
                >
                  <PlusCircleIcon className="w-7 h-7" />
                  <p className="text-xs font-semibold">{t('pos.customItem')}</p>
                </button>

                {filtered.length === 0 && !search && (
                  <div className="col-span-full">
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

        <CartPanel
          cart={cart}
          customerName={customerName}
          discount={discount}
          subtotal={subtotal}
          discountAmt={discountAmt}
          total={total}
          creating={creating}
          onCustomerNameChange={setCustomerName}
          onDiscountChange={setDiscount}
          onClearCart={clearCart}
          onChangeQty={changeQty}
          onSetItemQty={setItemQty}
          onRemoveItem={removeItem}
          onCreateBill={handleCreateBill}
        />
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
            <div className="flex flex-wrap gap-4 text-sm text-ink-dim pb-3 border-b border-edge-muted">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-ink-ghost" />
                {receipt.customer_name || t('bills.noCustomer')}
              </span>
              <span className="text-ink-ghost">
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
                <tr className="border-b border-edge-muted text-ink-faint text-xs uppercase tracking-wide">
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
              <tbody className="divide-y divide-edge-muted">
                {receiptCart.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-ink font-medium">{item.name}</td>
                    <td className="py-2 text-center text-ink-dim">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-end text-ink-dim">
                      {fmt(item.price)}
                    </td>
                    <td className="py-2 text-end font-semibold text-ink">
                      {fmt(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-edge pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-faint">
                <span>{t('bills.detail.subtotal')}</span>
                <span>{fmt(receipt.subtotal)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{t('pos.discount')}</span>
                  <span>- {fmt(receipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-ink pt-1 border-t border-edge-muted">
                <span>{t('pos.total')}</span>
                <span className="text-primary-700 dark:text-primary-400">
                  {fmt(receipt.total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
