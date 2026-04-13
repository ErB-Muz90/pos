import React, { useMemo, useState } from 'react';
import { Sale, Expense, AccountingTransaction, Account, Settings, SupplierPayment, Supplier, Shift, User, Customer, BankDeposit, BankWithdrawal, SupplierInvoice } from '../types';
import BankDepositModal from './BankDepositModal';
import RecordTransactionModal from './accounts/RecordTransactionModal';

interface AccountsViewProps {
    sales: Sale[];
    expenses: Expense[];
    accountingTransactions: AccountingTransaction[];
    chartOfAccounts: Account[];
    settings: Settings;
    activeShift: Shift | null;
    supplierPayments: SupplierPayment[];
    suppliers: Supplier[];
    bankDeposits: BankDeposit[];
    bankWithdrawals: BankWithdrawal[];
    onAddBankDeposit: (depositData: Omit<BankDeposit, 'id' | 'depositedById' | 'depositedByName' | 'shiftId'>) => void;
    onAddBankWithdrawal: (data: Omit<BankWithdrawal, 'id' | 'withdrawnById' | 'withdrawnByName'>) => void;
    currentUser: User;
    customers: Customer[];
    supplierInvoices: SupplierInvoice[];
    onProcessExpense: (amount: number, reason: string, category: string, source: Expense['source'], payee?: string, receiptImageUrl?: string) => void;
    onCreateAccountingTransaction: (description: string, referenceId: string, referenceType: AccountingTransaction['referenceType'], entries: any[]) => void;
}

// Icon components
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const MpesaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;
const BankIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const TotalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const UpArrowCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" /></svg>;
const DownArrowCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>;

const formatCurrency = (amount: number, currency: string = 'KES') => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, isWarning?: boolean }> = ({ title, value, icon, isWarning }) => (
    <div className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border ${isWarning ? 'border-red-300 dark:border-red-500/50' : 'border-border dark:border-dark-border'}`}>
        <div className={`p-3 rounded-lg ${isWarning ? 'text-red-500 bg-red-100 dark:bg-red-900/50' : 'text-primary dark:text-dark-primary bg-muted dark:bg-dark-muted'}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
            {isWarning && <p className="text-xs text-red-500 font-semibold">Insufficient balance</p>}
        </div>
    </div>
);

type DisplayTransaction = {
    date: Date;
    type: string;
    description: string;
    method: string;
    amount: number;
    staff: string;
    isCredit: boolean;
};

