import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SupplierInvoice, Supplier, SupplierPayment, Shift, Sale, Expense, Settings } from '../../types';
import PaymentModal from './PaymentModal';

interface AccountsPayableViewProps {
    invoices: SupplierInvoice[];
    suppliers: Supplier[];
    onRecordPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id' | 'invoiceId' | 'processedById' | 'processedByName' | 'shiftId'>) => void;
    onViewInvoice: (invoice: SupplierInvoice) => void;
    activeShift: Shift | null;
    sales: Sale[];
    payouts: Expense[];
    settings: Settings;
    availableFunds: { Cash: number; 'M-Pesa': number; 'Bank Transfer': number };
}

const StatCard = ({ title, value, color }: { title: string; value: string; color: string }) => (
    <motion.div 
        className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-dark border border-transparent dark:border-dark-border"
        whileHover={{ y: -3, scale: 1.02 }}
    >
        <p className={`text-sm font-bold ${color}`}>{title}</p>
        <p className="text-2xl font-bold text-foreground dark:text-dark-foreground mt-1">{value}</p>
    </motion.div>
);

const StatusBadge = ({ status }: { status: SupplierInvoice['status'] }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-bold rounded-md text-white/90";
    switch (status) {
        case 'Paid':
            return <span className={`${baseClasses} bg-primary`}>Paid</span>;
        case 'Partially Paid':
            return <span className={`${baseClasses} bg-blue-500`}>Partially Paid</span>;
        case 'Unpaid':
            return <span className={`${baseClasses} bg-warning`}>Unpaid</span>;
        default:
            return <span className={`${baseClasses} bg-slate-500`}>Unknown</span>;
    }
};

const AccountsPayableView = ({ invoices, suppliers, onRecordPayment, onViewInvoice, activeShift, sales, payouts, settings, availableFunds }: AccountsPayableViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
    const [activeTab, setActiveTab] = useState<'outstanding' | 'paid'>('outstanding');

    const supplierMap = useMemo(() => {
        return suppliers.reduce((acc, supplier) => {
            acc[supplier.id] = supplier.name;
            return acc;
        }, {} as Record<string, string>);
    }, [suppliers]);

    const agingData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const buckets = {
            current: 0,
            due1_30: 0,
            due31_60: 0,
            due60_plus: 0,
        };

        invoices.forEach(inv => {
            if (inv.status === 'Paid') return;
            
            const amountDue = inv.totalAmount - inv.paidAmount;
            const dueDate = new Date(inv.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
                const diffTime = today.getTime() - dueDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) buckets.due1_30 += amountDue;
                else if (diffDays <= 60) buckets.due31_60 += amountDue;
                else buckets.due60_plus += amountDue;
            } else {
                buckets.current += amountDue;
            }
        });
        return buckets;
    }, [invoices]);

    const unpaidInvoices = useMemo(() => {
        return invoices
            .filter(inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [invoices]);

    const paidInvoices = useMemo(() => {
        return invoices
            .filter(inv => inv.status === 'Paid')
            .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [invoices]);

    const handleRecordPaymentClick = (invoice: SupplierInvoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleSavePayment = (payment: Omit<SupplierPayment, 'id'|'invoiceId' | 'processedById' | 'processedByName' | 'shiftId'>) => {
        if(selectedInvoice) {
            onRecordPayment(selectedInvoice.id, payment);
        }
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };

    const formatCurrency = (amount: number) => `Ksh ${amount.toFixed(2)}`;

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-6">Accounts Payable</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Current" value={formatCurrency(agingData.current)} color="text-primary dark:text-dark-primary" />
                <StatCard title="Overdue 1-30 Days" value={formatCurrency(agingData.due1_30)} color="text-yellow-400" />
                <StatCard title="Overdue 31-60 Days" value={formatCurrency(agingData.due31_60)} color="text-warning dark:text-dark-warning" />
                <StatCard title="Overdue 60+ Days" value={formatCurrency(agingData.due60_plus)} color="text-danger dark:text-dark-danger" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border dark:border-dark-border mb-4">
                <button onClick={() => setActiveTab('outstanding')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'outstanding' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>
                    Outstanding ({unpaidInvoices.length})
                </button>
                <button onClick={() => setActiveTab('paid')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'paid' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>
                    Paid ({paidInvoices.length})
                </button>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-clay-dark overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Invoice #</th>
                            <th className="px-6 py-3 font-semibold">Supplier</th>
                            <th className="px-6 py-3 font-semibold">{activeTab === 'paid' ? 'Invoice Date' : 'Due Date'}</th>
                            <th className="px-6 py-3 font-semibold">Total</th>
                            <th className="px-6 py-3 font-semibold">{activeTab === 'paid' ? 'Paid' : 'Amount Due'}</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab === 'outstanding' ? (
                            unpaidInvoices.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-foreground-muted"><p className="font-semibold">All caught up!</p><p>There are no outstanding supplier invoices.</p></td></tr>
                            ) : unpaidInvoices.map(invoice => (
                                <tr key={invoice.id} onClick={() => onViewInvoice(invoice)} className="border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer">
                                    <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-foreground dark:text-dark-foreground">{supplierMap[invoice.supplierId] || 'Unknown'}</td>
                                    <td className="px-6 py-4">{new Date(invoice.dueDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                    <td className="px-6 py-4 font-mono">{formatCurrency(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-foreground dark:text-dark-foreground">{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={(e) => { e.stopPropagation(); handleRecordPaymentClick(invoice); }} className="font-medium text-primary dark:text-dark-primary hover:underline">
                                            Record Payment
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            paidInvoices.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-foreground-muted">No paid invoices yet.</td></tr>
                            ) : paidInvoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted dark:hover:bg-dark-muted">
                                    <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-foreground dark:text-dark-foreground">{supplierMap[invoice.supplierId] || 'Unknown'}</td>
                                    <td className="px-6 py-4">{new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                    <td className="px-6 py-4 font-mono">{formatCurrency(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-green-500">{formatCurrency(invoice.paidAmount)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onViewInvoice(invoice)} className="font-medium text-primary dark:text-dark-primary hover:underline flex items-center gap-1 ml-auto">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                                            View / Download
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <AnimatePresence>
                {isModalOpen && selectedInvoice && (
                    <PaymentModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSavePayment}
                        invoice={selectedInvoice}
                        supplierName={supplierMap[selectedInvoice.supplierId]}
                        activeShift={activeShift}
                        availableFunds={availableFunds}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountsPayableView;