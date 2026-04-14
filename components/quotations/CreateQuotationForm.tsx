import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Product, Settings, QuotationItem, QuotationData } from '../../types';
import { calculateCartTotals } from '../../utils/vatCalculator';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';
import { ModernButton, ModernEmptyState, ModernInput, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface CreateQuotationFormProps {
    customers: Customer[];
    products: Product[];
    settings: Settings;
    onSave: (quotationData: QuotationData, status: 'Draft' | 'Sent') => void;
    onCancel: () => void;
}

const CreateQuotationForm: React.FC<CreateQuotationFormProps> = ({ customers, products, settings, onSave, onCancel }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers.find(c => c.id !== 'cust001')?.id || '');
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const [expiryDate, setExpiryDate] = useState(defaultExpiry);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
    }, [searchTerm, products]);
    
    const productsByCategory = useMemo(() => {
        const categoryMap = new Map<string, Product[]>();
        products.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category)!.push(product);
        });
        for (const key of categoryMap.keys()) {
            categoryMap.get(key)!.sort((a, b) => a.name.localeCompare(b.name));
        }
        return Array.from(categoryMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [products]);

    const { subtotal, tax, total, discountAmount } = useMemo(() => {
        const { subtotal, tax, total, totalDiscountAmount } = calculateCartTotals(
            items,
            { type: 'percentage', value: 0 }, // No cart discount on quotes
            settings.tax.vatRate / 100
        );
        return { subtotal, tax, total, discountAmount: totalDiscountAmount };
    }, [items, settings.tax.vatRate]);

    const handleAddProduct = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
                pricingType: product.pricingType
            }];
        });
        setSearchTerm('');
    };

    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setItems(prev => prev.filter(i => i.productId !== productId));
        } else {
            setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: newQuantity } : i));
        }
    };

    const handleSave = (status: 'Draft' | 'Sent') => {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer || items.length === 0) {
            alert('Please select a customer and add at least one item.');
            return;
        }
        const quoteData: QuotationData = {
            customerId: selectedCustomerId,
            items,
            status,
            notes: notes.trim() || undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        };
        onSave(quoteData, status);
    };

    return (
        <ModernShell
            eyebrow="Sales Pipeline"
            title="Create Quotation"
            description="Build a customer quotation, browse stock by category, and send a polished quote without leaving the modern POS workspace."
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <ModernButton variant="secondary" onClick={onCancel}>Cancel</ModernButton>
                    <ModernButton variant="ghost" onClick={() => handleSave('Draft')}>Save as Draft</ModernButton>
                    <ModernButton onClick={() => handleSave('Sent')}>Create Quotation</ModernButton>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernStatCard title="Line Items" value={items.length} subtitle="Products currently on this quotation" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v14H4V3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h5" /></svg>} accent="violet" />
                <ModernStatCard title="Gross Subtotal" value={`Ksh ${subtotal.toFixed(2)}`} subtitle="Before VAT and discount impact" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.2 0-4 1.12-4 2.5S9.8 13 12 13s4 1.12 4 2.5S14.2 18 12 18s-4-1.12-4-2.5M12 6v12" /></svg>} accent="blue" />
                <ModernStatCard title="Quotation Total" value={`Ksh ${total.toFixed(2)}`} subtitle={`Valid until ${new Date(expiryDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 11h18" /></svg>} accent="emerald" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <ModernPanel className="space-y-4">
                        <div>
                            <label htmlFor="customer" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Customer</label>
                            <div className="mt-2 max-w-md">
                                <SearchableCustomerDropdown
                                    customers={customers}
                                    selectedCustomerId={selectedCustomerId}
                                    onCustomerChange={setSelectedCustomerId}
                                    filter={(customer) => customer.id !== 'cust001'}
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="product-search" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Add Product via Search</label>
                            <div className="mt-2">
                                <ModernSearchInput
                                    id="product-search"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Type to search products..."
                                />
                            </div>
                            {searchResults.length > 0 ? (
                                <ul className="absolute z-10 mt-2 w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-950 max-h-60">
                                    {searchResults.map((product) => (
                                        <li key={product.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleAddProduct(product)}
                                                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
                                            >
                                                <span className="text-slate-900 dark:text-white">{product.name}</span>
                                                <span className="font-semibold text-slate-500 dark:text-slate-400">Ksh {product.price.toFixed(2)}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    </ModernPanel>

                    <ModernPanel>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Browse Products by Category</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Expand a category to add products to the quotation in one click.</p>
                        <div className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto pr-2">
                            {productsByCategory.map(([category, categoryProducts]) => (
                                <div key={category} className="border-b border-slate-200/80 dark:border-white/10 last:border-b-0">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                        className="flex w-full items-center justify-between py-3 text-left font-semibold text-slate-900 dark:text-white"
                                        aria-expanded={expandedCategory === category}
                                    >
                                        <span>{category} ({categoryProducts.length})</span>
                                        <motion.div animate={{ rotate: expandedCategory === category ? 180 : 0 }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedCategory === category ? (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <ul className="space-y-1 pb-3">
                                                    {categoryProducts.map((product) => (
                                                        <li key={product.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddProduct(product)}
                                                                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-950/60"
                                                            >
                                                                <span className="text-sm text-slate-700 dark:text-slate-200">{product.name}</span>
                                                                <span className="text-sm font-semibold text-violet-600 dark:text-violet-300">Ksh {product.price.toFixed(2)}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </ModernPanel>

                    <ModernTableShell title="Quotation Items" description="Adjust quantities before saving or sending the quotation.">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4 text-center">Quantity</th>
                                    <th className="px-6 py-4 text-right">Unit Price</th>
                                    <th className="px-6 py-4 text-right">Line Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                                {items.map((item) => (
                                    <tr key={item.productId}>
                                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{item.productName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <ModernInput
                                                type="number"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(event) => handleUpdateQuantity(item.productId, parseInt(event.target.value, 10) || 0)}
                                                className="mx-auto w-20 text-center"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">{item.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 dark:text-white">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {items.length === 0 ? (
                            <div className="p-6">
                                <ModernEmptyState title="No items added yet." description="Search or browse products to start building this quotation." />
                            </div>
                        ) : null}
                    </ModernTableShell>
                </div>

                <div className="lg:col-span-1">
                    <ModernPanel className="sticky top-6 space-y-4">
                        <h3 className="text-xl font-bold text-slate-950 dark:text-white">Summary</h3>
                        <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Gross Subtotal</span><span className="font-semibold font-mono text-slate-900 dark:text-white">Ksh {subtotal.toFixed(2)}</span></div>
                        {discountAmount > 0 ? (
                            <div className="flex justify-between text-sm text-rose-600 dark:text-rose-300"><span>Discounts</span><span className="font-semibold font-mono">- Ksh {discountAmount.toFixed(2)}</span></div>
                        ) : null}
                        <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">VAT ({settings.tax.vatRate}%)</span><span className="font-semibold font-mono text-slate-900 dark:text-white">Ksh {tax.toFixed(2)}</span></div>
                        <div className="flex justify-between border-t border-slate-200/80 pt-4 text-xl font-bold dark:border-white/10"><span className="text-slate-950 dark:text-white">Total</span><span className="font-mono text-violet-600 dark:text-violet-300">Ksh {total.toFixed(2)}</span></div>

                        <div className="space-y-3 border-t border-slate-200/80 pt-4 dark:border-white/10">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Valid Until</label>
                                <ModernInput
                                    type="date"
                                    value={expiryDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(event) => setExpiryDate(event.target.value)}
                                    className="mt-2 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Notes / Terms</label>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    rows={4}
                                    placeholder="Payment terms, special conditions..."
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white resize-none"
                                />
                            </div>
                        </div>
                    </ModernPanel>
                </div>
            </div>
        </ModernShell>
    );
};

export default CreateQuotationForm;
