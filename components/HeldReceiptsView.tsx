import React from 'react';
import { HeldReceipt } from '../types';
import { ModernButton, ModernEmptyState, ModernShell, ModernStatCard } from './common/ModernUI';

interface HeldReceiptsViewProps {
    heldReceipts: HeldReceipt[];
    onRecallReceipt: (receipt: HeldReceipt) => void;
    onDeleteReceiptRequest: (receipt: HeldReceipt) => void;
}

const icons = {
    held: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /><circle cx="12" cy="12" r="9" /></svg>,
    items: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>,
    money: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" /></svg>,
};

const HeldReceiptsView: React.FC<HeldReceiptsViewProps> = ({ heldReceipts, onRecallReceipt, onDeleteReceiptRequest }) => {
    const calculateTotal = (items: HeldReceipt['items']) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const summary = {
        count: heldReceipts.length,
        items: heldReceipts.reduce((sum, receipt) => sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        value: heldReceipts.reduce((sum, receipt) => sum + calculateTotal(receipt.items), 0),
    };

    return (
        <ModernShell
            eyebrow="Saved Carts"
            title="Held Receipts"
            description="Recall parked transactions, review held cart totals, and clear unused holds in the same updated layout."
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernStatCard title="Held Receipts" value={summary.count} subtitle="Transactions currently parked" icon={icons.held} accent="violet" />
                <ModernStatCard title="Held Items" value={summary.items} subtitle="Total item quantity across all held carts" icon={icons.items} accent="blue" />
                <ModernStatCard title="Held Value" value={`Ksh ${summary.value.toFixed(2)}`} subtitle="Current gross value of held receipts" icon={icons.money} accent="amber" />
            </div>

            {heldReceipts.length === 0 ? (
                <ModernEmptyState title="There are no held receipts." description="Held transactions will appear here when a cashier parks a cart." />
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {heldReceipts.map((receipt) => (
                        <div
                            key={receipt.id}
                            className="rounded-[24px] border border-white/60 bg-white/88 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72"
                        >
                            <div className="border-b border-slate-200/80 p-5 dark:border-white/10">
                                <h3 className="truncate text-lg font-bold text-slate-950 dark:text-white">{receipt.name}</h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Held by {receipt.cashierName} at {new Date(receipt.heldAt).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="space-y-3 p-5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Items</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{receipt.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Total</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">Ksh {calculateTotal(receipt.items).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                                <ModernButton variant="danger" onClick={() => onDeleteReceiptRequest(receipt)} className="px-3 py-2">Delete</ModernButton>
                                <ModernButton onClick={() => onRecallReceipt(receipt)} className="px-3 py-2">Recall</ModernButton>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ModernShell>
    );
};

export default HeldReceiptsView;
