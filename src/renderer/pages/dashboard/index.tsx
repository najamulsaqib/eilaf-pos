import EmptyState from '@components/common/EmptyState';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import IconButton from '@components/ui/IconButton';
import {
  ArrowTrendingUpIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/20/solid';
import {
  CubeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useProductsCatalog } from '@hooks/useProductsCatalog';
import CartPanel from '@pages/dashboard/components/CartPanel';
import CustomItemModal from '@pages/dashboard/components/CustomItemModal';
import PricingOptionModal from '@pages/dashboard/components/PricingOptionModal';
import ProductPagination from '@pages/dashboard/components/ProductPagination';
import ProductTile from '@pages/dashboard/components/ProductTile';
import ReceiptModal from '@pages/dashboard/components/ReceiptModal';
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
  const {
    products,
    total,
    allCategories,
    loading: productsLoading,
    loadKey,
    page,
    pageSize,
    totalPages,
    setPage,
    search,
    setSearch,
    category: activeCategory,
    setCategory: setActiveCategory,
    orderBy,
    setOrderBy,
  } = useProductsCatalog();

  // Cart state
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState('');

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

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const cartTotal = subtotal - discountAmt;

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

  const handleCreateBill = (bill: IBill, cartSnapshot: ICartItem[]) => {
    setReceiptCart(cartSnapshot);
    setReceipt(bill);
  };

  return (
    <AppLayout fullscreen>
      <div className="flex h-full">
        {/* ── Left: Products ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + sort */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-3">
            <div className="relative flex-1">
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
            <button
              type="button"
              onClick={() =>
                setOrderBy(
                  orderBy === 'top_selling' ? 'default' : 'top_selling',
                )
              }
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-edge bg-surface text-xs font-semibold text-ink-dim hover:bg-surface-muted transition-colors cursor-pointer"
            >
              {orderBy === 'top_selling' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-primary-500" />
              ) : (
                <Bars3BottomLeftIcon className="w-4 h-4 text-ink-ghost" />
              )}
              {orderBy === 'top_selling'
                ? t('pos.topSelling')
                : t('pos.sortAZ')}
            </button>
          </div>

          {/* Category pills */}
          <div className="shrink-0 flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto">
            {(['', ...allCategories] as string[]).map((cat) => (
              <button
                key={cat || '__all__'}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-muted text-ink-faint hover:bg-edge hover:text-ink-dim'
                }`}
              >
                {cat || t('pos.allCategories')}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading && products.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div
                key={loadKey}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {/* Custom item tile */}
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-edge rounded-xl p-2.5 text-ink-ghost hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all cursor-pointer min-h-28 animate-in fade-in duration-300"
                >
                  <PlusCircleIcon className="w-7 h-7" />
                  <p className="text-xs font-semibold">{t('pos.customItem')}</p>
                </button>

                {products.map((p, idx) => (
                  <ProductTile
                    key={p.id}
                    product={p}
                    onAdd={addProduct}
                    formatCurrency={fmt}
                    style={{
                      animation: `slideUpFade 500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 10}ms both`,
                    }}
                  />
                ))}

                {products.length === 0 && (
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

          {/* Pagination bar */}
          {totalPages > 1 && (
            <ProductPagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPrevious={() => setPage(page - 1)}
              onNext={() => setPage(page + 1)}
            />
          )}
        </div>

        <CartPanel
          cart={cart}
          customerName={customerName}
          discount={discount}
          subtotal={subtotal}
          discountAmt={discountAmt}
          total={cartTotal}
          onCustomerNameChange={setCustomerName}
          onDiscountChange={setDiscount}
          onClearCart={clearCart}
          onChangeQty={changeQty}
          onSetItemQty={setItemQty}
          onRemoveItem={removeItem}
          onBillCreated={handleCreateBill}
        />
      </div>

      {/* Custom Item Modal */}
      <CustomItemModal
        isOpen={customOpen}
        customName={customName}
        customPrice={customPrice}
        onCustomNameChange={setCustomName}
        onCustomPriceChange={setCustomPrice}
        onClose={() => setCustomOpen(false)}
        onAdd={addCustomItem}
      />

      <PricingOptionModal
        isOpen={!!pricingPickerProduct}
        product={pricingPickerProduct}
        selectedPricingId={selectedPricingId}
        selectedPricingQty={selectedPricingQty}
        pricingOptions={pricingSelectOptions}
        selectedPricingOption={selectedPricingOption}
        onPricingIdChange={setSelectedPricingId}
        onPricingQtyChange={setSelectedPricingQty}
        onClose={() => setPricingPickerProduct(null)}
        onConfirm={confirmPricingSelection}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receipt}
        receipt={receipt}
        receiptCart={receiptCart}
        onClose={() => setReceipt(null)}
        formatCurrency={fmt}
      />
    </AppLayout>
  );
}
