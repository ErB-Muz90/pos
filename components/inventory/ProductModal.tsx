import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Product, Settings, CategoryInfo } from '../../types';

interface ProductModalProps {
    onClose: () => void;
    onSave: (product: Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'> | Product) => void;
    product?: Product;
    settings: Settings;
    products: Product[];
}

export const ProductModal: React.FC<ProductModalProps> = ({ onClose, onSave, product, settings, products }) => {
    const isEditMode = Boolean(product);
    
    const [formData, setFormData] = useState({
        name: '',
        upc: '',
        description: '',
        category: 'Uncategorized',
        price: 0,
        pricingType: settings.tax.pricingType,
        productType: 'Inventory' as 'Inventory' | 'Service',
        costPrice: 0,
        unitOfMeasure: 'pc(s)',
        imageUrl: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                upc: product.upc || '',
                description: product.description || '',
                category: product.category,
                price: product.price,
                pricingType: product.pricingType,
                productType: product.productType,
                costPrice: product.costPrice || 0,
                unitOfMeasure: product.unitOfMeasure || 'pc(s)',
                imageUrl: product.imageUrl || '',
            });
        }
    }, [product]);

    const { profitMargin, grossProfit } = useMemo(() => {
        const { price, costPrice } = formData;
        if (costPrice <= 0 || price <= 0) {
            return { profitMargin: 0, grossProfit: 0 };
        }
        const vatRate = settings.tax.vatRate / 100;
        const taxablePrice = price / (1 + vatRate);
        const profit = taxablePrice - costPrice;
        const margin = (profit / costPrice) * 100;
        return { profitMargin: margin, grossProfit: profit };
    }, [formData.price, formData.costPrice, settings.tax.vatRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['price', 'costPrice'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode && product) {
            onSave({ ...product, ...formData });
        } else {
            onSave(formData);
        }
    };
    
    const definedCategories = settings.inventory?.definedCategories || [];
    const labelClasses = "block text-sm font-medium text-white/72";
    const inputClasses = "mt-1 w-full rounded-xl border border-white/8 bg-[#111317] p-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-500/25";
    const readOnlyClasses = "mt-1 w-full rounded-xl border border-white/6 bg-[#17191f] p-3 text-white/70";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/8 bg-[#0f1115] shadow-[0_24px_80px_-48px_rgba(0,0,0,1)]"
            >
                 <div className="flex items-center justify-between border-b border-white/8 p-6">
                    <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="text-white/45 hover:text-white">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                     <div>
                        <label className={labelClasses}>Product Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter product name" className={inputClasses} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className={labelClasses}>Product Type</label>
                            <select name="productType" value={formData.productType} onChange={handleChange} className={inputClasses}>
                                <option value="Inventory">Inventory (Track Stock)</option>
                                <option value="Service">Service (No Stock)</option>
                            </select>
                        </div>
                         <div>
                            <label className={labelClasses}>Category</label>
                             <input 
                                type="text" 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                list="category-suggestions"
                                placeholder="Select or type category"
                                className={inputClasses} 
                            />
                            <datalist id="category-suggestions">
                                {definedCategories.map(cat => <option key={cat.path} value={cat.path} />)}
                            </datalist>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Selling Price (incl. VAT) *</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" className={inputClasses} />
                        </div>
                        {formData.productType === 'Inventory' && !['hr', 'hour', 'hours', 'service', 'min', 'day', 'days'].includes(formData.unitOfMeasure.toLowerCase().trim()) && (
                             <div>
                                <label className={labelClasses}>Cost Price (excl. VAT)</label>
                                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} min="0" step="0.01" placeholder="0.00" className={inputClasses} />
                            </div>
                        )}
                    </div>

                    {formData.productType === 'Inventory' && !['hr', 'hour', 'hours', 'service', 'min', 'day', 'days'].includes(formData.unitOfMeasure.toLowerCase().trim()) && formData.costPrice > 0 && formData.price > 0 && (
                        <div className="rounded-xl border border-white/8 bg-[#17191f] p-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/55">Gross Profit (per item):</span>
                                <span className="font-semibold font-mono text-emerald-300">Ksh {grossProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/55">Profit Margin:</span>
                                <span className="font-semibold font-mono text-emerald-300">{profitMargin.toFixed(2)}%</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>SKU / Inventory Code</label>
                            <input type="text" value={product?.inventoryCode || 'Auto-generated'} readOnly className={readOnlyClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>UPC / Barcode</label>
                            <input type="text" name="upc" value={formData.upc} onChange={handleChange} placeholder="Optional barcode / UPC" className={inputClasses} />
                        </div>
                    </div>
                     {formData.productType === 'Inventory' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className={labelClasses}>Unit of Measure</label>
                                 <input
                                    type="text"
                                    name="unitOfMeasure"
                                    value={formData.unitOfMeasure}
                                    onChange={handleChange}
                                    list="unit-suggestions"
                                    placeholder="pc(s), kg, m..."
                                    className={inputClasses}
                                />
                                <datalist id="unit-suggestions">
                                    {settings.measurements?.units.map(unit => <option key={unit} value={unit} />)}
                                </datalist>
                            </div>
                             <div>
                                <label className={labelClasses}>Current Stock</label>
                                <input type="number" value={product?.stock || 0} readOnly className={readOnlyClasses} />
                            </div>
                        </div>
                    )}
                     <div>
                        <label className={labelClasses}>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Optional product description" className={inputClasses}></textarea>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <motion.button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="rounded-xl bg-[#17191f] px-4 py-3 font-bold text-white shadow-[8px_8px_18px_rgba(0,0,0,0.44),-4px_-4px_12px_rgba(255,255,255,0.02)] hover:text-amber-200">Cancel</motion.button>
                        <motion.button type="submit" whileTap={{ scale: 0.95 }} className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.24)] hover:bg-amber-400">Save Product</motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ProductModal;
