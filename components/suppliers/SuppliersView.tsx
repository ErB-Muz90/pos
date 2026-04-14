import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Permission, PurchaseOrder, Settings, Supplier, SupplierInvoice, SupplierPayment } from '../../types';
import SupplierModal from '../purchases/SupplierModal';
import ConfirmationModal from '../common/ConfirmationModal';
import SupplierStatementView from './SupplierStatementView';
import { useTheme } from '../../hooks/useTheme';
import { ModernButton, ModernEmptyState, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface SuppliersViewProps {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    supplierInvoices: SupplierInvoice[];
    supplierPayments: SupplierPayment[];
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<any>;
    onUpdateSupplier: (supplier: Supplier) => Promise<void>;
    onDeleteSupplier: (supplierId: string) => Promise<void>;
    permissions: Permission[];
    settings: Settings;
}

const icons = {
    supplier: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7l7-4 7 4v14" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6M9 15h6" /></svg>,
    invoice: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v14H4V3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 16h5" /></svg>,
    wallet: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="16" cy="12" r="1.5" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, purchaseOrders, supplierInvoices, supplierPayments, onAddSupplier, onUpdateSupplier, onDeleteSupplier, permissions, settings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStatementFor, setViewingStatementFor] = useState<Supplier | null>(null);
    const [theme] = useTheme();

    const canManage = permissions.includes('manage_suppliers');

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            const query = searchTerm.toLowerCase();
            return (
                supplier.name.toLowerCase().includes(query) ||
                (supplier.businessName && supplier.businessName.toLowerCase().includes(query)) ||
                supplier.contact.toLowerCase().includes(query)
            );
        });
    }, [suppliers, searchTerm]);

    const supplierBalances = useMemo(() => {
        const map: Record<string, number> = {};
        suppliers.forEach((supplier) => { map[supplier.id] = 0; });
        supplierInvoices.forEach((invoice) => {
            if (invoice.status !== 'Paid') {
                map[invoice.supplierId] = (map[invoice.supplierId] || 0) + (invoice.totalAmount - invoice.paidAmount);
            }
        });
        return map;
    }, [supplierInvoices, suppliers]);

    const summary = useMemo(() => {
        const totalOwed = Object.values(supplierBalances).reduce((sum, value) => sum + value, 0);
        const unpaidInvoices = supplierInvoices.filter((invoice) => invoice.status !== 'Paid').length;
        const topSuppliersData = suppliers
            .map((supplier) => ({
                name: supplier.businessName || supplier.name,
                value: supplierBalances[supplier.id] || 0,
            }))
            .filter((supplier) => supplier.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { totalOwed, unpaidInvoices, topSuppliersData };
    }, [supplierBalances, supplierInvoices, suppliers]);

    const chartColors = theme === 'dark'
        ? ['#34d399', '#60a5fa', '#fde047', '#c4b5fd', '#fca5a5']
        : ['#10b981', '#3b82f6', '#facc15', '#a78bfa', '#f87171'];

    const handleOpenModal = (supplier?: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleUpdateAndSave = async (supplierData: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplierData) {
            await onUpdateSupplier(supplierData);
        } else {
            await onAddSupplier(supplierData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        if (deletingSupplier) {
            await onDeleteSupplier(deletingSupplier.id);
            setDeletingSupplier(null);
        }
    };

    if (viewingStatementFor) {
        return (
            <SupplierStatementView
                supplier={viewingStatementFor}
                purchaseOrders={purchaseOrders.filter((purchaseOrder) => purchaseOrder.supplierId === viewingStatementFor.id)}
                supplierInvoices={supplierInvoices.filter((invoice) => invoice.supplierId === viewingStatementFor.id)}
                supplierPayments={supplierPayments.filter((payment) => supplierInvoices.some((invoice) => invoice.id === payment.invoiceId && invoice.supplierId === viewingStatementFor.id))}
                settings={settings}
                onBack={() => setViewingStatementFor(null)}
            />
        );
    }

    return (
        <ModernShell
            eyebrow="Vendor Control"
            title="Suppliers"
            description="Monitor supplier exposure, review unpaid balances, and manage vendor records with the same modern dashboard language."
            actions={canManage ? <ModernButton onClick={() => handleOpenModal()}>{icons.plus}Add Supplier</ModernButton> : undefined}
        >
            <AnimatePresence>
                {isModalOpen && <SupplierModal onClose={() => setIsModalOpen(false)} onSave={handleUpdateAndSave} supplier={editingSupplier} />}
                {deletingSupplier && (
                    <ConfirmationModal
                        title={`Delete ${deletingSupplier.name}?`}
                        message="Are you sure you want to permanently delete this supplier? This action cannot be undone."
                        confirmText="Delete"
                        onConfirm={handleDelete}
                        onClose={() => setDeletingSupplier(null)}
                        isDestructive
                    />
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Total Suppliers" value={suppliers.length} subtitle="Vendors currently on file" icon={icons.supplier} accent="violet" />
                <ModernStatCard title="Outstanding Balance" value={`Ksh ${summary.totalOwed.toFixed(2)}`} subtitle="Open amount still owed to suppliers" icon={icons.wallet} accent="rose" />
                <ModernStatCard title="Unpaid Invoices" value={summary.unpaidInvoices} subtitle="Supplier invoices not yet settled" icon={icons.invoice} accent="amber" />
                <ModernStatCard title="With Exposure" value={summary.topSuppliersData.length} subtitle="Suppliers currently carrying open balances" icon={icons.supplier} accent="blue" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <ModernPanel>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Search Suppliers</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Filter by supplier name, business name, or contact number.</p>
                    </div>
                    <ModernSearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name, business, or contact..." />
                </ModernPanel>

                <ModernPanel>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Top Exposure</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Largest outstanding supplier balances.</p>
                    </div>
                    {summary.topSuppliersData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={summary.topSuppliersData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={4}>
                                        {summary.topSuppliersData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => `Ksh ${Number(value).toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <ModernEmptyState title="No outstanding balances." description="Supplier exposure will appear here once unpaid invoices exist." />
                    )}
                </ModernPanel>
            </div>

            <ModernTableShell title="Supplier Ledger" description="Open statements, update vendor records, and review live balances.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Business Name</th>
                            <th className="px-6 py-4">Contact Person</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Amount Owed</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {filteredSuppliers.map((supplier) => {
                            const amountOwed = supplierBalances[supplier.id] || 0;
                            return (
                                <tr key={supplier.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{supplier.businessName || supplier.name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplier.name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplier.contact}</td>
                                    <td className={`px-6 py-4 font-semibold ${amountOwed > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-900 dark:text-white'}`}>{amountOwed.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <ModernButton variant="secondary" onClick={() => setViewingStatementFor(supplier)} className="px-3 py-2">View Statement</ModernButton>
                                            {canManage ? <ModernButton variant="secondary" onClick={() => handleOpenModal(supplier)} className="px-3 py-2">Edit</ModernButton> : null}
                                            {canManage ? <ModernButton variant="danger" onClick={() => setDeletingSupplier(supplier)} className="px-3 py-2">Delete</ModernButton> : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredSuppliers.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No suppliers found." description="Adjust the search or create a new supplier record." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default SuppliersView;
