import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Customer, Permission, Sale, Settings } from '../types';
import CustomerDetailView from './customers/CustomerDetailView';
import CustomerModal from './customers/CustomerModal';
import ConfirmationModal from './common/ConfirmationModal';
import { ModernButton, ModernEmptyState, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from './common/ModernUI';

interface CustomersViewProps {
    customers: Customer[];
    sales: Sale[];
    onAddCustomer: (customer: Omit<Customer, 'id' | 'dateAdded' | 'loyaltyPoints'>) => void;
    onUpdateCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customerId: string) => void;
    permissions: Permission[];
    settings: Settings;
}

const icons = {
    customer: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    wallet: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 12h4v4h-4a2 2 0 1 1 0-4Z" /></svg>,
    loyalty: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.4 4.86L20 8.7l-4 3.9.94 5.48L12 15.9l-4.94 2.18L8 12.6l-4-3.9 5.6-.84L12 3Z" /></svg>,
    activity: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomersView: React.FC<CustomersViewProps> = ({ customers, sales, onAddCustomer, onUpdateCustomer, onDeleteCustomer, permissions, settings }) => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

    const canManage = permissions.includes('manage_customers');

    const customerData = useMemo(() => {
        return customers
            .map((customer) => {
                const customerSales = sales.filter((sale) => sale.customerId === customer.id);
                const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
                const lastPurchase = customerSales.length > 0
                    ? new Date(Math.max(...customerSales.map((sale) => new Date(sale.date).getTime())))
                    : null;

                return {
                    ...customer,
                    totalSpent,
                    orderCount: customerSales.length,
                    lastPurchase,
                };
            })
            .filter((customer) => {
                const query = searchTerm.toLowerCase();
                return (
                    customer.name.toLowerCase().includes(query) ||
                    customer.phone.toLowerCase().includes(query) ||
                    customer.email.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => b.totalSpent - a.totalSpent);
    }, [customers, sales, searchTerm]);

    const summary = useMemo(() => {
        const totalSpent = customerData.reduce((sum, customer) => sum + customer.totalSpent, 0);
        const totalPoints = customerData.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
        const activeCustomers = customerData.filter((customer) => customer.orderCount > 0).length;
        return { totalSpent, totalPoints, activeCustomers };
    }, [customerData]);

    const handleOpenModal = (customer?: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = (customerDataToSave: Omit<Customer, 'id' | 'dateAdded' | 'loyaltyPoints'> | Customer) => {
        if ('id' in customerDataToSave) {
            onUpdateCustomer(customerDataToSave as Customer);
        } else {
            onAddCustomer(customerDataToSave);
        }
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (deletingCustomer) {
            onDeleteCustomer(deletingCustomer.id);
            setDeletingCustomer(null);
        }
    };

    if (selectedCustomer) {
        const fullCustomerData = customerData.find((customer) => customer.id === selectedCustomer.id);
        return (
            <CustomerDetailView
                customer={fullCustomerData || selectedCustomer}
                sales={sales.filter((sale) => sale.customerId === selectedCustomer.id)}
                onBack={() => setSelectedCustomer(null)}
                settings={settings}
                onUpdateCustomer={onUpdateCustomer}
            />
        );
    }

    return (
        <ModernShell
            eyebrow="Customer Ledger"
            title="Customers"
            description="Track customer value, loyalty, and purchase recency from one cleaner workspace."
            actions={canManage ? (
                <ModernButton onClick={() => handleOpenModal()}>
                    {icons.plus}
                    Add Customer
                </ModernButton>
            ) : undefined}
        >
            <AnimatePresence>
                {isModalOpen && (
                    <CustomerModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveCustomer}
                        customer={editingCustomer}
                    />
                )}
                {deletingCustomer && (
                    <ConfirmationModal
                        title={`Delete ${deletingCustomer.name}?`}
                        message="Are you sure? This will remove the customer and all associated history. This action cannot be undone."
                        onConfirm={handleDelete}
                        onClose={() => setDeletingCustomer(null)}
                        confirmText="Delete"
                        isDestructive
                    />
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Total Customers" value={customerData.length} subtitle="Profiles currently on file" icon={icons.customer} accent="violet" />
                <ModernStatCard title="Active Buyers" value={summary.activeCustomers} subtitle="Customers with at least one sale" icon={icons.activity} accent="emerald" />
                <ModernStatCard title="Lifetime Spend" value={formatCurrency(summary.totalSpent)} subtitle="Aggregate value across visible customers" icon={icons.wallet} accent="blue" />
                <ModernStatCard title="Loyalty Points" value={summary.totalPoints.toLocaleString('en-KE')} subtitle="Points currently held by customers" icon={icons.loyalty} accent="amber" />
            </div>

            <ModernPanel>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <ModernSearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search customers by name, phone, or email..."
                    />
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                        {customerData.length} customer{customerData.length === 1 ? '' : 's'}
                    </div>
                </div>
            </ModernPanel>

            <ModernTableShell title="Customer Directory" description="Click any row to open the detailed customer ledger.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Points</th>
                            <th className="px-6 py-4">Total Spent</th>
                            <th className="px-6 py-4">Last Purchase</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {customerData.map((customer) => (
                            <tr
                                key={customer.id}
                                className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45"
                                onClick={() => setSelectedCustomer(customer)}
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{customer.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{customer.orderCount} order{customer.orderCount === 1 ? '' : 's'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    <div>{customer.phone}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{customer.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                                        {customer.loyaltyPoints.toLocaleString('en-KE')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(customer.totalSpent)}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' }) : 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                                    {canManage && customer.id !== 'cust001' ? (
                                        <div className="flex justify-end gap-2">
                                            <ModernButton variant="secondary" onClick={() => handleOpenModal(customer)} className="px-3 py-2">Edit</ModernButton>
                                            <ModernButton variant="danger" onClick={() => setDeletingCustomer(customer)} className="px-3 py-2">Delete</ModernButton>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-400">Locked</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {customerData.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No customers found." description="Adjust the search or add a new customer to get started." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default CustomersView;
