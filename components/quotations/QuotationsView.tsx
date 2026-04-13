import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quotation, Permission, Sale } from '../../types';

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

const StatusBadge: React.FC<{ status: Quotation['status'] }> = ({ status }) => {
    const base = "px-2 py-1 text-xs font-semibold rounded-full";
    const map: Record<string, string> = {
        Draft: 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300',
        Sent: 'text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
        Approved: 'text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
        Rejected: 'text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300',
        Expired: 'text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300',
        Converted: 'text-purple-800 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300',
        Invoiced: 'text-purple-800 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300',
    };
    return <span className={`${base} ${map[status] || map.Draft}`}>{status}</span>;
};

const QuotationsView: React.FC<QuotationsViewProps> = ({ quotations, sales, onSelectQuotation, onCreateQuoteRequest, onApprove, onReject, onCreateWorkOrder, permissions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectTarget, setRejectTarget] = useState<Quotation | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const canManage = permissions.includes('manage_quotations');

    const pipeline = useMemo(() => ({
        pending: quotations.filter(q => q.status === 'Draft' || q.status === 'Sent').reduce((s, q) => s + q.total, 0),
        approved: quotations.filter(q => q.status === 'Approved').reduce((s, q) => s + q.total, 0),
        converted: quotations.filter(q => q.status === 'Converted' || q.status === 'Invoiced').reduce((s, q) => s + q.total, 0),
    }), [quotations]);

    const filtered = useMemo(() =>
        quotations.filter(q =>
            q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()),
        [quotations, searchTerm]);

    const fmt = (n: number) => `Ksh ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <div className="p-4 md:p-8">
            {/* Reject modal */}
            {rejectTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card dark:bg-dark-card rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold mb-3">Reject Quotation {rejectTarget.quoteNumber}</h3>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                            placeholder="Reason for rejection (required)"
                            className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background mb-4" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="px-4 py-2 bg-muted dark:bg-dark-muted rounded-md font-semibold">Cancel</button>
                            <button disabled={!rejectReason.trim()} onClick={() => { onReject(rejectTarget, rejectReason); setRejectTarget(null); setRejectReason(''); }}
                                className="px-4 py-2 bg-danger text-white rounded-md font-semibold disabled:opacity-50">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}

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
                {[
                    { label: 'Pending Value', value: pipeline.pending, color: 'text-yellow-500' },
                    { label: 'Approved Value', value: pipeline.approved, color: 'text-green-500' },
                    { label: 'Converted Value', value: pipeline.converted, color: 'text-purple-500' },
                ].map(c => (
                    <div key={c.label} className="bg-card dark:bg-dark-card p-4 rounded-xl border border-border dark:border-dark-border">
                        <p className="text-xs font-semibold text-foreground-muted">{c.label}</p>
                        <p className={`text-xl font-bold ${c.color}`}>{fmt(c.value)}</p>
                    </div>
                ))}
            </div>

            <input type="text" placeholder="Search by quote # or customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full max-w-sm px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card mb-4 focus:outline-none focus:ring-2 focus:ring-primary" />

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-bold">
                        <tr>
                            <th className="px-6 py-3">Quote #</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3">Expires</th>
                            <th className="px-6 py-3 text-right">Total</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-foreground-muted">No quotations found.</td></tr>
                        ) : filtered.map(q => (
                            <tr key={q.id} className="border-b border-border dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onSelectQuotation(q)}>
                                <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">
                                    {q.quoteNumber}{q.version && q.version > 1 ? ` v${q.version}` : ''}
                                </td>
                                <td className="px-6 py-4">{q.customerName}</td>
                                <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                                <td className="px-6 py-4">{new Date(q.createdDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4">{new Date(q.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4 text-right font-mono">{fmt(q.total)}</td>
                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        {canManage && q.status === 'Sent' && (
                                            <>
                                                <button onClick={() => onApprove(q)} className="text-xs font-bold px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                                                <button onClick={() => setRejectTarget(q)} className="text-xs font-bold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                                            </>
                                        )}
                                        {canManage && q.status === 'Approved' && (
                                            <button onClick={() => onCreateWorkOrder(q)} className="text-xs font-bold px-2 py-1 bg-primary text-primary-content rounded">→ Work Order</button>
                                        )}
                                        <button onClick={() => onSelectQuotation(q)} className="text-xs font-medium text-primary dark:text-dark-primary hover:underline">View</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuotationsView;
