import { CSSProperties } from 'react';

type ProductTileProps = {
  product: IProduct;
  onAdd: (product: IProduct) => void;
  formatCurrency: (value: number) => string;
  style?: CSSProperties;
};

function pricingOptionsFor(product: IProduct): IProductPricingOption[] {
  if (product.pricing_options && product.pricing_options.length > 0) {
    return product.pricing_options;
  }

  return [
    {
      id: 0,
      product_id: product.id,
      unit: 'piece',
      price: product.price,
      allows_decimal: 0,
      is_default: 1,
      sort_order: 0,
    },
  ];
}

export default function ProductTile({
  product,
  onAdd,
  formatCurrency,
  style,
}: ProductTileProps) {
  const options = pricingOptionsFor(product);
  const defaultOption =
    options.find((option) => option.is_default === 1) ?? options[0];

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      style={style}
      className="group flex cursor-pointer flex-col rounded-xl border border-edge bg-surface p-2.5 text-start transition-all hover:border-primary-500"
    >
      <p className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-ink">
        {product.name}
      </p>
      {product.category && (
        <p className="mt-1 truncate text-xs text-ink-faint">
          {product.category}
        </p>
      )}
      <div className="mt-2 border-t border-edge-muted pt-1.5">
        <p className="text-xs font-bold text-primary-700">
          {formatCurrency(defaultOption.price)}
          <span className="ms-1 text-xs font-normal text-ink-faint">
            / {defaultOption.unit}
          </span>
        </p>
      </div>
    </button>
  );
}
