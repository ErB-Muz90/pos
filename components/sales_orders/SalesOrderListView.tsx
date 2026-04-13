import React, { useState, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SalesOrder } from '../../types';

interface SalesOrderListViewProps {
    salesOrders: SalesOrder[];
    onViewSalesOrder: (salesOrder: SalesOrder) => void;
    onCreateRequest: () => void;
}

const StatCard: React.FC<{ title: string; count: number; color: string }> = ({ title, count, color }) => (
    <div className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border-l-4 ${color}`}>
        <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
        <p className="text-3xl font-bold text-foreground dark:text-dark-foreground">{count}</p>
    </div>
);

const StatusBadge: React.FC<{ status: SalesOrder['status'] }> = ({ status }) => {
    let colorClasses = 'text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
    switch (status) {
        case 'Pending': 
        case 'Draft':
            colorClasses = 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300'; 
            break;
        case 'Ordered': 
        case 'Partially Received':
            colorClasses = 'text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300'; 
            break;
        case 'Ready': 
            colorClasses = 'text-indigo-800 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300'; 
            break;
        case 'Completed': 
            colorClasses = 'text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300'; 
            break;
        case 'Cancelled': 
            colorClasses = 'text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300'; 
            break;
    }
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colorClasses}`}>{status.replace('_', ' ').toLowerCase()}</span>;
};

const SalesOrderListView: React.FC<SalesOrderListViewProps> = ({ salesOrders, onViewSalesOrder, onCreateRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const summary = useMemo(() => {
        return salesOrders.reduce((acc, so) => {
            if (so.status === 'Pending' || so.status === 'Draft') acc.pending++;
            else if (so.status === 'Ready') acc.ready++;
            else if (so.status === 'Completed') acc.completed++;
            else if (so.status === 'Cancelled') acc.cancelled++;
            return acc;
        }, { pending: 0, ready: 0, completed: 0, cancelled: 0 });
    }, [salesOrders]);

    const filteredSalesOrders = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return salesOrders
            .filter(so => 
                so.id.toLowerCase().includes(lowerSearch) || 
                so.customerName.toLowerCase().includes(lowerSearch)
            )
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }, [salesOrders, searchTerm]);

    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Sales Orders</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Manage customer orders (All prices include VAT)</p>
                </div>
                <motion.button 
                    onClick={onCreateRequest}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-sm flex items-center mt-4 md:mt-0"
                >
                    + Create Sales Order
                </motion.button>
            </header>
            
            <main>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Pending" count={summary.pending} color="border-yellow-500" />
                    <StatCard title="Ready" count={summary.ready} color="border-indigo-500" />
                    <StatCard title="Completed" count={summary.completed} color="border-green-500" />
                    <StatCard title="Cancelled" count={summary.cancelled} color="border-red-500" />
                </div>
                
                <div className="bg-card dark:bg-dark-card rounded-lg shadow-sm">
                    <div className="p-4 flex justify-between items-center border-b border-border dark:border-dark-border">
                        <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">All Sales Orders</h2>
                         <div className="relative w-full max-w-xs">
                            <input
                                type="text"
                                placeholder="Search by SO# or Customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground-muted absolute top-1/2 left-3 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">SO Number</th>
                                    <th className="px-6 py-3 font-semibold">Customer</th>
                                    <th className="px-6 py-3 font-semibold">Order Date</th>
                                    <th className="px-6 py-3 font-semibold text-right">Total (incl. VAT)</th>
                                    <th className="px-6 py-3 font-semibold text-right">Balance Due</th>
                                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-dark-border">
                                {filteredSalesOrders.map(so => (
                                    <tr key={so.id} className="hover:bg-muted dark:hover:bg-dark-muted/50 cursor-pointer" onClick={() => onViewSalesOrder(so)}>
                                        <td className="px-6 py-3 font-bold text-foreground dark:text-dark-foreground">{so.id}</td>
                                        <td className="px-6 py-3">{so.customerName}</td>
                                        <td className="px-6 py-3">{new Date(so.createdDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 font-mono text-right">{so.total.toFixed(2)}</td>
                                        <td className="px-6 py-3 font-mono text-right font-semibold text-danger">{so.balance.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-center"><StatusBadge status={so.status} /></td>
                                        <td className="px-6 py-3 text-center">
                                            <button className="p-1 hover:bg-border dark:hover:bg-dark-border rounded-full" title="View Details">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.064 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSalesOrders.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-10">No sales orders found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesOrderListView;