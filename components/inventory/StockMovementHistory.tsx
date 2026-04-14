import React from 'react';
import { motion } from 'framer-motion';
import { Product, StockMovement } from '../../types';

interface StockMovementHistoryProps {
    product: Product;
    movements: StockMovement[];
    onClose: () => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    adjustment:   { label: 'Adjustment',    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300' },
    recount:      { label: 'Recount',       color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300' },
    damage:       { label: 'Damage',        color: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300' },
    theft:        { label: 'Theft',         color: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300' },
    return:       { label: 'Return',        color: 'text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300' },
    purchase:     { label: 'Purchase',      color: 'text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300' },
    sale:         { label: 'Sale',          color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300' },
    transfer_in:  { label: 'Transfer In',   color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300' },
    transfer_out: { label: 'Transfer Out',  color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300' },
};

const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({ product, movements, onClose }) => {
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
                className="bg-card dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border dark:border-dark-border flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-border dark:border-dark-border">
                    <div>
                        <h2 className="text-lg font-bold text-foreground dark:text-dark-foreground">Movement History</h2>
                        <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">{product.name} · Current stock: <span className="font-semibold">{product.stock}</span></p>
                    </div>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground dark:text-dark-foreground-muted dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {movements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-foreground-muted dark:text-dark-foreground-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <p>No movement history yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted dark:bg-dark-muted">
                                <tr>
                                    <th className="text-left px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted font-medium">Date</th>
                                    <th className="text-left px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted font-medium">Type</th>
                                    <th className="text-right px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted font-medium">Change</th>
                                    <th className="text-right px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted font-medium">Before</th>
                                    <th className="text-right px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted font-medium">After</th>
                                    <th className="text-left px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted font-medium">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-dark-border">
                                {movements.map(m => {
                                    const meta = TYPE_LABELS[m.type] ?? { label: m.type, color: 'text-gray-600 bg-gray-100' };
                                    const isPositive = m.quantity > 0;
                                    return (
                                        <tr key={m.id} className="hover:bg-muted/50 dark:hover:bg-dark-muted/50">
                                            <td className="px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted whitespace-nowrap">
                                                {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {isPositive ? '+' : ''}{m.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right text-foreground dark:text-dark-foreground">{m.quantityBefore}</td>
                                            <td className="px-4 py-3 text-right text-foreground dark:text-dark-foreground">{m.quantityAfter}</td>
                                            <td className="px-4 py-3 text-foreground-muted dark:text-dark-foreground-muted truncate max-w-[160px]">{m.reason || m.referenceNumber || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StockMovementHistory;
