import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Permission, Product, PurchaseOrder, Settings, StockMovement, Supplier } from '../types';
import ProductModal from './inventory/ProductModal';
import ExportInventoryModal, { ExportableField } from './inventory/ExportInventoryModal';
import StockAdjustmentModal from './inventory/StockAdjustmentModal';
import StockMovementHistory from './inventory/StockMovementHistory';
import { ModernButton, ModernEmptyState, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from './common/ModernUI';

interface InventoryViewProps {
    products: Product[];
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    onAddProduct: (product: Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>) => Promise<Product>;
    onUpdateProduct: (product: Product) => void;
    onDeleteProductRequest: (product: Product) => void;
    permissions: Permission[];
    onImportProducts: (file: File) => void;
    onPrintBarcodeRequest: (product: Product) => void;
    onAddToPORequest: (product: Product) => void;
    onStockAdjust: (productId: string, quantity: number, type: string, reason: string) => Promise<void>;
    stockMovements: StockMovement[];
    settings: Settings;
}

const icons = {
    box: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12 4 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12l8-4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-9" /></svg>,
    alert: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>,
    cash: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>,
    trend: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m4 14 5-5 4 4 7-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 10V6h-4" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
    upload: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" /></svg>,
    download: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" /></svg>,
    barcode: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 7v10M9 7v10M15 7v10M19 7v10M12 7v10" /></svg>,
    history: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.05 13A9 9 0 1 0 6 6.3L3 8" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l4 2" /></svg>,
    edit: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" /></svg>,
    adjust: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" /></svg>,
};

const InventoryView = ({ products, onAddProduct, onUpdateProduct, onDeleteProductRequest, permissions, onImportProducts, onPrintBarcodeRequest, onAddToPORequest, onStockAdjust, stockMovements, settings }: InventoryViewProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | undefined>(undefined);
    const [historyProduct, setHistoryProduct] = useState<Product | undefined>(undefined);
    const importInputRef = useRef<HTMLInputElement>(null);

    const canEdit = permissions.includes('edit_inventory');
    const canDelete = permissions.includes('delete_inventory');

    const filteredProducts = useMemo(() => {
        return products
            .filter((product) => {
                const query = searchTerm.toLowerCase();
                return (
                    product.name.toLowerCase().includes(query) ||
                    product.inventoryCode.toLowerCase().includes(query) ||
                    (product.upc && product.upc.toLowerCase().includes(query))
                );
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products, searchTerm]);

    const lowStockThreshold = settings.inventory?.lowStockThreshold ?? 10;
    const inventoryProducts = useMemo(() => products.filter((product) => product.productType === 'Inventory'), [products]);
    const lowStockItemsCount = inventoryProducts.filter((product) => product.stock <= lowStockThreshold).length;
    const totalStockValue = inventoryProducts.reduce((sum, product) => sum + ((product.costPrice || 0) * product.stock), 0);
    const potentialRetailValue = inventoryProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);

    const formatCurrency = (amount: number) => `${settings.businessInfo.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleNewClick = () => {
        setEditingProduct(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (productData: Product | Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>) => {
        if ('id' in productData) {
            onUpdateProduct(productData as Product);
        } else {
            await onAddProduct(productData as Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>);
        }
        setIsModalOpen(false);
        setEditingProduct(undefined);
    };

    const handleImportClick = () => importInputRef.current?.click();

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportProducts(file);
        }
    };

    const handleExport = (selectedFields: ExportableField[], format: 'csv' | 'xls') => {
        const headers = selectedFields;
        const data = products.map((product) => selectedFields.map((field) => {
            const value = product[field as keyof Product];
            if (value === undefined || value === null) return '';
            return String(value).replace(/"/g, '""');
        }));

        const triggerDownload = (content: string, contentType: string, fileName: string) => {
            const blob = new Blob([content], { type: contentType });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        if (format === 'csv') {
            const csvContent = [headers.join(','), ...data.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
            triggerDownload(csvContent, 'text/csv;charset=utf-8;', 'inventory.csv');
        } else {
            const template = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Inventory</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
                <body><table>
                    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
                    <tbody>${data.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
                </table></body></html>`;
            triggerDownload(template, 'application/vnd.ms-excel', 'inventory.xls');
        }
        setIsExportModalOpen(false);
    };

    return (
        <ModernShell
            eyebrow="Stock Control"
            title="Inventory"
            description="Manage products, monitor low-stock risk, and keep adjustments and history within the same cleaner workflow."
            actions={
                <>
                    <input type="file" ref={importInputRef} className="hidden" accept=".csv" onChange={handleFileSelected} />
                    <ModernButton variant="secondary" onClick={handleImportClick}>{icons.upload}Import</ModernButton>
                    <ModernButton variant="secondary" onClick={() => setIsExportModalOpen(true)}>{icons.download}Export</ModernButton>
                    {canEdit ? <ModernButton onClick={handleNewClick}>{icons.plus}Add Product</ModernButton> : null}
                </>
            }
        >
            <AnimatePresence>
                {isModalOpen && (
                    <ProductModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveProduct}
                        product={editingProduct}
                        settings={settings}
                        products={products}
                    />
                )}
                {isExportModalOpen && <ExportInventoryModal onClose={() => setIsExportModalOpen(false)} onExport={handleExport} />}
                {adjustingProduct && <StockAdjustmentModal product={adjustingProduct} onClose={() => setAdjustingProduct(undefined)} onAdjust={onStockAdjust} />}
                {historyProduct && <StockMovementHistory product={historyProduct} movements={stockMovements.filter((movement) => movement.productId === historyProduct.id)} onClose={() => setHistoryProduct(undefined)} />}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Total Products" value={products.length} subtitle="Active products and services" icon={icons.box} accent="blue" />
                <ModernStatCard title="Low Stock Items" value={lowStockItemsCount} subtitle={`At or below threshold of ${lowStockThreshold}`} icon={icons.alert} accent="amber" />
                <ModernStatCard title="Stock Value" value={formatCurrency(totalStockValue)} subtitle="Inventory value at cost" icon={icons.cash} accent="emerald" />
                <ModernStatCard title="Retail Potential" value={formatCurrency(potentialRetailValue)} subtitle="Sell-through value at current price" icon={icons.trend} accent="violet" />
            </div>

            <ModernPanel>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <ModernSearchInput
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search products by name, SKU, or barcode..."
                    />
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                        {filteredProducts.length} match{filteredProducts.length === 1 ? '' : 'es'}
                    </div>
                </div>
            </ModernPanel>

            <ModernTableShell title="Product Register" description="Track stock position, movement access, and direct actions from a single table.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{product.productType}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{product.inventoryCode}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{product.category}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(product.price)}</td>
                                <td className="px-6 py-4">
                                    {product.productType === 'Service' ? (
                                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">Service</span>
                                    ) : (
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.stock <= 0 ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300' : product.stock <= lowStockThreshold ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'}`}>
                                            {product.stock} {product.unitOfMeasure === 'pc(s)' ? `piece${product.stock === 1 ? '' : 's'}` : product.unitOfMeasure}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="rounded-full bg-slate-900/6 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">Active</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        {canEdit && product.productType === 'Inventory' ? <ModernButton variant="secondary" onClick={() => setAdjustingProduct(product)} className="px-3 py-2">{icons.adjust}</ModernButton> : null}
                                        {product.productType === 'Inventory' ? <ModernButton variant="secondary" onClick={() => setHistoryProduct(product)} className="px-3 py-2">{icons.history}</ModernButton> : null}
                                        {product.productType === 'Inventory' ? <ModernButton variant="secondary" onClick={() => onPrintBarcodeRequest(product)} className="px-3 py-2">{icons.barcode}</ModernButton> : null}
                                        {canEdit ? <ModernButton variant="secondary" onClick={() => handleEditClick(product)} className="px-3 py-2">{icons.edit}</ModernButton> : null}
                                        {canEdit && product.productType === 'Inventory' ? <ModernButton variant="secondary" onClick={() => onAddToPORequest(product)} className="px-3 py-2">{icons.plus}</ModernButton> : null}
                                        {canDelete ? <ModernButton variant="danger" onClick={() => onDeleteProductRequest(product)} className="px-3 py-2">{icons.trash}</ModernButton> : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredProducts.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No products found." description="Adjust the search or add a new product to populate inventory." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default InventoryView;
