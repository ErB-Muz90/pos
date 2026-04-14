import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Expense, Sale, Settings, Shift, Supplier, SupplierInvoice, SupplierPayment } from '../types';
import PaymentModal from './accountsPayable/PaymentModal';
import { ModernButton, ModernEmptyState, ModernShell, ModernStatCard, ModernTableShell } from './common/ModernUI';

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

const icons = {
    current: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M3 10h18" /></svg>,
    overdue: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    alert: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>,
    severe: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" /></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
};

const StatusBadge = ({ status }: { status: SupplierInvoice['status'] }) => {
    const styles = {
        Paid: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        'Partially Paid': 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Unpaid: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    } as const;

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
};

const AccountsPayableView = ({ invoices, suppliers, onRecordPayment, onViewInvoice, activeShift, settings, availableFunds }: AccountsPayableViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

    const supplierMap = useMemo(() => {
        return suppliers.reduce((acc, supplier) => {
            acc[supplier.id] = supplier.businessName || supplier.name;
            return acc;
        }, {} as Record<string, string>);
    }, [suppliers]);

    const agingData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const buckets = { current: 0, due1_30: 0, due31_60: 0, due60_plus: 0 };

        invoices.forEach((invoice) => {
            if (invoice.status === 'Paid') return;
            const amountDue = invoice.totalAmount - invoice.paidAmount;
            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
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
            .filter((invoice) => invoice.status === 'Unpaid' || invoice.status === 'Partially Paid')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [invoices]);

    const handleRecordPaymentClick = (invoice: SupplierInvoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleSavePayment = (payment: Omit<SupplierPayment, 'id' | 'invoiceId' | 'processedById' | 'processedByName' | 'shiftId'>) => {
        if (selectedInvoice) {
            onRecordPayment(selectedInvoice.id, payment);
        }
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };

    const formatCurrency = (amount: number) => `${settings.businessInfo.currency || 'Ksh'} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <ModernShell
            eyebrow="Supplier Finance"
            title="Accounts Payable"
            description="Review aged payables, inspect open supplier invoices, and record payments without leaving the updated finance workspace."
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Current" value={formatCurrency(agingData.current)} subtitle="Invoices not yet overdue" icon={icons.current} accent="emerald" />
                <ModernStatCard title="Overdue 1-30 Days" value={formatCurrency(agingData.due1_30)} subtitle="Short-term overdue amount" icon={icons.overdue} accent="amber" />
                <ModernStatCard title="Overdue 31-60 Days" value={formatCurrency(agingData.due31_60)} subtitle="Escalating supplier exposure" icon={icons.alert} accent="rose" />
                <ModernStatCard title="Overdue 60+ Days" value={formatCurrency(agingData.due60_plus)} subtitle="Critical payable pressure" icon={icons.severe} accent="slate" />
            </div>

            <ModernTableShell
                title="Outstanding Supplier Invoices"
                description="Click a row to inspect invoice detail, or record a payment directly."
                actions={<span className="text-sm text-slate-500 dark:text-slate-400">{unpaidInvoices.length} open invoice{unpaidInvoices.length === 1 ? '' : 's'}</span>}
            >
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Amount Due</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {unpaidInvoices.map((invoice) => {
                            const amountDue = invoice.totalAmount - invoice.paidAmount;
                            return (
                                <tr key={invoice.id} onClick={() => onViewInvoice(invoice)} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplierMap[invoice.supplierId] || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(invoice.dueDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(amountDue)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                                    <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                                        {invoice.status !== 'Paid' ? (
                                            <ModernButton variant="secondary" onClick={() => handleRecordPaymentClick(invoice)} className="px-3 py-2">
                                                Record Payment
                                            </ModernButton>
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {unpaidInvoices.length === 0 && (
                    <div className="p-10 text-center">
                        {icons.check}
                        <div className="mt-4">
                            <ModernEmptyState title="All caught up." description="There are no outstanding supplier invoices right now." />
                        </div>
                    </div>
                )}
            </ModernTableShell>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernStatCard title="Cash Available" value={formatCurrency(availableFunds.Cash || 0)} subtitle="Current AP-available cash source" icon={icons.current} accent="emerald" />
                <ModernStatCard title="M-Pesa Available" value={formatCurrency(availableFunds['M-Pesa'] || 0)} subtitle="Current M-Pesa available funds" icon={icons.overdue} accent="blue" />
                <ModernStatCard title="Bank Transfer Available" value={formatCurrency(availableFunds['Bank Transfer'] || 0)} subtitle="Funds available for transfer payments" icon={icons.alert} accent="violet" />
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
        </ModernShell>
    );
};

export default AccountsPayableView;
