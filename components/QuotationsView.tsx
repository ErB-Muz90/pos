import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quotation, Permission, Sale } from '../types';

interface QuotationsViewProps {
    quotations: Quotation[];
    sales: Sale[];
    onSelectQuotation: (quotation: Quotation) => void;
    onCreateQuoteRequest: () => void;
    onApprove: (quotation: Quotation) => void;
    onReject: (quotation: Quotation, reason: string) => void;
    onCreateWorkOrder: (quotation: Quotation) => void;
    permissions: Permission[];
}

const StatusBadge: React.FC<{ status: Quotation['status'] | 'Paid' }> = ({ status }) => {
    const base = "px-2 py-0.5 text-xs font-semibold rounded-full";
    const map: Record<string, string> = {
        Draft:     'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300',
        Sent:      'text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
        Approved:  'text-emerald-800 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300',
        Rejected:  'text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300',
        Expired:   'text-slate-700 bg-slate-200 dark:bg-slate-700 dark:text-slate-300',
        Converted: 'text-purple-800 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300',
        Invoiced:  'text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
        Paid:      'text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
    };
    return <span className={`${base} ${map[status] || 'text-slate-600 bg-slate-100'}`}>{status}</span>;
};

const QuotationsView: React.FC<QuotationsViewProps> = ({
    quotations, sales, onSelectQuotation, onCreateQuoteRequest,
    onApprove, onReject, onCreateWorkOrder, permissions,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectingQuote, setRejectingQuote] = useState<Quotation | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const canManage = permissions.includes('manage_quotations');

    const salesByQuotationId = useMemo(() => {
        const map = new Map<string, Sale>();
        sales.forEach(s => { if (s.quotationId) map.set(s.quotationId, s); });
        return map;
    }, [sales]);

    const filtered = useMemo(() =>
        quotations.filter(q =>
            q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        ), [quotations, searchTerm]);

    const pipeline = useMemo(() => ({
        pending: quotations.filter(q => ['Draft', 'Sent'].includes(q.status)).reduce((s, q) => s + q.total, 0),
        approved: quotations.filter(q => q.status === 'Approved').reduce((s, q) => s + q.total, 0),
        converted: quotations.filter(q => ['Converted', 'Invoiced'].includes(q.status)).length,
    }), [quotations]);

    const handleRejectSubmit = () => {
        if (!rejectingQuote || !rejectReason.trim()) return;
        onReject(rejectingQuote, rejectReason.trim());
        setRejectingQuote(null);
        setRejectReason('');
    };

    return (
        <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Quotations</h1>
                {canManage && (
                    <motion.button onClick={onCreateQuoteRequest} whileTap={{ scale: 0.95 }}
                        className="bg-primary text-primary-content font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Quote
                    </motion.button>
                )}
            </div>

            {/* Pipeline summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-card dark:bg-dark-card p-4 rounded-xl border border-border dark:border-dark-border">
                    <p className="text-xs font-semibold text-foreground-muted uppercase">Pending Approval</p>
                    <p className="text-xl font-bold mt-1">KES {pipeline.pending.toLocaleString()}</p>
                </div>
                <div className="bg-card dark:bg-dark-card p-4 rounded-xl border border-border dark:border-dark-border">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Approved</p>
                    <p className="text-xl font-bold mt-1">KES {pipeline.approved.toLocaleString()}</p>
                </div>
                <div className="bg-card dark:bg-dark-card p-4 rounded-xl border border-border dark:border-dark-border">
                    <p className="text-xs font-semibold text-purple-600 uppercase">Converted / Invoiced</p>
                    <p className="text-xl font-bold mt-1">{pipeline.converted} quotes</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input type="text" placeholder="Search by quote number or customer..."
                    className="w-full max-w-sm px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Table */}
            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted dark:bg-dark-muted font-bold text-foreground dark:text-dark-foreground">
                        <tr>
                            <th className="px-4 py-3">Quote #</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Expires</th>
                            <th className="px-4 py-3 text-right">Total (KES)</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-foreground-muted">No quotations found.</td></tr>
                        ) : filtered.map(quote => {
                            const isPaid = salesByQuotationId.has(quote.id);
                            const displayStatus = isPaid ? 'Paid' : quote.status;
                            const isExpired = !isPaid && quote.status !== 'Expired' && new Date(quote.expiryDate) < new Date();

                            return (
                                <tr key={quote.id}
                                    className="border-b border-border dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted cursor-pointer"
                                    onClick={() => onSelectQuotation(quote)}>
                                    <td className="px-4 py-3 font-bold text-foreground dark:text-dark-foreground">{quote.quoteNumber}</td>
                                    <td className="px-4 py-3">{quote.customerName}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={isExpired ? 'Expired' : displayStatus as any} />
                                    </td>
                                    <td className="px-4 py-3">{new Date(quote.createdDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                    <td className={`px-4 py-3 ${isExpired ? 'text-red-500 font-semibold' : ''}`}>
                                        {new Date(quote.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{quote.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            {/* View always available */}
                                            <button onClick={() => onSelectQuotation(quote)}
                                                className="text-xs font-semibold text-primary dark:text-dark-primary hover:underline">
                                                View
                                            </button>

                                            {/* Approve / Reject — only for Sent quotes */}
                                            {canManage && quote.status === 'Sent' && !isExpired && (
                                                <>
                                                    <button onClick={() => onApprove(quote)}
                                                        className="text-xs font-bold px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => { setRejectingQuote(quote); setRejectReason(''); }}
                                                        className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {/* → Work Order — only for Approved quotes */}
                                            {canManage && quote.status === 'Approved' && (
                                                <button onClick={() => onCreateWorkOrder(quote)}
                                                    className="text-xs font-bold px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 whitespace-nowrap">
                                                    → Work Order
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Reject modal */}
            <AnimatePresence>
                {rejectingQuote && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setRejectingQuote(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-card dark:bg-dark-card rounded-xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-1">Reject Quotation</h3>
                            <p className="text-sm text-foreground-muted mb-4">{rejectingQuote.quoteNumber} — {rejectingQuote.customerName}</p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection (required)"
                                rows={3}
                                className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background text-sm resize-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setRejectingQuote(null)}
                                    className="px-4 py-2 text-sm font-semibold bg-muted dark:bg-dark-muted rounded-lg">Cancel</button>
                                <button onClick={handleRejectSubmit} disabled={!rejectReason.trim()}
                                    className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-lg disabled:opacity-50">
                                    Confirm Reject
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuotationsView;
