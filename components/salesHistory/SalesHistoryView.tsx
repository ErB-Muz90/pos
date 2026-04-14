import React, { useMemo, useState } from 'react';
import { Customer, Sale, User } from '../../types';
import { ModernButton, ModernEmptyState, ModernInput, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface SalesHistoryViewProps {
    sales: Sale[];
    customers: Customer[];
    users: User[];
    onViewSaleRequest: (sale: Sale) => void;
}

const ITEMS_PER_PAGE = 15;

const icons = {
    receipt: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v14l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h6M16 3v4h4" /></svg>,
    revenue: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="5" width="18" height="16" rx="2" /></svg>,
};

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ sales, customers, onViewSaleRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.name])), [customers]);

    const filteredSales = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = dateTo ? new Date(dateTo) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return sales
            .filter((sale) => {
                const saleDate = new Date(sale.date);
                if (start && saleDate < start) return false;
                if (end && saleDate > end) return false;
                return true;
            })
            .filter((sale) => {
                const query = searchTerm.toLowerCase();
                const customerName = customerMap.get(sale.customerId) || '';
                return (
                    sale.id.toLowerCase().includes(query) ||
                    customerName.toLowerCase().includes(query) ||
                    sale.cashierName.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, searchTerm, dateFrom, dateTo, customerMap]);

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSales, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE));

    const summary = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total + (sale.depositApplied || 0), 0);
        return {
            totalRevenue,
            transactionCount: filteredSales.length,
            averageTicket: filteredSales.length ? totalRevenue / filteredSales.length : 0,
        };
    }, [filteredSales]);

    return (
        <ModernShell
            eyebrow="Transaction Archive"
            title="Sales History"
            description="Search completed transactions, narrow by date range, and review every receipt in the updated POS style."
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ModernStatCard title="Total Revenue" value={`Ksh ${summary.totalRevenue.toFixed(2)}`} subtitle="Revenue within the active filter" icon={icons.revenue} accent="emerald" />
                <ModernStatCard title="Transactions" value={summary.transactionCount} subtitle="Receipts found for the current filter" icon={icons.receipt} accent="violet" />
                <ModernStatCard title="Average Ticket" value={`Ksh ${summary.averageTicket.toFixed(2)}`} subtitle="Average spend per transaction" icon={icons.calendar} accent="blue" />
            </div>

            <ModernPanel>
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.6fr_0.6fr]">
                    <ModernSearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by ID, customer, or cashier..." />
                    <ModernInput type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    <ModernInput type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                </div>
            </ModernPanel>

            <ModernTableShell
                title="Receipt Timeline"
                description="Every receipt is clickable for full detail."
                actions={<span className="text-sm text-slate-500 dark:text-slate-400">{filteredSales.length} record{filteredSales.length === 1 ? '' : 's'}</span>}
            >
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Receipt ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Cashier</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {paginatedSales.map((sale) => (
                            <tr key={sale.id} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45" onClick={() => onViewSaleRequest(sale)}>
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">{sale.id}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(sale.date).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{customerMap.get(sale.customerId) || 'Unknown'}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{sale.cashierName}</td>
                                <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{(sale.total + (sale.depositApplied || 0)).toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                    <ModernButton variant="secondary" onClick={() => onViewSaleRequest(sale)} className="px-3 py-2">View</ModernButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSales.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No sales found." description="Change the date range or search term to locate more receipts." />
                    </div>
                )}

                {filteredSales.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-200/80 px-6 py-4 dark:border-white/10">
                        <ModernButton variant="secondary" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</ModernButton>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                        <ModernButton variant="secondary" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</ModernButton>
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default SalesHistoryView;
