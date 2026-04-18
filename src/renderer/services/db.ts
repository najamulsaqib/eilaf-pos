const { db } = window.electron;

export const productsApi = {
  list: () => db.products.list() as Promise<IProduct[]>,

  catalog: (opts?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    orderBy?: 'default' | 'top_selling';
  }) =>
    db.products.catalog(opts) as Promise<{
      products: IProduct[];
      total: number;
      allCategories: string[];
    }>,

  create: (data: ICreateProductData) =>
    db.products.create(data) as Promise<IProduct>,

  update: (id: number, data: IUpdateProductData) =>
    db.products.update(id, data) as Promise<IProduct>,

  delete: (id: number) => db.products.delete(id),

  barcodeBulk: (opts?: { search?: string; category?: string }) =>
    window.electron.products.barcodeBulk(opts) as Promise<IBarcodeBulkItem[]>,
};

export const billsApi = {
  list: (opts?: { page?: number; pageSize?: number }) =>
    db.bills.list(opts) as Promise<{ bills: IBill[]; total: number }>,

  get: (id: number) => db.bills.get(id) as Promise<IBill | null>,

  create: (data: ICreateBillData) => db.bills.create(data) as Promise<IBill>,

  todayStats: () => db.bills.todayStats() as Promise<ITodayStats>,

  delete: (id: number) => db.bills.delete(id) as Promise<{ ok: boolean }>,
};

export const printApi = {
  bill: (billId: number) =>
    window.electron.print.bill(billId) as Promise<{ ok: boolean }>,
  productBarcodes: (items: IBarcodePrintItemInput[]) =>
    window.electron.print.productBarcodes(items) as Promise<{
      ok: boolean;
      count: number;
    }>,
  report: (input?: IReportSummaryInput) =>
    window.electron.print.report(input) as Promise<{ ok: boolean }>,
};

export const reportsApi = {
  summary: (input?: IReportSummaryInput) =>
    window.electron.reports.summary(input) as Promise<IReportSummary>,
};

export const settingsApi = {
  getAll: () =>
    window.electron.settings.getAll() as Promise<Partial<ISettings>>,
  set: (updates: Partial<ISettings>) =>
    window.electron.settings.set(updates as Record<string, string>) as Promise<{
      ok: boolean;
    }>,
};
