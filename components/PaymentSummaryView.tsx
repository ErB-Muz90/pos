import React, { useState, useMemo } from 'react';
import { Sale, User, Payment } from '../types';
import { ModernButton, ModernEmptyState, ModernInput, ModernShell, ModernStatCard, ModernTableShell } from './common/ModernUI';

type PaymentTransaction = Payment & {
    saleId: string;
    date: Date;
    cashierName: string;
};

const ITEMS_PER_PAGE = 20;

const exportToCSV = (data: PaymentTransaction[], filename: string) => {
    const headers = ['date', 'saleId', 'method', 'amount', 'cashierName'];
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header as keyof PaymentTransaction];
                if (header === 'date' && value instanceof Date) {
                    return value.toISOString();
                }
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',')
        )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};


const PaymentSummaryView: React.FC<{ sales: Sale[]; users: User[] }> = ({ sales }) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filter, setFilter] = useState<Payment['method'] | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    
    const transactions: PaymentTransaction[] = useMemo(() => {
        return sales.flatMap(sale => 
            sale.payments.map(payment => ({
                ...payment,
                saleId: sale.id,
                date: new Date(sale.date),
                cashierName: sale.cashierName
            }))
        ).sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [sales]);

    const filteredByDate = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if (end) end.setHours(23, 59, 59, 999);
        
        return transactions.filter(t => {
            if (start && t.date < start) return false;
            if (end && t.date > end) return false;
            return true;
        });
    }, [transactions, dateFrom, dateTo]);

    const summary = useMemo(() => {
        return filteredByDate.reduce((acc, t) => {
            acc.All = (acc.All || 0) + t.amount;
            acc[t.method] = (acc[t.method] || 0) + t.amount;
            return acc;
        }, {} as Record<Payment['method'] | 'All', number>);
    }, [filteredByDate]);

    const filteredTransactions = useMemo(() => {
        setCurrentPage(1); // Reset page on filter change
        if (filter === 'All') return filteredByDate;
        return filteredByDate.filter(t => t.method === filter);
    }, [filteredByDate, filter]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount: number = 0) => `Ksh ${amount.toFixed(2)}`;

    const paymentIcons = {
        All: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="16" cy="12" r="1.5" /></svg>,
        Cash: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" /></svg>,
        'M-Pesa': <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="7" y="2" width="10" height="20" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M11 18h2" /></svg>,
        Card: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" /></svg>,
        Points: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.4 4.86L20 8.7l-4 3.9.94 5.48L12 15.9l-4.94 2.18L8 12.6l-4-3.9 5.6-.84L12 3Z" /></svg>,
    };

    return (
        <ModernShell eyebrow="Collections Analytics" title="Payment Summary" description="Review payment mix, filter by method and period, and export transaction-level payment summaries.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <ModernInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                <ModernButton onClick={() => exportToCSV(filteredTransactions, `payment_summary_${dateFrom}_${dateTo}.csv`)}>Export to CSV</ModernButton>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div onClick={() => setFilter('All')} className="cursor-pointer"><ModernStatCard title="Total Payments" value={formatCurrency(summary.All)} subtitle="All recorded payment methods" icon={paymentIcons.All} accent={filter === 'All' ? 'violet' : 'slate'} /></div>
                <div onClick={() => setFilter('Cash')} className="cursor-pointer"><ModernStatCard title="Cash" value={formatCurrency(summary.Cash)} subtitle="Cash receipts collected" icon={paymentIcons.Cash} accent={filter === 'Cash' ? 'emerald' : 'slate'} /></div>
                <div onClick={() => setFilter('M-Pesa')} className="cursor-pointer"><ModernStatCard title="M-Pesa" value={formatCurrency(summary['M-Pesa'])} subtitle="Mobile money collections" icon={paymentIcons['M-Pesa']} accent={filter === 'M-Pesa' ? 'blue' : 'slate'} /></div>
                <div onClick={() => setFilter('Card')} className="cursor-pointer"><ModernStatCard title="Card" value={formatCurrency(summary.Card)} subtitle="Card payment volume" icon={paymentIcons.Card} accent={filter === 'Card' ? 'amber' : 'slate'} /></div>
                <div onClick={() => setFilter('Points')} className="cursor-pointer"><ModernStatCard title="Points" value={formatCurrency(summary.Points)} subtitle="Loyalty points redemption value" icon={paymentIcons.Points} accent={filter === 'Points' ? 'rose' : 'slate'} /></div>
            </div>

            <ModernTableShell title="Payment Transactions" description="Transaction-level payment breakdown for the selected filters.">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Receipt ID</th>
                            <th scope="col" className="px-6 py-3">Method</th>
                            <th scope="col" className="px-6 py-3">Cashier</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTransactions.map((t, index) => (
                            <tr key={`${t.saleId}-${index}`} className="border-b dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted">
                                <td className="px-6 py-4">{t.date.toLocaleString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                <td className="px-6 py-4 font-mono text-xs">{t.saleId}</td>
                                <td className="px-6 py-4"><span className="font-semibold">{t.method}</span></td>
                                <td className="px-6 py-4">{t.cashierName}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold">{formatCurrency(t.amount)}</td>
                            </tr>
                        ))}
                         {filteredTransactions.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">No transactions found for the selected criteria.</td></tr>
                        )}
                    </tbody>
                </table>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 text-sm border-t border-border dark:border-dark-border">
                        <ModernButton variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</ModernButton>
                        <span>Page {currentPage} of {totalPages}</span>
                        <ModernButton variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</ModernButton>
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default PaymentSummaryView;