const AccountsView: React.FC<AccountsViewProps> = ({ sales, expenses, accountingTransactions, chartOfAccounts, settings, activeShift, supplierPayments, suppliers, bankDeposits, bankWithdrawals, onAddBankDeposit, onAddBankWithdrawal, currentUser, customers, supplierInvoices, onProcessExpense, onCreateAccountingTransaction }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isRecordTxModalOpen, setIsRecordTxModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawRef, setWithdrawRef] = useState('');

    // Cash on Hand = current active shift only (0 when no shift is open)
    const activeShiftFloat = activeShift?.startingFloat ?? 0;
    const cashInHand = useMemo(() => {
        if (!activeShift) return 0;
        const shiftSales = sales.filter(s => activeShift.salesIds.includes(s.id));
        const shiftExpenses = expenses.filter(e => activeShift.expenseIds?.includes(e.id) && e.source === 'Cash Drawer');
        const shiftSupplierPayments = supplierPayments.filter(p => p.shiftId === activeShift.id && p.method === 'Cash');
        const shiftDeposits = bankDeposits.filter(d => d.shiftId === activeShift.id);
        const cashIn = shiftSales.reduce((sum, s) => sum + s.payments.filter(p => p.method === 'Cash').reduce((a, p) => a + p.amount, 0), 0);
        const changeGiven = shiftSales.reduce((sum, s) => sum + s.change, 0);
        const cashOut = shiftExpenses.reduce((sum, e) => sum + e.amount, 0)
            + shiftSupplierPayments.reduce((sum, p) => sum + p.amount, 0)
            + shiftDeposits.reduce((sum, d) => sum + d.breakdown.cash, 0);
        return activeShiftFloat + cashIn - changeGiven - cashOut;
    }, [activeShift, sales, expenses, supplierPayments, bankDeposits, activeShiftFloat]);

    // M-Pesa = all M-Pesa sales minus M-Pesa expenses and M-Pesa bank deposits
    const mpesaIn = sales.reduce((sum, s) => sum + s.payments.filter(p => p.method === 'M-Pesa').reduce((a, p) => a + p.amount, 0), 0);
    const mpesaOut = expenses.filter(e => e.source === 'M-Pesa').reduce((sum, e) => sum + e.amount, 0)
        + bankDeposits.reduce((sum, d) => sum + d.breakdown.mpesa, 0);
    const mpesaBalance = mpesaIn - mpesaOut;

    // Bank balance = total deposited minus total withdrawn
    const bankBalance = bankDeposits.reduce((sum, d) => sum + d.amount, 0)
        - bankWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalBalance = cashInHand + mpesaBalance + bankBalance;

    const allTransactions = useMemo((): DisplayTransaction[] => {
        const transactions: DisplayTransaction[] = [];
        sales.forEach(sale => transactions.push({ date: new Date(sale.date), type: 'Sale', description: `Sale to ${customers.find(c => c.id === sale.customerId)?.name || 'N/A'}`, method: sale.payments.map(p => p.method).join(', '), amount: sale.total, staff: sale.cashierName, isCredit: true }));
        expenses.forEach(expense => transactions.push({ date: new Date(expense.date), type: 'Expense', description: expense.reason, method: expense.source, amount: expense.amount, staff: expense.cashierName, isCredit: false }));
        bankDeposits.forEach(deposit => transactions.push({ date: new Date(deposit.date), type: 'Bank Deposit', description: `Deposit to ${deposit.bankName}`, method: 'Bank Transfer', amount: deposit.amount, staff: deposit.depositedByName, isCredit: true, }));
        supplierPayments.forEach(payment => {
            const invoice = supplierInvoices.find(i => i.id === payment.invoiceId);
            const supplier = suppliers.find(s => s.id === invoice?.supplierId);
            transactions.push({ date: new Date(payment.paymentDate), type: 'Supplier Payment', description: `Payment to ${supplier?.name || 'N/A'}`, method: payment.method, amount: payment.amount, staff: currentUser.name, isCredit: false, });
        });
        return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [sales, expenses, bankDeposits, supplierPayments, customers, suppliers, currentUser.name, supplierInvoices]);

    const displayTransactions = useMemo(() => {
        if (activeTab === 'deposits') {
            return allTransactions.filter(t => t.type === 'Bank Deposit');
        }
        return allTransactions;
    }, [allTransactions, activeTab]);

    // Bank ledger: deposits + withdrawals sorted by date, with running balance
    const bankLedger = useMemo(() => {
        type BankEntry = { date: Date; type: 'Deposit' | 'Withdrawal'; description: string; ref: string; amount: number; staff: string; shiftId?: string; balance: number; };
        const entries: Omit<BankEntry, 'balance'>[] = [
            ...bankDeposits.map(d => ({ date: new Date(d.date), type: 'Deposit' as const, description: `Deposit to ${d.bankName}`, ref: d.receiptNumber, amount: d.amount, staff: d.depositedByName, shiftId: d.shiftId })),
            ...bankWithdrawals.map(w => ({ date: new Date(w.date), type: 'Withdrawal' as const, description: w.reason, ref: w.referenceNumber || '-', amount: w.amount, staff: w.withdrawnByName })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        let running = 0;
        return entries.map(e => {
            running += e.type === 'Deposit' ? e.amount : -e.amount;
            return { ...e, balance: running };
        }).reverse(); // most recent first for display
    }, [bankDeposits, bankWithdrawals]);

    const handleSaveDeposit = (data: Omit<BankDeposit, 'id' | 'depositedById' | 'depositedByName' | 'shiftId'>) => {
        onAddBankDeposit(data);
        setIsDepositModalOpen(false);
    };

    const handleSaveTransaction = (data: any) => {
        if (data.type === 'Expense') {
            onProcessExpense(data.amount, data.description, data.category, data.paymentMethod, data.payee, data.receiptImageUrl);
        } else if (data.entries?.length) {
            // All other types: post the pre-built journal entries directly
            onCreateAccountingTransaction(
                `${data.type}: ${data.description}`,
                `manual_${Date.now()}`,
                'ManualEntry' as any,
                data.entries,
            );
        }
        setIsRecordTxModalOpen(false);
    };

    const handleWithdrawSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawAmount || Number(withdrawAmount) <= 0 || !withdrawReason) return;
        const bankAccount = settings.paymentMethods.bank[0];
        onAddBankWithdrawal({
            date: new Date(),
            amount: Number(withdrawAmount),
            bankAccountId: bankAccount?.id || 'default',
            bankName: bankAccount ? `${bankAccount.bankName} - ${bankAccount.accountNumber}` : 'Bank',
            reason: withdrawReason,
            referenceNumber: withdrawRef || undefined,
        });
        setWithdrawAmount('');
        setWithdrawReason('');
        setWithdrawRef('');
        setIsWithdrawModalOpen(false);
    };

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground">
            {isDepositModalOpen && (
                <BankDepositModal 
                    onClose={() => setIsDepositModalOpen(false)}
                    onSave={handleSaveDeposit}
                    settings={settings}
                    cashInHand={cashInHand}
                    mpesaBalance={mpesaBalance}
                />
            )}
            {isRecordTxModalOpen && (
                <RecordTransactionModal
                    onClose={() => setIsRecordTxModalOpen(false)}
                    onSave={handleSaveTransaction}
                    balances={{ 'Cash Drawer': cashInHand, 'M-Pesa': mpesaBalance, 'Bank': bankBalance }}
                    settings={settings}
                    expenseCategories={settings.inventory.expenseCategories}
                />
            )}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Bank Withdrawal</h2>
                            <button onClick={() => setIsWithdrawModalOpen(false)} className="text-foreground-muted hover:text-foreground">&times;</button>
                        </div>
                        <p className="text-sm text-foreground-muted mb-4">Current Bank Balance: <span className="font-bold text-foreground">{formatCurrency(bankBalance, settings.businessInfo.currency)}</span></p>
                        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (Ksh) *</label>
                                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required min="0.01" step="0.01" placeholder="0.00"
                                    className="w-full px-3 py-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background text-lg font-bold" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason *</label>
                                <input type="text" value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)} required placeholder="e.g., Supplier payment, Petty cash"
                                    className="w-full px-3 py-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reference No. (Optional)</label>
                                <input type="text" value={withdrawRef} onChange={e => setWithdrawRef(e.target.value)} placeholder="e.g., CHQ-001"
                                    className="w-full px-3 py-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="px-4 py-2 bg-muted dark:bg-dark-muted rounded-md font-semibold">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700">Confirm Withdrawal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Accounts & Finance</h1>
                    <p className="text-foreground-muted dark:text-dark-foreground-muted mt-1">Track all payments, balances, and bank deposits</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <button onClick={() => setIsDepositModalOpen(true)} className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                        <span>Bank Deposit</span>
                    </button>
                    <button onClick={() => setIsRecordTxModalOpen(true)} className="bg-orange-500 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                        <span>Record Transaction</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Cash on Hand" value={formatCurrency(cashInHand, settings.businessInfo.currency)} icon={<CashIcon />} isWarning={cashInHand < 0} />
                <StatCard title="M-Pesa Balance" value={formatCurrency(mpesaBalance, settings.businessInfo.currency)} icon={<MpesaIcon />} isWarning={mpesaBalance < 0} />
                <StatCard title="Bank Balance" value={formatCurrency(bankBalance, settings.businessInfo.currency)} icon={<BankIcon />} isWarning={bankBalance < 0} />
                <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border border-border dark:border-dark-border">
                    <div className="p-3 rounded-lg text-purple-500 bg-purple-100 dark:bg-purple-900/50">
                        <TotalIcon />
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">Total Balance</p>
                        <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{formatCurrency(totalBalance, settings.businessInfo.currency)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border p-6">
                <div className="flex border-b border-border dark:border-dark-border mb-4">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>All Transactions</button>
                    <button onClick={() => setActiveTab('deposits')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'deposits' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>Bank Deposits</button>
                    <button onClick={() => setActiveTab('bank')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'bank' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>Bank Ledger</button>
                </div>

                {activeTab === 'bank' ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Bank Account Ledger</h3>
                            <button onClick={() => setIsWithdrawModalOpen(true)} className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                <span>Withdraw</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                                    <tr>
                                        <th className="py-3 px-4">Date & Time</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4">Reference</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Balance</th>
                                        <th className="py-3 px-4">Staff</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bankLedger.map((entry, i) => (
                                        <tr key={i} className="border-b border-border dark:border-dark-border last:border-b-0">
                                            <td className="py-3 px-4 whitespace-nowrap">{entry.date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${entry.type === 'Deposit' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                                    {entry.type === 'Deposit' ? '↑' : '↓'} {entry.type}
                                                    {entry.shiftId && <span className="ml-1 opacity-70 text-[10px]">Shift</span>}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{entry.description}</td>
                                            <td className="py-3 px-4 text-foreground-muted">{entry.ref}</td>
                                            <td className={`py-3 px-4 font-semibold ${entry.type === 'Deposit' ? 'text-green-500' : 'text-red-500'}`}>
                                                {entry.type === 'Deposit' ? '+' : '-'}{formatCurrency(entry.amount, settings.businessInfo.currency)}
                                            </td>
                                            <td className="py-3 px-4 font-bold">{formatCurrency(entry.balance, settings.businessInfo.currency)}</td>
                                            <td className="py-3 px-4">{entry.staff}</td>
                                        </tr>
                                    ))}
                                    {bankLedger.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-8 text-foreground-muted">No bank transactions recorded yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-bold mb-4">Transaction History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                                    <tr>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4">Method</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Staff</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayTransactions.map((tx, index) => (
                                        <tr key={index} className="border-b border-border dark:border-dark-border last:border-b-0">
                                            <td className="py-3 px-4 whitespace-nowrap">{tx.date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                            <td className="py-3 px-4">
                                                <span className="flex items-center space-x-2">
                                                    {tx.isCredit ? <UpArrowCircle /> : <DownArrowCircle />}
                                                    <span>{tx.type}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{tx.description}</td>
                                            <td className="py-3 px-4">{tx.method}</td>
                                            <td className={`py-3 px-4 font-semibold ${tx.isCredit ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.isCredit ? '+' : '-'}{formatCurrency(tx.amount, settings.businessInfo.currency)}
                                            </td>
                                            <td className="py-3 px-4">{tx.staff}</td>
                                        </tr>
                                    ))}
                                    {displayTransactions.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-8 text-foreground-muted">No transactions found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccountsView;