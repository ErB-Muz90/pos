import React, { useState, useMemo } from 'react';
import { Customer, Settings, SalesOrder, Shift, SalesOrderItem, Product } from '../../types';
import { motion } from 'framer-motion';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';

interface NewSalesOrderViewProps {
    products: Product[];
    customers: Customer[];
    settings: Settings;
    onAddSalesOrder: (salesOrderData: Omit<SalesOrder, 'id' | 'balance' | 'cashierId' | 'cashierName' | 'shiftId'>) => Promise<SalesOrder>;
    onBack: () => void;
    activeShift: Shift | null;
}

const NewSalesOrderView: React.FC<NewSalesOrderViewProps> = ({ products, customers, settings, onAddSalesOrder, onBack, activeShift }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers.find(c => c.id !== 'cust001')?.id || customers[0]?.id || '');
    const [items, setItems] = useState<Omit<SalesOrderItem, 'status' | 'quantityReceived'>[]>([]);
    const [deposit, setDeposit] = useState<number | ''>('');
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // Default 7 days
        return date.toISOString().split('T')[0];
    });
    const [notes, setNotes] = useState('');
    
    const [productSearch, setProductSearch] = useState('');
    const [error, setError] = useState('');

    const searchResults = useMemo(() => {
        if (!productSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5);
    }, [productSearch, products]);

    const handleAddProduct = (product: Product, quantity: number = 1, unitPrice?: number) => {
        setItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                return [...prevItems, {
                    id: crypto.randomUUID(),
                    description: product.name,
                    quantity: quantity,
                    unitPrice: unitPrice ?? product.price,
                    pricingType: 'inclusive',
                    productId: product.id,
                }];
            }
        });
        setProductSearch('');
    };
    
    const handleUpdateItem = (id: string, field: 'quantity' | 'unitPrice', value: number) => {
        if (isNaN(value)) return;
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };
    
    const { subtotalExcl, vatAmount, totalIncl } = useMemo(() => {
        const vatRate = settings.tax.vatRate / 100;
        const totalGross = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const totalNet = totalGross / (1 + vatRate);
        const totalVat = totalGross - totalNet;
        return { totalIncl: totalGross, subtotalExcl: totalNet, vatAmount: totalVat };
    }, [items, settings.tax.vatRate]);

    const handleCreateSalesOrder = async () => {
        setError('');
        if (!selectedCustomerId) {
            setError('Please select a customer.');
            return;
        }
        if (items.length === 0) {
            setError('Please add at least one item.');
            return;
        }

        const fullItems: SalesOrderItem[] = items.map(item => ({
            ...item,
            status: 'Pending',
            quantityReceived: 0,
        }));

        try {
            await onAddSalesOrder({
                customerId: selectedCustomerId,
                customerName: customers.find(c => c.id === selectedCustomerId)?.name || 'Unknown',
                items: fullItems,
                total: totalIncl,
                deposit: Number(deposit) || 0,
                status: 'Pending',
                createdDate: new Date(),
                deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
                notes,
            });
        } catch (err) {
            console.error(err);
        }
    };
    
    if (!activeShift) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold">Shift Not Active</h1>
                <p className="mt-2 text-foreground-muted">You must start a shift to create a sales order.</p>
                <button onClick={onBack} className="mt-6 bg-primary text-primary-content font-bold py-2 px-6 rounded-lg">Back</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted h-full flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card dark:bg-dark-card w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[95vh]">
                <header className="p-4 border-b border-border dark:border-dark-border flex-shrink-0">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Create Sales Order</h2>
                </header>

                <main className="flex-grow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Left Column: Details & Items */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted">Customer *</label>
                                <SearchableCustomerDropdown customers={customers} selectedCustomerId={selectedCustomerId} onCustomerChange={setSelectedCustomerId} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted">Order Date</label>
                                <input type="date" value={new Date().toISOString().split('T')[0]} readOnly className="mt-1 w-full p-2 bg-muted dark:bg-dark-muted rounded-md border border-border dark:border-dark-border" />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-foreground-muted">Expected Delivery Date</label>
                                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 w-full p-2 bg-background dark:bg-dark-background rounded-md border border-border dark:border-dark-border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted">Deposit Amount (Optional)</label>
                                <input type="number" value={deposit} onChange={e => setDeposit(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full p-2 bg-background dark:bg-dark-background rounded-md border border-border dark:border-dark-border" />
                            </div>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-foreground-muted">Add Items (Prices include VAT)</label>
                             <div className="relative mt-1">
                                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search for products to add..." className="w-full p-2 pr-8 bg-background dark:bg-dark-background rounded-md border border-border dark:border-dark-border" />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground-muted absolute top-1/2 right-2.5 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                {searchResults.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                        {searchResults.map(p => (
                                            <li key={p.id} onClick={() => handleAddProduct(p)} className="px-3 py-2 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer text-sm">{p.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Item List & Summary */}
                    <div className="flex flex-col">
                        <div className="flex-grow space-y-2 overflow-y-auto -mr-2 pr-2">
                             {items.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-foreground-muted text-sm">Items added will appear here.</div>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm p-2 rounded-md bg-muted dark:bg-dark-muted">
                                        <div className="col-span-5 truncate font-semibold">{item.description}</div>
                                        <div className="col-span-2">
                                            <input type="number" value={item.quantity} onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))} className="w-full p-1 text-center bg-background dark:bg-dark-background border rounded" min="1" />
                                        </div>
                                         <div className="col-span-3">
                                            <input type="number" value={item.unitPrice} onChange={e => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))} className="w-full p-1 text-right bg-background dark:bg-dark-background border rounded" min="0" step="0.01"/>
                                        </div>
                                        <div className="col-span-1 font-mono text-right">{(item.quantity * item.unitPrice).toFixed(2)}</div>
                                        <div className="col-span-1 text-right">
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-danger">&times;</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 flex-shrink-0">
                            <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-foreground-muted">Subtotal (excl. VAT):</span> <span className="font-mono">{subtotalExcl.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-foreground-muted">VAT ({settings.tax.vatRate}% - included):</span> <span className="font-mono">{vatAmount.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t border-border dark:border-dark-border pt-2 mt-2"><span>Total (incl. VAT):</span> <span className="font-mono text-primary dark:text-dark-primary">{totalIncl.toFixed(2)}</span></div>
                            </div>
                             <div className="mt-2">
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes or special instructions..." rows={2} className="w-full p-2 bg-background dark:bg-dark-background rounded-md border border-border dark:border-dark-border text-sm"></textarea>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 border-t border-border dark:border-dark-border flex justify-end items-center gap-3 flex-shrink-0">
                    {error && <p className="text-sm text-danger mr-auto">{error}</p>}
                    <motion.button type="button" onClick={onBack} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg">Cancel</motion.button>
                    <motion.button type="button" onClick={handleCreateSalesOrder} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-lg">Create Sales Order</motion.button>
                </footer>
            </motion.div>
        </div>
    );
};

export default NewSalesOrderView;