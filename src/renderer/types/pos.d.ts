interface IProductPricingOption {
  id: number;
  product_id: number;
  unit: string;
  price: number;
  allows_decimal: number;
  is_default: number;
  sort_order: number;
}

interface IProduct {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  category: string | null;
  is_active: number;
  created_at: string;
  pricing_options: IProductPricingOption[];
}

interface IBillItem {
  id: number;
  bill_id: number;
  product_id: number | null;
  name: string;
  unit: string | null;
  price: number;
  quantity: number;
  total: number;
}

interface IBill {
  id: number;
  bill_number: string;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  item_count?: number;
  items?: IBillItem[];
}

interface ICartItem {
  product_id?: number;
  name: string;
  unit?: string;
  allows_decimal?: boolean;
  price: number;
  quantity: number;
}

interface ITodayStats {
  count: number;
  revenue: number;
}

interface ICreateProductData {
  name: string;
  barcode?: string;
  category?: string;
  pricing_options: Array<{
    unit: string;
    price: number;
    allows_decimal?: boolean;
    is_default?: boolean;
  }>;
}

interface IUpdateProductData {
  name?: string;
  barcode?: string;
  category?: string;
  pricing_options?: Array<{
    unit: string;
    price: number;
    allows_decimal?: boolean;
    is_default?: boolean;
  }>;
}

interface ICreateBillData {
  customer_name?: string;
  items: ICartItem[];
  discount?: number;
  notes?: string;
}

interface IBarcodeBulkItem {
  id: number;
  name: string;
  barcode: string;
  price: number;
}

interface IBarcodePrintItemInput {
  productId: number;
  name: string;
  barcode: string;
  unit?: string;
  price?: number;
  copies?: number;
}

interface ISettings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_tagline: string;
  receipt_show_business: string;
  receipt_footer: string;
  sidebar_style: string; // 'slim' | 'full'
}

interface IReportSummaryInput {
  from?: string;
  to?: string;
}

interface IReportSummary {
  from: string;
  to: string;
  totals: {
    bills_count: number;
    subtotal: number;
    discount: number;
    revenue: number;
  };
  topItems: Array<{
    name: string;
    qty: number;
    amount: number;
  }>;
  paymentsByDay: Array<{
    day: string;
    bills: number;
    amount: number;
  }>;
  salesByHour: Array<{
    hour: number;
    bills: number;
    amount: number;
  }>;
}
