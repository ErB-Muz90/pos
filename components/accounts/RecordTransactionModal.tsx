import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from '../../types';

type TransactionType = 'Expense' | 'Cash In' | 'Cash Out' | 'M-Pesa In' | 'M-Pesa Out' | 'Bank Transfer In' | 'Bank Transfer Out' | 'Customer Refund';
type PaymentMethod = 'Cash Drawer' | 'M-Pesa' | 'Bank';

interface RecordTransactionModalProps {
    onClose: () => void;
    onSave: (data: any) => void;
    balances: { [key in PaymentMethod]: number };
    settings: Settings;
    expenseCategories: string[];
}

// Maps transaction type to the journal entries to post
function buildEntries(
    type: TransactionType,
    amount: number,
    method: PaymentMethod,
    acc: Settings['accounting'],
): { accountId: string; debit: number; credit: number }[] {
    const methodAccount = method === 'Cash Drawer' ? acc.defaultCashAccountId
        : method === 'M-Pesa' ? acc.defaultMpesaAccountId
        : acc.defaultBankAccountId;

    switch (type) {
        case 'Expense':
            return [
                { accountId: acc.defaultExpenseAccountId || acc.defaultCogsAccountId, debit: amount, credit: 0 },
                { accountId: methodAccount, debit: 0, credit: amount },
            ];
        case 'Cash In':
            return [
                { accountId: acc.defaultCashAccountId, debit: amount, credit: 0 },
                { accountId: acc.defaultShiftClearingId, debit: 0, credit: amount },
            ];
        case 'Cash Out':
            return [
                { accountId: acc.defaultShiftClearingId, debit: amount, credit: 0 },
                { accountId: acc.defaultCashAccountId, debit: 0, credit: amount },
            ];
        case 'M-Pesa In':
            return [
                { accountId: acc.defaultMpesaAccountId, debit: amount, credit: 0 },
                { accountId: acc.defaultShiftClearingId, debit: 0, credit: amount },
            ];
        case 'M-Pesa Out':
            return [
                { accountId: acc.defaultShiftClearingId, debit: amount, credit: 0 },
                { accountId: acc.defaultMpesaAccountId, debit: 0, credit: amount },
            ];
        case 'Bank Transfer In':
            return [
                { accountId: acc.defaultBankAccountId, debit: amount, credit: 0 },
                { accountId: methodAccount, debit: 0, credit: amount },
            ];
        case 'Bank Transfer Out':
            return [
                { accountId: methodAccount, debit: amount, credit: 0 },
                { accountId: acc.defaultBankAccountId, debit: 0, credit: amount },
            ];
        case 'Customer Refund':
            return [
                { accountId: acc.defaultSalesReturnAccountId, debit: amount, credit: 0 },
                { accountId: methodAccount, debit: 0, credit: amount },
            ];
        default:
            return [];
    }
}

const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({ onClose, onSave, balances, settings, expenseCategories }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>('Expense');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash Drawer');
    const [amount, setAmount] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(expenseCategories[0] || 'Miscellaneous');
    const [payee, setPayee] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [error, setError] = useState('');

    const isOutflow = ['Expense', 'Cash Out', 'M-Pesa Out', 'Bank Transfer Out', 'Customer Refund'].includes(type);
    const isOverdraft = isOutflow && typeof amount === 'number' && amount > (balances[paymentMethod] || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (typeof amount !== 'number' || amount <= 0) { setError('Please enter a valid amount.'); return; }

        const entries = buildEntries(type, amount, paymentMethod, settings.accounting);
        if (entries.length === 0) { setError('Transaction type not supported.'); return; }

        onSave({
            type,
            date,
            amount,
            paymentMethod,
            description,
            payee,
            category: type === 'Expense' ? category : type,
            notes,
            receiptImageUrl: receiptImage,
            entries,
        });
    };

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReceiptImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary text-foreground dark:text-dark-foreground";
    const labelClasses = "block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted";

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-border dark:border-dark-border">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Record Transaction</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Type *</label>
                            <select value={type} onChange={e => setType(e.target.value as TransactionType)} required className={inputClasses}>
                                <option>Expense</option>
                                <option>Cash In</option>
                                <option>Cash Out</option>
                                <option>M-Pesa In</option>
                                <option>M-Pesa Out</option>
                                <option>Bank Transfer In</option>
                                <option>Bank Transfer Out</option>
                                <option>Customer Refund</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Payment Method *</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} required className={inputClasses}>
                                <option value="Cash Drawer">Cash (KES {balances['Cash Drawer'].toFixed(2)})</option>
                                <option value="M-Pesa">M-Pesa (KES {balances['M-Pesa'].toFixed(2)})</option>
                                <option value="Bank">Bank (KES {balances['Bank'].toFixed(2)})</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Amount *</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                required min="0.01" step="0.01" className={`${inputClasses} ${isOverdraft ? 'border-red-500' : ''}`} />
                            {isOverdraft && <p className="text-xs text-red-500 mt-1">Amount exceeds available balance.</p>}
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Description *</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required
                            placeholder="e.g., Office supplies" className={inputClasses} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Payee / Reference (Optional)</label>
                            <input type="text" value={payee} onChange={e => setPayee(e.target.value)} className={inputClasses} />
                        </div>
                        {type === 'Expense' && (
                            <div>
                                <label className={labelClasses}>Category *</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required className={inputClasses}>
                                    {expenseCategories.map(cat => <option key={cat}>{cat}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={labelClasses}>Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClasses} />
                    </div>

                    {type === 'Expense' && (
                        <div>
                            <label className={labelClasses}>Upload Receipt (Optional)</label>
                            <input type="file" onChange={handleReceiptUpload} accept="image/*"
                                className={`${inputClasses} p-0 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-muted dark:file:bg-dark-muted`} />
                            {receiptImage && <img src={receiptImage} alt="Receipt" className="mt-2 rounded-lg max-h-40 object-contain border p-1" />}
                        </div>
                    )}

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                </form>

                <div className="flex-shrink-0 flex justify-end gap-2 p-4 border-t border-border dark:border-dark-border">
                    <motion.button type="button" onClick={onClose} whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-muted dark:bg-dark-muted rounded-md font-semibold">Cancel</motion.button>
                    <motion.button onClick={handleSubmit} whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-primary text-primary-content rounded-md font-semibold disabled:opacity-50"
                        disabled={isOverdraft}>Record Transaction</motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default RecordTransactionModal;
