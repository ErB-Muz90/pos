
import React, { useMemo, useState, ReactNode } from 'react';
import { Sale, Product, Expense, Settings, SupplierPayment, BankDeposit, Shift, SupplierInvoice, Payment, AccountingTransaction, Account } from '../../types';
import { motion } from 'framer-motion';

interface FiscalPeriodReportProps {
    sales: Sale[];
    products: Product[];
    expenses: Expense[];
    supplierPayments: SupplierPayment[];
    bankDeposits: BankDeposit[];
    shifts: Shift[];
    settings: Settings;
    supplierInvoices: SupplierInvoice[];
    accountingTransactions: AccountingTransaction[];
    chartOfAccounts: Account[];
}

const formatCurrency = (amount: number, currency: string = 'KES') => 
    `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TopMetricCard: React.FC<{ title: string; value: string; subValue?: string; icon: ReactNode; iconBg: string; }> = ({ title, value, subValue, icon, iconBg }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm border border-border dark:border-dark-border">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
                <p className="text-3xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
                {subValue && <p className="text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-lg ${iconBg}`}>{icon}</div>
        </div>
    </div>
);

const BalanceCard: React.FC<{ title: string; value: string; icon: ReactNode; }> = ({ title, value, icon }) => (
     <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm border border-border dark:border-dark-border flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-muted dark:bg-dark-muted text-primary dark:text-dark-primary">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
            <p className="text-lg font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const AdditionalMetricCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm text-center border border-border dark:border-dark-border">
        <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
    </div>
);


