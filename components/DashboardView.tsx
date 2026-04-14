import React, { ReactNode, useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Expense, Payment, Product, Sale, Settings, Supplier, SupplierInvoice, WorkOrder } from '../types';
import { useTheme } from '../hooks/useTheme';

interface DashboardViewProps {
    sales: Sale[];
    products: Product[];
    suppliers: Supplier[];
    supplierInvoices: SupplierInvoice[];
    settings: Settings;
    expenses: Expense[];
    workOrders: WorkOrder[];
}

type DateRange = 'today' | '7d' | '30d';
type Accent = 'emerald' | 'green' | 'rose' | 'orange' | 'blue' | 'amber';

const fadeInUp = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const formatCurrency = (value: number) => `Ksh ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (value: number) => `Ksh ${Math.round(value).toLocaleString('en-KE')}`;

const getRangeLabel = (range: DateRange) => {
    if (range === 'today') return 'Today';
    if (range === '7d') return 'Last 7 Days';
    return 'Last 30 Days';
};

const getRangeStart = (range: DateRange) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
        return startOfToday;
    }

    const offset = range === '7d' ? 6 : 29;
    return new Date(startOfToday.getTime() - offset * 24 * 60 * 60 * 1000);
};

const accentStyles: Record<Accent, { card: string; icon: string; chip: string; text: string }> = {
    emerald: {
        card: 'from-emerald-500/20 via-emerald-500/8 to-transparent',
        icon: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
        chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        text: 'text-emerald-600 dark:text-emerald-300',
    },
    green: {
        card: 'from-green-500/20 via-green-500/8 to-transparent',
        icon: 'bg-green-500/12 text-green-600 dark:text-green-300',
        chip: 'bg-green-500/12 text-green-700 dark:text-green-300',
        text: 'text-green-600 dark:text-green-300',
    },
    rose: {
        card: 'from-rose-500/20 via-rose-500/8 to-transparent',
        icon: 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
        chip: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
        text: 'text-rose-600 dark:text-rose-300',
    },
    orange: {
        card: 'from-orange-500/20 via-orange-500/8 to-transparent',
        icon: 'bg-orange-500/12 text-orange-600 dark:text-orange-300',
        chip: 'bg-orange-500/12 text-orange-700 dark:text-orange-300',
        text: 'text-orange-600 dark:text-orange-300',
    },
    blue: {
        card: 'from-blue-500/20 via-blue-500/8 to-transparent',
        icon: 'bg-blue-500/12 text-blue-600 dark:text-blue-300',
        chip: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        text: 'text-blue-600 dark:text-blue-300',
    },
    amber: {
        card: 'from-amber-500/20 via-amber-500/8 to-transparent',
        icon: 'bg-amber-500/12 text-amber-600 dark:text-amber-300',
        chip: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        text: 'text-amber-600 dark:text-amber-300',
    },
};

const IconShell: React.FC<{ children: ReactNode; accent: Accent }> = ({ children, accent }) => (
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentStyles[accent].icon}`}>
        {children}
    </div>
);

const svgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

const Icons = {
    revenue: <svg {...svgProps}><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    profit: <svg {...svgProps}><path d="m4 14 5-5 4 4 7-7" /><path d="M20 10V6h-4" /></svg>,
    expense: <svg {...svgProps}><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>,
    cogs: <svg {...svgProps}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M12 12 4 7.5" /><path d="M12 12l8-4.5" /><path d="M12 21v-9" /></svg>,
    workOrder: <svg {...svgProps}><path d="m14.7 6.3 3 3" /><path d="m7 8 3-3 7 7-3 3-7-7Z" /><path d="m5 20 3.5-3.5" /></svg>,
    balance: <svg {...svgProps}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></svg>,
    calendar: <svg {...svgProps}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>,
    spark: <svg {...svgProps}><path d="m12 3 1.9 4.8L19 9.7l-4 3.2 1.3 5L12 15l-4.3 2.9 1.3-5-4-3.2 5.1-1.9L12 3Z" /></svg>,
    alert: <svg {...svgProps}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>,
    inventory: <svg {...svgProps}><path d="M6 7h12" /><path d="M6 12h12" /><path d="M6 17h8" /></svg>,
    invoice: <svg {...svgProps}><path d="M8 3h8l4 4v14H4V3Z" /><path d="M16 3v4h4" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>,
    sale: <svg {...svgProps}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>,
    cash: <svg {...svgProps}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>,
    mpesa: <svg {...svgProps}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>,
    card: <svg {...svgProps}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
};

