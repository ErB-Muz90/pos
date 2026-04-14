import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Permission, Product, PurchaseOrder, PurchaseOrderData, PurchaseOrderItem, SalesOrder, Settings, Supplier, Supplier as TSupplier } from '../../types';
import CreatePOForm from './CreatePOForm';
import PODetailView from './PODetailView';
import PurchaseOrderDocument from './PurchaseOrderDocument';
import { ModernButton, ModernEmptyState, ModernInput, ModernPanel, ModernSearchInput, ModernSelect, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface PurchasesViewProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    permissions: Permission[];
    onReceivePORequest: (purchaseOrder: PurchaseOrder) => void;
    onAddPurchaseOrder: (poData: PurchaseOrderData) => Promise<PurchaseOrder>;
    onAddSupplier: (supplierData: Omit<TSupplier, 'id'>) => Promise<TSupplier | null>;
    onSendPO: (poId: string) => void;
    onWhatsAppPORequest: (poId: string, supplierId: string) => void;
    settings: Settings;
    salesOrderForPO: SalesOrder | null;
    onClearSalesOrderForPO: () => void;
}

type ViewMode = 'list' | 'create';

const StatusBadge = ({ status }: { status: PurchaseOrder['status'] }) => {
    const styles = {
        Received: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        'Partially Received': 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Sent: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
        Draft: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        Cancelled: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    } as const;

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
};

const icons = {
    po: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v14H4V3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h6" /></svg>,
    truck: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M10 17h4V5H2v12h3" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 8h4l4 4v5h-3" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="17.5" cy="17.5" r="1.5" /></svg>,
    alert: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
    download: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" /></svg>,
};

