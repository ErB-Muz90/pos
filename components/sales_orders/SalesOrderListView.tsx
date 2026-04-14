import React, { useMemo, useState } from 'react';
import { SalesOrder } from '../../types';
import { ModernButton, ModernEmptyState, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface SalesOrderListViewProps {
    salesOrders: SalesOrder[];
    onViewSalesOrder: (salesOrder: SalesOrder) => void;
    onCreateRequest: () => void;
}

const StatusBadge: React.FC<{ status: SalesOrder['status'] }> = ({ status }) => {
    const map = {
        Pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        Draft: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        Ordered: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        'Partially Received': 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Ready: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
        Completed: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        Cancelled: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    } as const;
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>{status}</span>;
};

const icons = {
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    ready: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>,
    completed: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m4 14 5-5 4 4 7-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 10V6h-4" /></svg>,
    cancelled: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const SalesOrderListView: React.FC<SalesOrderListViewProps> = ({ salesOrders, onViewSalesOrder, onCreateRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const summary = useMemo(() => {
        return salesOrders.reduce((acc, order) => {
            if (order.status === 'Pending' || order.status === 'Draft') acc.pending++;
            else if (order.status === 'Ready') acc.ready++;
            else if (order.status === 'Completed') acc.completed++;
            else if (order.status === 'Cancelled') acc.cancelled++;
            return acc;
        }, { pending: 0, ready: 0, completed: 0, cancelled: 0 });
    }, [salesOrders]);

    const filteredSalesOrders = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return salesOrders
            .filter((order) => order.id.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query))
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }, [salesOrders, searchTerm]);

    return (
        <ModernShell
            eyebrow="Order Fulfillment"
            title="Sales Orders"
            description="Manage customer orders, follow balances due, and move open orders through fulfillment with the updated POS layout."
            actions={<ModernButton onClick={onCreateRequest}>{icons.plus}Create Sales Order</ModernButton>}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Pending" value={summary.pending} subtitle="Orders not yet fulfilled" icon={icons.pending} accent="amber" />
                <ModernStatCard title="Ready" value={summary.ready} subtitle="Orders ready for pickup or invoicing" icon={icons.ready} accent="blue" />
                <ModernStatCard title="Completed" value={summary.completed} subtitle="Orders fully closed" icon={icons.completed} accent="emerald" />
                <ModernStatCard title="Cancelled" value={summary.cancelled} subtitle="Orders no longer active" icon={icons.cancelled} accent="rose" />
            </div>

            <ModernPanel>
                <ModernSearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by SO# or customer..." />
            </ModernPanel>

            <ModernTableShell title="Sales Order Register" description="Open any order to review line items, fulfillment status, and balance due.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">SO Number</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Order Date</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Balance Due</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {filteredSalesOrders.map((order) => (
                            <tr key={order.id} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45" onClick={() => onViewSalesOrder(order)}>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{order.id}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{order.customerName}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(order.createdDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{order.total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-semibold text-rose-600 dark:text-rose-300">{order.balance.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center"><StatusBadge status={order.status} /></td>
                                <td className="px-6 py-4 text-right">
                                    <ModernButton variant="secondary" onClick={() => onViewSalesOrder(order)} className="px-3 py-2">View</ModernButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredSalesOrders.length === 0 && <div className="p-6"><ModernEmptyState title="No sales orders found." description="Create a sales order or broaden the search." /></div>}
            </ModernTableShell>
        </ModernShell>
    );
};

export default SalesOrderListView;
