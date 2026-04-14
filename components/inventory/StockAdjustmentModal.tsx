import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';

interface StockAdjustmentModalProps {
    product: Product;
    onClose: () => void;
    onAdjust: (productId: string, quantity: number, type: string, reason: string) => Promise<void>;
}

const ADJUSTMENT_TYPES = [
    { value: 'adjustment', label: 'Manual Adjustment' },
    { value: 'recount', label: 'Stock Recount' },
    { value: 'damage', label: 'Damage / Write-off' },
    { value: 'theft', label: 'Theft / Loss' },
    { value: 'return', label: 'Customer Return' },
];

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ product, onClose, onAdjust }) => {
    const [type, setType] = useState('adjustment');
    const [quantity, setQuantity] = useState(0);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const newStock = product.stock + quantity;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity === 0) { setError('Quantity cannot be zero.'); return; }
        if (newStock < 0) { setError('Resulting stock cannot be negative.'); return; }
        setLoading(true);
        setError('');
        try {
            await onAdjust(product.id, quantity, type, reason);
            onClose();
        } catch {
            setError('Failed to adjust stock. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md p-6 border border-border dark:border-dark-border"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-foreground dark:text-dark-foreground">Adjust Stock</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground dark:text-dark-foreground-muted dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="mb-4 p-3 bg-muted dark:bg-dark-muted rounded-lg">
                    <p className="font-semibold text-foreground dark:text-dark-foreground">{product.name}</p>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Current stock: <span className="font-bold">{product.stock}</span> {product.unitOfMeasure}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">Adjustment Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full border border-border dark:border-dark-border rounded-lg px-3 py-2 bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {ADJUSTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                            Quantity Change <span className="text-foreground-muted dark:text-dark-foreground-muted">(use negative to decrease)</span>
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-full border border-border dark:border-dark-border rounded-lg px-3 py-2 bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {quantity !== 0 && (
                            <p className={`text-sm mt-1 ${newStock < 0 ? 'text-red-500' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>
                                New stock: <span className="font-bold">{newStock}</span> {product.unitOfMeasure}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">Reason <span className="text-foreground-muted">(optional)</span></label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g. Annual stock count correction"
                            className="w-full border border-border dark:border-dark-border rounded-lg px-3 py-2 bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border dark:border-dark-border rounded-lg text-foreground dark:text-dark-foreground hover:bg-muted dark:hover:bg-dark-muted transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || quantity === 0 || newStock < 0}
                            className="flex-1 px-4 py-2 bg-primary text-primary-content rounded-lg font-semibold hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Apply Adjustment'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default StockAdjustmentModal;
