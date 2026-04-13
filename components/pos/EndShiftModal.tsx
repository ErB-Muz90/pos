import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shift, Sale, Payment, Expense, SupplierPayment, BankDeposit, Settings } from '../../types';

interface EndShiftModalProps {
    activeShift: Shift;
    sales: Sale[];
    expenses: Expense[];
    supplierPayments: SupplierPayment[];
    bankDeposits: BankDeposit[];
    settings: Settings;
    onConfirmEndShift: (actualCashInDrawer: number, notes: string, bankDepositAmount?: number, bankDepositReceiptNo?: string) => void;
    onCancel: () => void;
}

const ReconciliationRow: React.FC<{ label: string; value: number; isNegative?: boolean; isBold?: boolean }> = ({ label, value, isNegative, isBold }) => (
    <div className={`flex justify-between items-center py-2 ${isBold ? 'font-bold' : ''}`}>
        <span className="text-foreground/70 dark:text-dark-foreground/70">{label}</span>
        <span className={`font-mono ${isNegative ? 'text-danger' : 'text-foreground dark:text-dark-foreground'}`}>
            {isNegative ? '-' : ''}Ksh {Math.abs(value).toFixed(2)}
        </span>
    </div>
);

const EndShiftModal: React.FC<EndShiftModalProps> = ({ activeShift, sales, expenses, supplierPayments, bankDeposits, settings, onConfirmEndShift, onCancel }) => {
    const [step, setStep] = useState<'count' | 'bank'>('count');
    const [actualCash, setActualCash] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [bankAmount, setBankAmount] = useState<number | ''>('');
    const [bankReceiptNo, setBankReceiptNo] = useState('');

    const shiftData = useMemo(() => {
        const shiftSales = sales.filter(s => activeShift.salesIds.includes(s.id));
        const shiftExpenses = expenses.filter(p => activeShift.expenseIds?.includes(p.id));
        const cashExpenses = shiftExpenses.filter(p => p.source === 'Cash Drawer');
        const totalPayouts = cashExpenses.reduce((acc, p) => acc + p.amount, 0);

        const paymentBreakdown: { [key in Payment['method']]?: number } = {};
        let cashChange = 0;
        shiftSales.forEach(sale => {
            sale.payments.forEach(p => { paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + p.amount; });
            cashChange += sale.change;
        });

        const totalRevenue = shiftSales.reduce((acc, s) => acc + s.total, 0);
        const cashSupplierPayments = supplierPayments.filter(p => p.shiftId === activeShift.id && p.method === 'Cash');
        const totalCashSupplierPayments = cashSupplierPayments.reduce((acc, p) => acc + p.amount, 0);
        const shiftBankDeposits = bankDeposits.filter(d => d.shiftId === activeShift.id);
        const totalCashBanked = shiftBankDeposits.reduce((acc, d) => acc + (d.breakdown?.cash || 0), 0);

        const expectedCash = activeShift.startingFloat
            + (paymentBreakdown['Cash'] || 0)
            - cashChange
            - totalPayouts
            - totalCashSupplierPayments
            - totalCashBanked;

        return {
            breakdown: paymentBreakdown,
            expectedCash,
            cashChange,
            cashSales: paymentBreakdown['Cash'] || 0,
            mpesaSales: paymentBreakdown['M-Pesa'] || 0,
            cardSales: paymentBreakdown['Card'] || 0,
            totalRevenue,
            totalPayouts,
            totalCashSupplierPayments,
            totalCashBanked,
            cashSupplierPayments,
        };
    }, [activeShift, sales, expenses, supplierPayments, bankDeposits]);

    const variance = useMemo(() => {
        if (actualCash === '') return 0;
        return Number((Number(actualCash) - shiftData.expectedCash).toFixed(2));
    }, [actualCash, shiftData.expectedCash]);

    const bankAccounts = settings.paymentMethods?.bank || [];
    const defaultBank = bankAccounts[0];

    const handleCountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('bank');
        // Pre-fill bank amount with the actual cash counted (minus float to keep)
        const suggestedDeposit = Math.max(0, Number(actualCash) - activeShift.startingFloat);
        setBankAmount(suggestedDeposit > 0 ? suggestedDeposit : '');
    };

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirmEndShift(
            Number(actualCash) || 0,
            notes,
            bankAmount !== '' && Number(bankAmount) > 0 ? Number(bankAmount) : undefined,
            bankReceiptNo || undefined,
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">
                        {step === 'count' ? 'End Shift & Reconcile' : 'Bank Deposit'}
                    </h2>
                    <button onClick={onCancel} className="text-foreground/60 hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center mb-6 text-xs font-semibold">
                    <span className={`px-3 py-1 rounded-full ${step === 'count' ? 'bg-primary text-primary-content' : 'bg-green-500 text-white'}`}>1. Count Cash</span>
                    <div className="flex-1 h-px bg-border dark:bg-dark-border mx-2" />
                    <span className={`px-3 py-1 rounded-full ${step === 'bank' ? 'bg-primary text-primary-content' : 'bg-muted text-foreground-muted'}`}>2. Bank Deposit</span>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'count' && (
                        <motion.form key="count" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleCountSubmit} className="space-y-4">

                            {/* Total Revenue Summary */}
                            <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg text-sm space-y-1">
                                <h3 className="font-bold mb-1">Total Revenue This Shift</h3>
                                <ReconciliationRow label="Total Sales" value={shiftData.totalRevenue} isBold />
                            </div>

                            {/* Payment Method Breakdown */}
                            <div className="bg-background dark:bg-dark-background/50 p-4 rounded-lg space-y-1 text-sm">
                                <h3 className="font-bold mb-2">Collected By Method</h3>
                                {shiftData.cashSales > 0 && <ReconciliationRow label="Cash Received" value={shiftData.cashSales} />}
                                {shiftData.mpesaSales > 0 && <ReconciliationRow label="M-Pesa Received" value={shiftData.mpesaSales} />}
                                {shiftData.cardSales > 0 && <ReconciliationRow label="Card Received" value={shiftData.cardSales} />}
                                {activeShift.startingFloat > 0 && <ReconciliationRow label="Opening Float" value={activeShift.startingFloat} />}
                            </div>

                            {/* Cash Drawer Reconciliation */}
                            <div className="bg-background dark:bg-dark-background/50 p-4 rounded-lg space-y-1 text-sm">
                                <h3 className="font-bold mb-2">Cash Drawer Reconciliation</h3>
                                <ReconciliationRow label="Starting Float" value={activeShift.startingFloat} />
                                <ReconciliationRow label="Cash Received" value={shiftData.cashSales} />
                                {shiftData.cashChange > 0 && <ReconciliationRow label="Change Given" value={shiftData.cashChange} isNegative />}
                                {shiftData.totalPayouts > 0 && <ReconciliationRow label="Cash Expenses" value={shiftData.totalPayouts} isNegative />}
                                {shiftData.totalCashSupplierPayments > 0 && <ReconciliationRow label={`Supplier Payments (${shiftData.cashSupplierPayments.length})`} value={shiftData.totalCashSupplierPayments} isNegative />}
                                {shiftData.totalCashBanked > 0 && <ReconciliationRow label="Cash Banked" value={shiftData.totalCashBanked} isNegative />}
                                <div className="border-t border-border dark:border-dark-border !my-2" />
                                <ReconciliationRow label="Expected in Drawer" value={shiftData.expectedCash} isBold />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground/80">Actual Counted Cash in Drawer</label>
                                <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    placeholder="Enter counted amount" required autoFocus
                                    className="mt-1 block w-full text-lg font-bold p-3 bg-background dark:bg-dark-background border border-border rounded-md" />
                            </div>

                            {actualCash !== '' && (
                                <div className={`p-4 rounded-lg font-bold text-center text-lg ${variance === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'}`}>
                                    {variance === 0 && 'Drawer is Balanced'}
                                    {variance > 0 && `Overage: Ksh ${variance.toFixed(2)}`}
                                    {variance < 0 && `Shortage: Ksh ${Math.abs(variance).toFixed(2)}`}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground/80">Shift Notes (Optional)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    className="mt-1 block w-full p-2 bg-background dark:bg-dark-background border border-border rounded-md" />
                            </div>

                            <div className="pt-2 flex justify-end space-x-3">
                                <motion.button type="button" onClick={onCancel} whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 text-sm font-bold bg-background text-foreground dark:bg-dark-border dark:text-dark-foreground rounded-md">Cancel</motion.button>
                                <motion.button type="submit" disabled={actualCash === ''} whileTap={{ scale: 0.98 }}
                                    className="px-6 py-2 text-sm font-bold text-white rounded-md bg-primary hover:bg-primary-focus disabled:bg-slate-400">
                                    Next: Bank Deposit →
                                </motion.button>
                            </div>
                        </motion.form>
                    )}

                    {step === 'bank' && (
                        <motion.form key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleFinalSubmit} className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg text-sm space-y-1">
                                <p className="font-bold text-blue-800 dark:text-blue-300">Cash counted: Ksh {Number(actualCash).toFixed(2)}</p>
                                <p className="text-blue-700 dark:text-blue-400">Enter the amount you are depositing to the bank from today's sales.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground/80">Amount to Bank (Ksh)</label>
                                <input type="number" value={bankAmount} onChange={e => setBankAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    placeholder="0.00" min="0" step="0.01"
                                    className="mt-1 block w-full text-lg font-bold p-3 bg-background dark:bg-dark-background border border-border rounded-md" />
                                <p className="text-xs text-foreground-muted mt-1">Leave 0 if no deposit is being made today.</p>
                            </div>

                            {bankAccounts.length > 0 && (
                                <div className="bg-background dark:bg-dark-background/50 p-3 rounded-lg text-sm">
                                    <p className="font-semibold">Depositing to: <span className="text-primary">{defaultBank?.name || 'Default Bank Account'}</span></p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground/80">Bank Receipt / Reference No. (Optional)</label>
                                <input type="text" value={bankReceiptNo} onChange={e => setBankReceiptNo(e.target.value)}
                                    placeholder="e.g., DEP-2026-001"
                                    className="mt-1 block w-full p-3 bg-background dark:bg-dark-background border border-border rounded-md" />
                            </div>

                            <div className="pt-2 flex justify-between items-center">
                                <motion.button type="button" onClick={() => setStep('count')} whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 text-sm font-bold bg-background text-foreground dark:bg-dark-border dark:text-dark-foreground rounded-md">← Back</motion.button>
                                <motion.button type="submit" whileTap={{ scale: 0.98 }}
                                    className="px-6 py-2 text-sm font-bold text-white rounded-md bg-green-600 hover:bg-green-700">
                                    Confirm & Close Shift
                                </motion.button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default EndShiftModal;