const DateButton: React.FC<{
    label: string;
    range: DateRange;
    activeRange: DateRange;
    onClick: (range: DateRange) => void;
}> = ({ label, range, activeRange, onClick }) => (
    <button
        onClick={() => onClick(range)}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            activeRange === range
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
    >
        {label}
    </button>
);

const DashboardCard: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
    accent: Accent;
    icon: ReactNode;
    change?: string;
}> = ({ title, value, subtitle, accent, icon, change }) => (
    <motion.div
        variants={fadeInUp}
        whileHover={{ y: -4, scale: 1.01 }}
        className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/88 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72"
    >
        <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${accentStyles[accent].card}`} />
        <div className="relative flex items-start justify-between gap-4">
            <IconShell accent={accent}>{icon}</IconShell>
            {change ? (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${accentStyles[accent].chip}`}>
                    {change}
                </span>
            ) : null}
        </div>
        <div className="relative mt-5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
    </motion.div>
);

export const DashboardView = ({ sales, products, suppliers, supplierInvoices, settings, expenses, workOrders }: DashboardViewProps) => {
    const [theme] = useTheme();
    const [dateRange, setDateRange] = useState<DateRange>('7d');

    const productCostMap = useMemo(() => new Map(products.map((product) => [product.id, product.costPrice || 0])), [products]);
    const rangeStart = useMemo(() => getRangeStart(dateRange), [dateRange]);

    const { filteredSales, filteredExpenses } = useMemo(() => {
        return {
            filteredSales: sales.filter((sale) => new Date(sale.date) >= rangeStart),
            filteredExpenses: expenses.filter((expense) => new Date(expense.date) >= rangeStart),
        };
    }, [sales, expenses, rangeStart]);

    const stats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalCogs = filteredSales.reduce((sum, sale) => {
            const saleCost = sale.items.reduce((itemTotal, item) => itemTotal + (productCostMap.get(item.id) || 0) * Math.abs(item.quantity), 0);
            return sum + saleCost;
        }, 0);
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const netProfit = totalRevenue - totalCogs - totalExpenses;
        const openWorkOrders = workOrders.filter((order) => order.status === 'Pending' || order.status === 'InProgress').length;
        const outstandingBalances = workOrders.reduce((sum, order) => sum + order.balanceDue, 0);
        const invoiceOutstanding = supplierInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);

        return {
            totalRevenue,
            netProfit,
            totalExpenses,
            totalCogs,
            openWorkOrders,
            outstandingBalances,
            invoiceOutstanding,
        };
    }, [filteredSales, filteredExpenses, workOrders, supplierInvoices, productCostMap]);

    const chartData = useMemo(() => {
        const rows: Record<string, { sales: number; profit: number }> = {};
        const days = dateRange === 'today' ? 1 : dateRange === '7d' ? 7 : 30;
        const start = getRangeStart(dateRange);

        filteredSales.forEach((sale) => {
            const key = new Date(sale.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
            if (!rows[key]) rows[key] = { sales: 0, profit: 0 };
            const saleCost = sale.items.reduce((itemTotal, item) => itemTotal + (productCostMap.get(item.id) || 0) * Math.abs(item.quantity), 0);
            rows[key].sales += sale.total;
            rows[key].profit += sale.total - saleCost;
        });

        filteredExpenses.forEach((expense) => {
            const key = new Date(expense.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
            if (!rows[key]) rows[key] = { sales: 0, profit: 0 };
            rows[key].profit -= expense.amount;
        });

        return Array.from({ length: days }, (_, index) => {
            const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
            const key = date.toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
            return {
                label: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'Africa/Nairobi' }),
                sales: rows[key]?.sales || 0,
                profit: rows[key]?.profit || 0,
            };
        });
    }, [dateRange, filteredExpenses, filteredSales, productCostMap]);

    const paymentMethodData = useMemo(() => {
        const grouped: Partial<Record<Payment['method'], number>> = {};
        filteredSales.forEach((sale) => {
            sale.payments.forEach((payment) => {
                grouped[payment.method] = (grouped[payment.method] || 0) + payment.amount;
            });
        });

        const total = Object.values(grouped).reduce((sum, value) => sum + (value || 0), 0);
        const iconMap: Record<Payment['method'], ReactNode> = {
            Cash: Icons.cash,
            'M-Pesa': Icons.mpesa,
            Card: Icons.card,
            Points: Icons.spark,
        };
        const colorMap: Record<Payment['method'], string> = {
            Cash: '#10b981',
            'M-Pesa': '#8b5cf6',
            Card: '#3b82f6',
            Points: '#f59e0b',
        };

        return (Object.entries(grouped) as [Payment['method'], number][])
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? (value / total) * 100 : 0,
                icon: iconMap[name],
                color: colorMap[name],
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredSales]);

    const recentSales = useMemo(() => {
        return [...filteredSales]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [filteredSales]);

    const lowStockProducts = useMemo(() => {
        return [...products]
            .filter((product) => product.productType === 'Inventory')
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5);
    }, [products]);

    const overdueInvoices = useMemo(() => {
        const now = new Date();
        return supplierInvoices
            .filter((invoice) => invoice.status !== 'Paid' && new Date(invoice.dueDate) < now)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 4);
    }, [supplierInvoices]);

    const totalCustomers = useMemo(() => {
        const customerIds = new Set(sales.filter((sale) => sale.customerId).map((sale) => sale.customerId));
        return customerIds.size;
    }, [sales]);

    const chartAccent = theme === 'dark'
        ? { sales: '#8b5cf6', profit: '#34d399', grid: '#334155', axis: '#94a3b8' }
        : { sales: '#7c3aed', profit: '#059669', grid: '#cbd5e1', axis: '#64748b' };

    const topPayment = paymentMethodData[0];
    const businessName = settings?.businessInfo?.name || 'Banduka POS';

    return (
        <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_25%)] px-4 py-5 md:px-6 md:py-6">
            <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={fadeInUp} className="flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="rounded-full bg-violet-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                                Live Operations
                            </span>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                {getRangeLabel(dateRange)}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Dashboard</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                            {businessName} at a glance. Revenue, operating cost, inventory pressure, and supplier obligations are all in one place.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950/70">
                            <DateButton label="Today" range="today" activeRange={dateRange} onClick={setDateRange} />
                            <DateButton label="7 Days" range="7d" activeRange={dateRange} onClick={setDateRange} />
                            <DateButton label="30 Days" range="30d" activeRange={dateRange} onClick={setDateRange} />
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                            {Icons.calendar}
                            <span>{new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats.totalRevenue)}
                        subtitle="Gross sales collected in the selected period"
                        accent="emerald"
                        icon={Icons.revenue}
                        change={filteredSales.length ? `${filteredSales.length} sales` : undefined}
                    />
                    <StatCard
                        title="Net Profit"
                        value={formatCurrency(stats.netProfit)}
                        subtitle="Revenue less COGS and expenses"
                        accent="green"
                        icon={Icons.profit}
                        change={stats.netProfit >= 0 ? 'Positive' : 'Negative'}
                    />
                    <StatCard
                        title="Expenses"
                        value={formatCurrency(stats.totalExpenses)}
                        subtitle="Recorded payouts and operating expense"
                        accent="rose"
                        icon={Icons.expense}
                        change={filteredExpenses.length ? `${filteredExpenses.length} entries` : undefined}
                    />
                    <StatCard
                        title="COGS"
                        value={formatCurrency(stats.totalCogs)}
                        subtitle="Direct item cost tied to completed sales"
                        accent="orange"
                        icon={Icons.cogs}
                    />
                    <StatCard
                        title="Open Work Orders"
                        value={`${stats.openWorkOrders}`}
                        subtitle="Pending and in-progress jobs awaiting completion"
                        accent="blue"
                        icon={Icons.workOrder}
                    />
                    <StatCard
                        title="Outstanding Balances"
                        value={formatCurrency(stats.outstandingBalances)}
                        subtitle="Remaining work order balances still collectible"
                        accent="amber"
                        icon={Icons.balance}
                        change={stats.outstandingBalances > 0 ? 'Attention' : 'Clear'}
                    />
                </motion.div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
                    <motion.div variants={fadeInUp}>
                        <DashboardCard className="h-full">
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Sales & Profit Over Time</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Daily trend for revenue versus net profit.</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-700 dark:text-violet-300">Sales</span>
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">Net Profit</span>
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={chartAccent.sales} stopOpacity={0.35} />
                                                <stop offset="100%" stopColor={chartAccent.sales} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={chartAccent.profit} stopOpacity={0.28} />
                                                <stop offset="100%" stopColor={chartAccent.profit} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke={chartAccent.grid} strokeDasharray="3 3" vertical={false} opacity={0.35} />
                                        <XAxis dataKey="label" stroke={chartAccent.axis} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke={chartAccent.axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `K${Number(value).toLocaleString('en-KE')}`} />
                                        <Tooltip
                                            formatter={(value: number, name: string) => [formatCurrency(value), name === 'sales' ? 'Sales' : 'Net Profit']}
                                            labelStyle={{ color: '#0f172a' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '1px solid rgba(148, 163, 184, 0.25)',
                                                background: theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255,255,255,0.96)',
                                                color: theme === 'dark' ? '#fff' : '#0f172a',
                                            }}
                                        />
                                        <Area type="monotone" dataKey="sales" stroke={chartAccent.sales} fill="url(#salesArea)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="profit" stroke={chartAccent.profit} fill="url(#profitArea)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </DashboardCard>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                        <DashboardCard className="h-full">
                            <div className="mb-6 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Payments by Type</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Collection mix from the selected period.</p>
                                </div>
                                {topPayment ? (
                                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                                        Top: {topPayment.name}
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-1">
                                <div className="space-y-4">
                                    {paymentMethodData.length ? paymentMethodData.map((method) => (
                                        <div key={method.name} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                            <div className="mb-2 flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: method.color }}>
                                                    {method.icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{method.name}</p>
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            {method.percentage.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(method.value)}</p>
                                                </div>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${method.percentage}%` }}
                                                    transition={{ duration: 0.7 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: method.color }}
                                                />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                            No payment data yet for this period.
                                        </div>
                                    )}
                                </div>

                                <div className="mx-auto flex w-full max-w-xs items-center justify-center">
                                    <div className="relative h-56 w-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={paymentMethodData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={58}
                                                    outerRadius={84}
                                                    paddingAngle={4}
                                                >
                                                    {paymentMethodData.map((entry) => (
                                                        <Cell key={entry.name} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Top Mix</p>
                                            <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                                                {topPayment ? `${topPayment.percentage.toFixed(0)}%` : '0%'}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{topPayment?.name || 'No payments'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DashboardCard>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <motion.div variants={fadeInUp}>
                        <DashboardCard>
                            <div className="mb-6 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent Transactions</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Most recent sales captured in the selected period.</p>
                                </div>
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    {recentSales.length} shown
                                </span>
                            </div>
                            <div className="space-y-3">
                                {recentSales.length ? recentSales.map((sale) => {
                                    const primaryPayment = sale.payments[0]?.method || 'Mixed';
                                    return (
                                        <div key={sale.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                                                    {Icons.sale}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Sale #{sale.id.slice(-6).toUpperCase()}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(sale.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} • {sale.cashierName || 'Staff'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 self-start sm:self-center">
                                                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                                    {primaryPayment}
                                                </span>
                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(sale.total)}</span>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        No sales recorded in this range yet.
                                    </div>
                                )}
                            </div>
                        </DashboardCard>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="space-y-6">
                        <DashboardCard>
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Operational Pressure</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Inventory and supplier risk that needs attention.</p>
                                </div>
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    Monitor
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                    <div className="mb-3 flex items-center gap-3">
                                        <IconShell accent="amber">{Icons.inventory}</IconShell>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Low Stock Watch</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Products with the lowest on-hand stock.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {lowStockProducts.length ? lowStockProducts.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between text-sm">
                                                <span className="truncate pr-3 text-slate-700 dark:text-slate-300">{product.name}</span>
                                                <span className={`font-semibold ${product.stock <= 0 ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300'}`}>
                                                    {product.stock} left
                                                </span>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">No inventory products available.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                    <div className="mb-3 flex items-center gap-3">
                                        <IconShell accent="blue">{Icons.invoice}</IconShell>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Supplier Payables</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Open supplier obligations and overdue invoices.</p>
                                        </div>
                                    </div>
                                    <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-900/80">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Outstanding</span>
                                        <span className="text-sm font-bold text-slate-950 dark:text-white">{formatCompactCurrency(stats.invoiceOutstanding)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {overdueInvoices.length ? overdueInvoices.map((invoice) => (
                                            <div key={invoice.id} className="flex items-center justify-between text-sm">
                                                <span className="truncate pr-3 text-slate-700 dark:text-slate-300">{invoice.invoiceNumber}</span>
                                                <span className="font-semibold text-rose-600 dark:text-rose-300">
                                                    {formatCompactCurrency(invoice.totalAmount - invoice.paidAmount)}
                                                </span>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">No overdue supplier invoices.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DashboardCard>

                        <DashboardCard>
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Business Snapshot</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current store and account footprint.</p>
                                </div>
                                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                                    Live
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Products</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{products.length}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Suppliers</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{suppliers.length}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Customers</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{totalCustomers}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45">
                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Invoices</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{supplierInvoices.length}</p>
                                </div>
                            </div>
                        </DashboardCard>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};