export const PurchasesView = ({ purchaseOrders, suppliers, products, onReceivePORequest, onAddPurchaseOrder, onAddSupplier, permissions, onSendPO, onWhatsAppPORequest, settings, salesOrderForPO, onClearSalesOrderForPO }: PurchasesViewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [prefilledItems, setPrefilledItems] = useState<Omit<PurchaseOrderItem, 'quantityReceived'>[] | null>(null);
    const [prefilledSalesOrderId, setPrefilledSalesOrderId] = useState<string | undefined>(undefined);
    const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrder['status'] | 'All'>('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const hiddenPdfRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (salesOrderForPO) {
            const itemsToOrder: Omit<PurchaseOrderItem, 'quantityReceived'>[] = salesOrderForPO.items
                .filter((item) => item.status === 'Pending')
                .map((item) => ({
                    productId: item.productId!,
                    productName: item.description,
                    quantity: item.quantity,
                    cost: products.find((product) => product.id === item.productId)?.costPrice || 0,
                    unitOfMeasure: products.find((product) => product.id === item.productId)?.unitOfMeasure || 'pc(s)',
                    salesOrderItemId: item.id,
                }));

            setPrefilledItems(itemsToOrder);
            setPrefilledSalesOrderId(salesOrderForPO.id);
            setViewMode('create');
            onClearSalesOrderForPO();
        }
    }, [salesOrderForPO, products, onClearSalesOrderForPO]);

    const supplierMap = useMemo(() => suppliers.reduce((acc, supplier) => {
        acc[supplier.id] = supplier.name;
        return acc;
    }, {} as Record<string, string>), [suppliers]);

    const filteredPOs = useMemo(() => {
        return purchaseOrders
            .filter((purchaseOrder) => {
                if (statusFilter !== 'All' && purchaseOrder.status !== statusFilter) return false;
                if (search) {
                    const query = search.toLowerCase();
                    const supplierName = (supplierMap[purchaseOrder.supplierId] || '').toLowerCase();
                    if (!purchaseOrder.poNumber.toLowerCase().includes(query) && !supplierName.includes(query)) return false;
                }
                if (dateFrom && new Date(purchaseOrder.createdDate) < new Date(dateFrom)) return false;
                if (dateTo && new Date(purchaseOrder.createdDate) > new Date(`${dateTo}T23:59:59`)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }, [purchaseOrders, statusFilter, search, dateFrom, dateTo, supplierMap]);

    const downloadPDF = useCallback(async (purchaseOrder: PurchaseOrder, event: React.MouseEvent) => {
        event.stopPropagation();
        setDownloadingId(purchaseOrder.id);
        try {
            const element = hiddenPdfRefs.current[purchaseOrder.id];
            if (!element) return;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const width = pdf.internal.pageSize.getWidth();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, (canvas.height * width) / canvas.width);
            pdf.save(`PurchaseOrder_${purchaseOrder.poNumber}.pdf`);
        } finally {
            setDownloadingId(null);
        }
    }, []);

    const canManage = permissions.includes('manage_purchases');
    const lowStockItems = useMemo(() => {
        const threshold = settings.inventory?.lowStockThreshold ?? 3;
        return products.filter((product) => product.productType === 'Inventory' && product.stock <= threshold);
    }, [products, settings.inventory?.lowStockThreshold]);

    const handleReorderQuantityChange = (productId: string, value: string) => {
        const quantity = parseInt(value, 10);
        setReorderQuantities((current) => ({ ...current, [productId]: Number.isNaN(quantity) || quantity < 0 ? 0 : quantity }));
    };

    const itemsToReorderCount = useMemo(() => Object.values(reorderQuantities).filter((quantity) => quantity > 0).length, [reorderQuantities]);
    const receivedCount = purchaseOrders.filter((purchaseOrder) => purchaseOrder.status === 'Received').length;

    const handleCreatePOForReorderItems = () => {
        const itemsToOrder: Omit<PurchaseOrderItem, 'quantityReceived'>[] = lowStockItems
            .filter((product) => (reorderQuantities[product.id] || 0) > 0)
            .map((product) => ({
                productId: product.id,
                productName: product.name,
                quantity: reorderQuantities[product.id],
                cost: product.costPrice || 0,
                unitOfMeasure: product.unitOfMeasure,
            }));

        if (!itemsToOrder.length) {
            alert('Please enter a quantity greater than 0 for at least one item.');
            return;
        }

        setPrefilledItems(itemsToOrder);
        setPrefilledSalesOrderId(undefined);
        setViewMode('create');
    };

    const handleCancelCreatePO = () => {
        setViewMode('list');
        setPrefilledItems(null);
        setPrefilledSalesOrderId(undefined);
    };

    const handleSavePO = async (purchaseOrderData: PurchaseOrderData) => {
        const newPO = await onAddPurchaseOrder(purchaseOrderData);
        setViewMode('list');
        setPrefilledItems(null);
        setPrefilledSalesOrderId(undefined);
        setReorderQuantities({});
        setSelectedPO(newPO);
    };

    if (viewMode === 'create') {
        return (
            <CreatePOForm
                suppliers={suppliers}
                products={products}
                onSave={handleSavePO}
                onClose={handleCancelCreatePO}
                onAddSupplier={onAddSupplier}
                prefilledItems={prefilledItems || undefined}
                salesOrderId={prefilledSalesOrderId}
            />
        );
    }

    if (selectedPO) {
        return (
            <PODetailView
                purchaseOrder={selectedPO}
                supplier={suppliers.find((supplier) => supplier.id === selectedPO.supplierId)}
                onBack={() => setSelectedPO(null)}
                onWhatsAppRequest={onWhatsAppPORequest}
                products={products}
                settings={settings}
                onSendPO={onSendPO}
                onReceivePORequest={onReceivePORequest}
                canManage={canManage}
            />
        );
    }

    return (
        <ModernShell
            eyebrow="Procurement"
            title="Purchases"
            description="Purchase orders, low-stock reorder prompts, and receiving actions now share the same modern operations layout."
            actions={canManage ? <ModernButton onClick={() => { setPrefilledItems(null); setViewMode('create'); }}>{icons.plus}New Purchase Order</ModernButton> : undefined}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Purchase Orders" value={purchaseOrders.length} subtitle="All PO records in the system" icon={icons.po} accent="violet" />
                <ModernStatCard title="Received Orders" value={receivedCount} subtitle="POs fully received into stock" icon={icons.truck} accent="emerald" />
                <ModernStatCard title="Low Stock Alerts" value={lowStockItems.length} subtitle="Inventory lines needing reorder" icon={icons.alert} accent="amber" />
                <ModernStatCard title="Filtered Results" value={filteredPOs.length} subtitle="Records matching current filters" icon={icons.po} accent="blue" />
            </div>

            {canManage && lowStockItems.length > 0 && (
                <ModernPanel>
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Low Stock Reorder Queue</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Build a purchase order directly from low-stock items.</p>
                        </div>
                        <ModernButton onClick={handleCreatePOForReorderItems} disabled={itemsToReorderCount === 0}>
                            {icons.plus}
                            Create PO for {itemsToReorderCount > 0 ? `${itemsToReorderCount} Item(s)` : 'Items'}
                        </ModernButton>
                    </div>
                    <div className="space-y-3">
                        {lowStockItems.map((item) => (
                            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/45 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.inventoryCode} • Stock {item.stock}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={reorderQuantities[item.id] || 0}
                                        onChange={(event) => handleReorderQuantityChange(item.id, event.target.value)}
                                        className="w-28 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-center text-sm outline-none dark:border-white/10 dark:bg-slate-950/70"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </ModernPanel>
            )}

            <ModernTableShell
                title="Purchase Order Register"
                description="Search, filter, send, receive, and export purchase orders from one table."
                actions={<span className="text-sm text-slate-500 dark:text-slate-400">{filteredPOs.length} record{filteredPOs.length === 1 ? '' : 's'}</span>}
            >
                <div className="grid gap-3 border-b border-slate-200/80 px-6 py-5 dark:border-white/10 xl:grid-cols-[1.2fr_0.7fr_0.6fr_0.6fr_auto]">
                    <ModernSearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search PO # or supplier..." />
                    <ModernSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PurchaseOrder['status'] | 'All')}>
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Partially Received">Partially Received</option>
                        <option value="Received">Received</option>
                        <option value="Cancelled">Cancelled</option>
                    </ModernSelect>
                    <ModernInput type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    <ModernInput type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    {(search || statusFilter !== 'All' || dateFrom || dateTo) ? <ModernButton variant="secondary" onClick={() => { setSearch(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}>Clear</ModernButton> : <div />}
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">PO Number</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Total Cost</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {filteredPOs.map((purchaseOrder) => (
                            <tr key={purchaseOrder.id} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45" onClick={() => setSelectedPO(purchaseOrder)}>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{purchaseOrder.poNumber}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplierMap[purchaseOrder.supplierId] || 'Unknown'}</td>
                                <td className="px-6 py-4"><StatusBadge status={purchaseOrder.status} /></td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(purchaseOrder.createdDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{purchaseOrder.totalCost.toFixed(2)}</td>
                                <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                                    <div className="flex justify-end gap-2">
                                        {canManage && purchaseOrder.status === 'Draft' ? <ModernButton variant="secondary" onClick={() => onSendPO(purchaseOrder.id)} className="px-3 py-2">Send PO</ModernButton> : null}
                                        {canManage && (purchaseOrder.status === 'Sent' || purchaseOrder.status === 'Partially Received') ? <ModernButton variant="secondary" onClick={() => onReceivePORequest(purchaseOrder)} className="px-3 py-2">Receive Stock</ModernButton> : null}
                                        <motion.button
                                            onClick={(event) => downloadPDF(purchaseOrder, event)}
                                            disabled={downloadingId === purchaseOrder.id}
                                            whileTap={{ scale: downloadingId === purchaseOrder.id ? 1 : 0.98 }}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            {icons.download}
                                            {downloadingId === purchaseOrder.id ? 'Working...' : 'PDF'}
                                        </motion.button>
                                    </div>
                                    <div className="pointer-events-none fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
                                        <PurchaseOrderDocument
                                            ref={(element) => { hiddenPdfRefs.current[purchaseOrder.id] = element; }}
                                            purchaseOrder={purchaseOrder}
                                            supplier={suppliers.find((supplier) => supplier.id === purchaseOrder.supplierId)}
                                            products={products}
                                            settings={settings}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredPOs.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No purchase orders found." description="Create a new purchase order or relax the current filters." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};
