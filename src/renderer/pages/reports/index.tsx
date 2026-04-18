import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import {
  PrinterIcon,
  ChartBarIcon,
  TableCellsIcon,
  BanknotesIcon,
  DocumentTextIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import TabBar from '@components/ui/TabBar';
import LoadingSpinner from '@components/common/LoadingSpinner';
import StatCard from '@components/common/StatCard';
import { reportsApi, printApi } from '@services/db';

type Tab = 'charts' | 'report';

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

function localDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function today() {
  return localDate(new Date());
}

function firstOfMonth() {
  const d = new Date();
  return localDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

// Fill every day between from..to with amount, default 0
function fillDays(
  from: string,
  to: string,
  data: Array<{ day: string; bills: number; amount: number }>,
) {
  const result: { label: string; bills: number; amount: number }[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const key = localDate(cur);
    const found = data.find((d) => d.day === key);
    result.push({
      label: cur.toLocaleDateString('en-PK', {
        month: 'short',
        day: 'numeric',
      }),
      bills: found?.bills ?? 0,
      amount: found?.amount ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// Fill all 24 hours
function fillHours(
  data: Array<{ hour: number; bills: number; amount: number }>,
) {
  return Array.from({ length: 24 }, (_, i) => {
    const found = data.find((h) => h.hour === i);
    const ampm = i < 12 ? 'AM' : 'PM';
    const h = i % 12 || 12;
    return {
      label: `${h}${ampm}`,
      bills: found?.bills ?? 0,
      amount: found?.amount ?? 0,
    };
  });
}

// Helper to get CSS variable colors for dark mode support
function getChartColor(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

// Helper to detect if dark mode is enabled
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [activeTab, setActiveTab] = useState<Tab>('charts');
  const [data, setData] = useState<IReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  // Chart base config — computed inside component so CSS vars are available
  const BASE_CHART: ApexOptions = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { enabled: true, speed: 400 },
    },
    grid: { borderColor: getChartColor('--color-edge'), strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportsApi.summary({ from, to });
      setData(result);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [from, to, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = async () => {
    if (!data) return;
    setPrinting(true);
    try {
      await printApi.report(data);
      toast.success(t('reports.printed'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPrinting(false);
    }
  };

  // ── Derived chart data ────────────────────────────────────────────────────────

  const days = data ? fillDays(from, to, data.paymentsByDay) : [];
  const hours = data ? fillHours(data.salesByHour) : [];
  const topItems = data?.topItems ?? [];

  const revenueChart: ApexOptions = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'area', id: 'revenue' },
    colors: ['#3b82f6'], // blue — keep as brand color
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90],
      },
    },
    xaxis: {
      categories: days.map((d) => d.label),
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
        rotate: -30,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
        formatter: (v) => `Rs ${(v / 1000).toFixed(0)}k`,
      },
    },
    tooltip: {
      theme: isDarkMode() ? 'dark' : 'light',
      y: { formatter: (v) => fmt(v) },
    },
  };

  const billsChart: ApexOptions = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'bar', id: 'bills' },
    colors: ['#8b5cf6'], // purple — keep as brand color
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    xaxis: {
      categories: days.map((d) => d.label),
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
        rotate: -30,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
        formatter: (v) => String(Math.round(v)),
      },
    },
    tooltip: {
      theme: isDarkMode() ? 'dark' : 'light',
      y: { formatter: (v) => `${Math.round(v)} bills` },
    },
  };

  const peakHoursChart: ApexOptions = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'bar', id: 'peak' },
    colors: ['#f59e0b'], // amber — keep as brand color
    plotOptions: { bar: { borderRadius: 3, columnWidth: '70%' } },
    xaxis: {
      categories: hours.map((h) => h.label),
      labels: {
        style: { fontSize: '10px', colors: getChartColor('--color-ink-faint') },
        rotate: -45,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
        formatter: (v) => `Rs ${(v / 1000).toFixed(0)}k`,
      },
    },
    tooltip: {
      theme: isDarkMode() ? 'dark' : 'light',
      y: { formatter: (v) => fmt(v) },
    },
  };

  const topItemsChart: ApexOptions = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'bar', id: 'top-items' },
    colors: ['#7bb910'], // green — keep as brand color
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, barHeight: '60%' },
    },
    xaxis: {
      categories: topItems.map((i) => i.name),
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
        formatter: (v) => `Rs ${(Number(v) / 1000).toFixed(0)}k`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: getChartColor('--color-ink-faint') },
      },
    },
    tooltip: {
      theme: isDarkMode() ? 'dark' : 'light',
      y: { formatter: (v) => fmt(v) },
    },
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-ink">{t('reports.title')}</h1>
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface border border-edge rounded-xl px-3 py-2 shadow-sm">
            <label className="text-xs font-medium text-ink-faint shrink-0">
              {t('reports.from')}
            </label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="text-sm text-ink bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-surface border border-edge rounded-xl px-3 py-2 shadow-sm">
            <label className="text-xs font-medium text-ink-faint shrink-0">
              {t('reports.to')}
            </label>
            <input
              type="date"
              value={to}
              min={from}
              max={today()}
              onChange={(e) => setTo(e.target.value)}
              className="text-sm text-ink bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {/* ── Shortcuts ── */}
          <div className="flex items-center gap-1.5">
            {(
              [
                {
                  label: t('reports.shortcutToday'),
                  fn: () => {
                    setFrom(today());
                    setTo(today());
                  },
                },
                {
                  label: t('reports.shortcutYesterday'),
                  fn: () => {
                    setFrom(daysAgo(1));
                    setTo(daysAgo(1));
                  },
                },
                {
                  label: t('reports.shortcut7d'),
                  fn: () => {
                    setFrom(daysAgo(6));
                    setTo(today());
                  },
                },
                {
                  label: t('reports.shortcut30d'),
                  fn: () => {
                    setFrom(daysAgo(29));
                    setTo(today());
                  },
                },
                {
                  label: t('reports.shortcutThisMonth'),
                  fn: () => {
                    setFrom(firstOfMonth());
                    setTo(today());
                  },
                },
              ] as { label: string; fn: () => void }[]
            ).map(({ label, fn }) => (
              <button
                key={label}
                type="button"
                onClick={fn}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-muted text-ink-dim hover:bg-edge hover:text-ink transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1" />
          <Button
            variant="secondary"
            icon={PrinterIcon}
            busy={printing}
            onClick={handlePrint}
            size="sm"
          >
            {t('reports.print')}
          </Button>
        </div>

        {/* ── Tabs ── */}
        <TabBar
          tabs={[
            {
              id: 'charts',
              label: t('reports.tabCharts'),
              icon: ChartBarIcon,
            },
            {
              id: 'report',
              label: t('reports.tabReport'),
              icon: TableCellsIcon,
            },
          ]}
          value={activeTab}
          onChange={(id) => setActiveTab(id as Tab)}
          variant="pills"
        />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data ? null : activeTab === 'charts' ? (
          /* ── Charts tab ── */
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label={t('reports.totalBills')}
                value={data.totals.bills_count}
                icon={DocumentTextIcon}
                color="theme"
              />
              <StatCard
                label={t('reports.totalRevenue')}
                value={fmt(data.totals.revenue)}
                icon={BanknotesIcon}
                color="green"
              />
              <StatCard
                label={t('reports.totalDiscount')}
                value={fmt(data.totals.discount)}
                icon={TagIcon}
                color="neon"
              />
            </div>

            {/* Revenue by day + Bills by day */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-surface rounded-2xl border border-edge shadow-sm p-5">
                <p className="text-sm font-semibold text-ink-dim mb-4">
                  {t('reports.revenueByDay')}
                </p>
                {days.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-ink-ghost text-sm">
                    {t('common.empty')}
                  </div>
                ) : (
                  <ReactApexChart
                    type="area"
                    options={revenueChart}
                    series={[
                      {
                        name: t('reports.totalRevenue'),
                        data: days.map((d) => d.amount),
                      },
                    ]}
                    height={200}
                  />
                )}
              </div>
              <div className="bg-surface rounded-2xl border border-edge shadow-sm p-5">
                <p className="text-sm font-semibold text-ink-dim mb-4">
                  {t('reports.billsByDay')}
                </p>
                {days.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-ink-ghost text-sm">
                    {t('common.empty')}
                  </div>
                ) : (
                  <ReactApexChart
                    type="bar"
                    options={billsChart}
                    series={[
                      {
                        name: t('reports.totalBills'),
                        data: days.map((d) => d.bills),
                      },
                    ]}
                    height={200}
                  />
                )}
              </div>
            </div>

            {/* Peak hours */}
            <div className="bg-surface rounded-2xl border border-edge shadow-sm p-5">
              <p className="text-sm font-semibold text-ink-dim mb-1">
                {t('reports.peakHours')}
              </p>
              <p className="text-xs text-ink-ghost mb-4">
                {t('reports.peakHoursDesc')}
              </p>
              <ReactApexChart
                type="bar"
                options={peakHoursChart}
                series={[
                  {
                    name: t('reports.totalRevenue'),
                    data: hours.map((h) => h.amount),
                  },
                ]}
                height={180}
              />
            </div>

            {/* Top items */}
            {topItems.length > 0 && (
              <div className="bg-surface rounded-2xl border border-edge shadow-sm p-5">
                <p className="text-sm font-semibold text-ink-dim mb-4">
                  {t('reports.topItems')}
                </p>
                <ReactApexChart
                  type="bar"
                  options={topItemsChart}
                  series={[
                    {
                      name: t('reports.amount'),
                      data: topItems.map((i) => i.amount),
                    },
                  ]}
                  height={Math.max(160, topItems.length * 36)}
                />
              </div>
            )}
          </div>
        ) : (
          /* ── Report tab ── */
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label={t('reports.totalBills')}
                value={data.totals.bills_count}
                icon={DocumentTextIcon}
                color="theme"
              />
              <StatCard
                label={t('reports.totalRevenue')}
                value={fmt(data.totals.revenue)}
                icon={BanknotesIcon}
                color="green"
              />
              <StatCard
                label={t('reports.totalDiscount')}
                value={fmt(data.totals.discount)}
                icon={TagIcon}
                color="neon"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Sales by day table */}
              <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-edge-muted">
                  <p className="text-sm font-semibold text-ink-dim">
                    {t('reports.salesByDay')}
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted text-xs text-ink-faint uppercase tracking-wide">
                      <th className="text-start px-5 py-2.5 font-medium">
                        {t('reports.day')}
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium">
                        {t('reports.bills')}
                      </th>
                      <th className="text-end px-5 py-2.5 font-medium">
                        {t('reports.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge-muted">
                    {data.paymentsByDay.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-8 text-center text-ink-ghost text-xs"
                        >
                          {t('common.empty')}
                        </td>
                      </tr>
                    ) : (
                      data.paymentsByDay.map((row) => (
                        <tr key={row.day} className="hover:bg-surface-muted/50">
                          <td className="px-5 py-2.5 text-ink-dim font-medium">
                            {row.day}
                          </td>
                          <td className="px-3 py-2.5 text-center text-ink-dim">
                            {row.bills}
                          </td>
                          <td className="px-5 py-2.5 text-end font-semibold text-ink">
                            {fmt(row.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Top items table */}
              <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-edge-muted">
                  <p className="text-sm font-semibold text-ink-dim">
                    {t('reports.topItems')}
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted text-xs text-ink-faint uppercase tracking-wide">
                      <th className="text-start px-5 py-2.5 font-medium">
                        {t('reports.item')}
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium">
                        {t('reports.qty')}
                      </th>
                      <th className="text-end px-5 py-2.5 font-medium">
                        {t('reports.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge-muted">
                    {topItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-8 text-center text-ink-ghost text-xs"
                        >
                          {t('common.empty')}
                        </td>
                      </tr>
                    ) : (
                      topItems.map((item) => (
                        <tr
                          key={item.name}
                          className="hover:bg-surface-muted/50"
                        >
                          <td className="px-5 py-2.5 text-ink-dim font-medium">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-ink-dim">
                            {item.qty}
                          </td>
                          <td className="px-5 py-2.5 text-end font-semibold text-ink">
                            {fmt(item.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