const FiscalPeriodReportView: React.FC<FiscalPeriodReportProps> = ({ sales, products, expenses, supplierPayments, bankDeposits, shifts, settings, supplierInvoices, accountingTransactions, chartOfAccounts }) => {
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportingBasis, setReportingBasis] = useState<'cash' | 'accrual'>(settings.accounting.reportingBasis || 'cash');

    const { periodData, closingBalances } = useMemo(() => {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        // Cash basis: revenue recognised when payment received (sale date)
        // Accrual basis: same for POS (sales are immediate), but supplier invoices use due date
        const filteredSales = sales.filter(s => { const d = new Date(s.date); return d >= start && d <= end; });
        const filteredExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
        // Accrual: include supplier invoices whose invoice date falls in period (not just when paid)
        const filteredSupplierInvoices = reportingBasis === 'accrual'
            ? supplierInvoices.filter(i => { const d = new Date(i.invoiceDate); return d >= start && d <= end; })
            : supplierInvoices.filter(i => { const d = new Date(i.invoiceDate); return d >= start && d <= end && i.status === 'Paid'; });
        const filteredBankDeposits = bankDeposits.filter(d => { const dt = new Date(d.date); return dt >= start && dt <= end; });
        const filteredShifts = shifts.filter(s => s.endTime && new Date(s.endTime) >= start && new Date(s.endTime) <= end);

        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
        const totalCogs = filteredSales.reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + (i.costPrice || 0) * i.quantity, 0), 0);
        const grossProfit = totalRevenue - totalCogs;
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = grossProfit - totalExpenses;
        const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        const paymentBreakdown = filteredSales.flatMap(s => s.payments).reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
        }, {} as Record<Payment['method'], number>);

        const totalTax = filteredSales.reduce((sum, s) => sum + s.tax, 0);

        // --- NEW LEDGER-BASED FUNDS FLOW ---
        const getFlowForAccount = (accountId: string): { inflow: number; outflow: number; net: number } => {
            if (!accountId) return { inflow: 0, outflow: 0, net: 0 };
            const account = chartOfAccounts.find(acc => acc.id === accountId);
            if (!account) return { inflow: 0, outflow: 0, net: 0 };

            const flows = accountingTransactions
                .filter(t => {
                    const d = new Date(t.date);
                    return d >= start && d <= end;
                })
                .flatMap(t => t.entries)
                .filter(e => e.accountId === accountId)
                .reduce((acc, entry) => {
                    acc.debit += entry.debit;
                    acc.credit += entry.credit;
                    return acc;
                }, { debit: 0, credit: 0 });
            
            // For Asset accounts (Cash, Mpesa, Bank), debits are inflows and credits are outflows.
            if (['Assets', 'Expenses'].includes(account.type)) {
                return {
                    inflow: flows.debit,
                    outflow: flows.credit,
                    net: flows.debit - flows.credit,
                };
            } else { // For Liability, Equity, Revenue, credits are "inflows" to the account balance, debits are outflows
                return {
                    inflow: flows.credit,
                    outflow: flows.debit,
                    net: flows.credit - flows.debit,
                };
            }
        };

        const cashFlow = getFlowForAccount(settings.accounting.defaultCashAccountId);
        const mpesaFlow = getFlowForAccount(settings.accounting.defaultMpesaAccountId);
        const bankFlow = getFlowForAccount(settings.accounting.defaultBankAccountId);


        // --- Closing Balance Calculations (Corrected Ledger-Based Logic) ---
        const getClosingBalance = (accountId: string): number => {
            if (!accountId || !chartOfAccounts || !accountingTransactions) return 0;
            const account = chartOfAccounts.find(acc => acc.id === accountId);
            if (!account) return 0;
            
            const balance = accountingTransactions
                .filter(t => new Date(t.date) <= end)
                .flatMap(t => t.entries)
                .filter(e => e.accountId === accountId)
                .reduce((bal, entry) => bal + entry.debit - entry.credit, 0);
            
            return ['Assets', 'Expenses'].includes(account.type) ? balance : -balance;
        };
        
        const closingCash = getClosingBalance(settings.accounting.defaultCashAccountId);
        const closingMpesa = getClosingBalance(settings.accounting.defaultMpesaAccountId);
        const closingBank = getClosingBalance(settings.accounting.defaultBankAccountId);
        
        return {
            periodData: {
                totalRevenue, grossProfit, totalExpenses, netProfit, margin,
                paymentBreakdown, totalTax,
                totalTransactions: filteredSales.length,
                itemsSold: filteredSales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0),
                totalShifts: filteredShifts.length,
                totalBankDeposits: filteredBankDeposits.reduce((sum, d) => sum + d.amount, 0),
                cashFlow,
                mpesaFlow,
                bankFlow,
            },
            closingBalances: {
                cash: closingCash,
                mpesa: closingMpesa,
                bank: closingBank,
                total: closingCash + closingMpesa + closingBank
            }
        };
    }, [fromDate, toDate, reportingBasis, sales, products, expenses, supplierPayments, bankDeposits, shifts, settings, supplierInvoices, accountingTransactions, chartOfAccounts]);

    const handleExport = () => {
        const data = [
            ['Metric', 'Amount'],
            ['Start Date', fromDate],
            ['End Date', toDate],
            ['', ''], // separator
            ['Total Revenue', periodData.totalRevenue.toFixed(2)],
            ['Gross Profit', periodData.grossProfit.toFixed(2)],
            ['Total Expenses', periodData.totalExpenses.toFixed(2)],
            ['Net Profit', periodData.netProfit.toFixed(2)],
            ['Profit Margin (%)', periodData.margin.toFixed(2)],
            ['', ''],
            ['Net Cash Flow', periodData.cashFlow.net.toFixed(2)],
            ['Net M-Pesa Flow', periodData.mpesaFlow.net.toFixed(2)],
            ['Net Bank Flow', periodData.bankFlow.net.toFixed(2)],
            ['Total Net Flow', (periodData.cashFlow.net + periodData.mpesaFlow.net + periodData.bankFlow.net).toFixed(2)],
            ['', ''],
            ['Closing Cash Balance', closingBalances.cash.toFixed(2)],
            ['Closing M-Pesa Balance', closingBalances.mpesa.toFixed(2)],
            ['Closing Bank Balance', closingBalances.bank.toFixed(2)],
            ['Closing Total Balance', closingBalances.total.toFixed(2)],
        ];
    
        const csvContent = "data:text/csv;charset=utf-8," 
            + data.map(e => e.join(",")).join("\n");
    
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fiscal_report_${fromDate}_to_${toDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Fiscal Period Report</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Complete financial overview for the selected period</p>
                </div>
                <button onClick={handleExport} className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg shadow-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export Report
                </button>
            </div>

            <div className="mb-6 p-4 bg-card dark:bg-dark-card rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="from-date" className="text-sm font-medium text-foreground-muted">From Date</label>
                    <input id="from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full mt-1 p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
                </div>
                <div>
                    <label htmlFor="to-date" className="text-sm font-medium text-foreground-muted">To Date</label>
                    <input id="to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full mt-1 p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground-muted">Reporting Basis</label>
                    <div className="mt-1 flex rounded-md overflow-hidden border border-border dark:border-dark-border">
                        <button onClick={() => setReportingBasis('cash')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${reportingBasis === 'cash' ? 'bg-primary text-primary-content' : 'bg-background dark:bg-dark-background text-foreground-muted'}`}>Cash</button>
                        <button onClick={() => setReportingBasis('accrual')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${reportingBasis === 'accrual' ? 'bg-primary text-primary-content' : 'bg-background dark:bg-dark-background text-foreground-muted'}`}>Accrual</button>
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">{reportingBasis === 'cash' ? 'Revenue when cash received' : 'Revenue when earned/invoiced'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <TopMetricCard title="Total Revenue" value={formatCurrency(periodData.totalRevenue, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">$</span>} iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" />
                <TopMetricCard title="Gross Profit" value={formatCurrency(periodData.grossProfit, settings.businessInfo.currency)} subValue={`${periodData.margin.toFixed(1)}% margin`} icon={<span className="font-bold text-lg">&#8593;</span>} iconBg="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300" />
                <TopMetricCard title="Total Expenses" value={formatCurrency(periodData.totalExpenses, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">&#8595;</span>} iconBg="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300" />
                <TopMetricCard title="Net Profit" value={formatCurrency(periodData.netProfit, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">&#8699;</span>} iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300" />
            </div>

             <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-bold mb-2">Closing Balances at End of Fiscal Period</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <BalanceCard title="Cash on Hand" value={formatCurrency(closingBalances.cash, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">C</span>} />
                    <BalanceCard title="M-Pesa Balance" value={formatCurrency(closingBalances.mpesa, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">M</span>} />
                    <BalanceCard title="Bank Balance" value={formatCurrency(closingBalances.bank, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">B</span>} />
                    <BalanceCard title="Total Balance" value={formatCurrency(closingBalances.total, settings.businessInfo.currency)} icon={<span className="font-bold text-lg">$</span>} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm">
                     <h3 className="text-lg font-bold mb-2">Payment Methods Breakdown</h3>
                    <div className="space-y-2 text-sm">
                        {Object.entries(periodData.paymentBreakdown).map(([method, amount]) => (
                            <div key={method} className="flex justify-between">
                                <span className="text-foreground-muted">{method}</span>
                                <span className="font-mono font-semibold">{formatCurrency(amount as number, settings.businessInfo.currency)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold mb-2">Funds Flow (Period)</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold text-foreground">Cash</p>
                            <div className="text-xs space-y-1 pl-2">
                                <div className="flex justify-between"><span>Inflow:</span> <span className="font-mono text-green-600">{formatCurrency(periodData.cashFlow.inflow, settings.businessInfo.currency)}</span></div>
                                <div className="flex justify-between"><span>Outflow:</span> <span className="font-mono text-red-500">{formatCurrency(periodData.cashFlow.outflow, settings.businessInfo.currency)}</span></div>
                                <div className="flex justify-between font-semibold border-t pt-1 border-border dark:border-dark-border"><span>Net:</span> <span className={`font-mono ${periodData.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(periodData.cashFlow.net, settings.businessInfo.currency)}</span></div>
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-foreground">M-Pesa</p>
                            <div className="text-xs space-y-1 pl-2">
                                <div className="flex justify-between"><span>Inflow:</span> <span className="font-mono text-green-600">{formatCurrency(periodData.mpesaFlow.inflow, settings.businessInfo.currency)}</span></div>
                                <div className="flex justify-between"><span>Outflow:</span> <span className="font-mono text-red-500">{formatCurrency(periodData.mpesaFlow.outflow, settings.businessInfo.currency)}</span></div>
                                <div className="flex justify-between font-semibold border-t pt-1 border-border dark:border-dark-border"><span>Net:</span> <span className={`font-mono ${periodData.mpesaFlow.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(periodData.mpesaFlow.net, settings.businessInfo.currency)}</span></div>
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-foreground">Bank</p>
                            <div className="text-xs space-y-1 pl-2">
                                <div className="flex justify-between"><span>Inflow:</span> <span className="font-mono text-green-600">{formatCurrency(periodData.bankFlow.inflow, settings.businessInfo.currency)}</span></div>
                                <div className="flex justify-between"><span>Outflow:</span> <span className="font-mono text-red-500">{formatCurrency(periodData.bankFlow.outflow, settings.businessInfo.currency)}</span></div>
                                <div className="flex justify-between font-semibold border-t pt-1 border-border dark:border-dark-border"><span>Net:</span> <span className={`font-mono ${periodData.bankFlow.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(periodData.bankFlow.net, settings.businessInfo.currency)}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-between border-t border-border dark:border-dark-border mt-2 pt-2 font-bold text-lg">
                            <span>Total Net Flow</span>
                            <span className="font-mono">{formatCurrency(periodData.cashFlow.net + periodData.mpesaFlow.net + periodData.bankFlow.net, settings.businessInfo.currency)}</span>
                        </div>
                    </div>
                </div>
            </div>

             <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm">
                 <h3 className="text-lg font-bold mb-2">Additional Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AdditionalMetricCard title="Total Transactions" value={periodData.totalTransactions} />
                    <AdditionalMetricCard title="Items Sold" value={periodData.itemsSold} />
                    <AdditionalMetricCard title="Total Shifts" value={periodData.totalShifts} />
                    <AdditionalMetricCard title="Tax Collected" value={formatCurrency(periodData.totalTax, settings.businessInfo.currency)} />
                </div>
            </div>
        </div>
    );
};

export default FiscalPeriodReportView;
