import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Permission, Quotation, Sale } from '../types';
import { ModernButton, ModernEmptyState, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from './common/ModernUI';

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

const icons = {
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    approved: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>,
    converted: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m4 14 5-5 4 4 7-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 10V6h-4" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const StatusBadge: React.FC<{ status: Quotation['status'] | 'Paid' }> = ({ status }) => {
    const map: Record<string, string> = {
        Draft: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        Sent: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Approved: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        Rejected: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
        Expired: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
        Converted: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
        Invoiced: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
        Paid: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    };

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] || map.Draft}`}>{status}</span>;
};

const QuotationsView: React.FC<QuotationsViewProps> = ({
    quotations,
    sales,
    onSelectQuotation,
    onCreateQuoteRequest,
    onApprove,
    onReject,
    onCreateWorkOrder,
    permissions,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectTarget, setRejectTarget] = useState<Quotation | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const canManage = permissions.includes('manage_quotations');

    const salesByQuotationId = useMemo(() => {
        const map = new Map<string, Sale>();
        sales.forEach((sale) => {
            if (sale.quotationId) {
                map.set(sale.quotationId, sale);
            }
        });
        return map;
    }, [sales]);

    const pipeline = useMemo(() => ({
        pending: quotations.filter((quote) => quote.status === 'Draft' || quote.status === 'Sent').reduce((sum, quote) => sum + quote.total, 0),
        approved: quotations.filter((quote) => quote.status === 'Approved').reduce((sum, quote) => sum + quote.total, 0),
        converted: quotations.filter((quote) => quote.status === 'Converted' || quote.status === 'Invoiced' || salesByQuotationId.has(quote.id)).length,
    }), [quotations, salesByQuotationId]);

    const filtered = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return quotations
            .filter((quote) => quote.quoteNumber.toLowerCase().includes(query) || quote.customerName.toLowerCase().includes(query))
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }, [quotations, searchTerm]);

    const handleRejectSubmit = () => {
        if (!rejectTarget || !rejectReason.trim()) {
            return;
        }
        onReject(rejectTarget, rejectReason.trim());
        setRejectTarget(null);
        setRejectReason('');
    };

    const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <ModernShell
            eyebrow="Sales Pipeline"
            title="Quotations"
            description="Track quote pipeline value, approve or reject submissions, and move approved work into invoices or work orders with the updated POS layout."
            actions={canManage ? <ModernButton onClick={onCreateQuoteRequest}>{icons.plus}New Quote</ModernButton> : undefined}
        >
            <AnimatePresence>
                {rejectTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/92 p-6 shadow-[0_35px_100px_-50px_rgba(15,23,42,0.7)] dark:border-white/10 dark:bg-slate-900/90">
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Reject Quotation</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {rejectTarget.quoteNumber} for {rejectTarget.customerName}
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(event) => setRejectReason(event.target.value)}
                                rows={4}
                                placeholder="Reason for rejection"
                                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                            />
                            <div className="mt-5 flex justify-end gap-2">
                                <ModernButton variant="secondary" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
                                    Cancel
                                </ModernButton>
                                <ModernButton variant="danger" onClick={handleRejectSubmit} disabled={!rejectReason.trim()}>
                                    Confirm Reject
                                </ModernButton>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernStatCard title="Pending Value" value={formatCurrency(pipeline.pending)} subtitle="Draft and sent quotes still open" icon={icons.pending} accent="amber" />
                <ModernStatCard title="Approved Value" value={formatCurrency(pipeline.approved)} subtitle="Ready to invoice or convert" icon={icons.approved} accent="emerald" />
                <ModernStatCard title="Converted / Paid" value={pipeline.converted} subtitle="Quotes already invoiced or linked to sales" icon={icons.converted} accent="violet" />
            </div>

            <ModernPanel>
                <ModernSearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by quote # or customer..." />
            </ModernPanel>

            <ModernTableShell title="Quotation Register" description="Open any quotation to inspect line items, export documents, or move it forward in the pipeline.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Quote #</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created</th>
                            <th className="px-6 py-4">Expires</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {filtered.map((quote) => {
                            const isPaid = salesByQuotationId.has(quote.id);
                            const isExpired = !isPaid && quote.status !== 'Expired' && new Date(quote.expiryDate) < new Date();
                            const displayStatus: Quotation['status'] | 'Paid' = isPaid ? 'Paid' : (isExpired ? 'Expired' : quote.status);

                            return (
                                <tr key={quote.id} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45" onClick={() => onSelectQuotation(quote)}>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                        {quote.quoteNumber}
                                        {quote.version && quote.version > 1 ? ` v${quote.version}` : ''}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{quote.customerName}</td>
                                    <td className="px-6 py-4"><StatusBadge status={displayStatus} /></td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(quote.createdDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                    <td className={`px-6 py-4 ${isExpired ? 'font-semibold text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {new Date(quote.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(quote.total)}</td>
                                    <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {canManage && quote.status === 'Sent' && !isExpired ? (
                                                <ModernButton variant="secondary" onClick={() => onApprove(quote)} className="px-3 py-2">
                                                    Approve
                                                </ModernButton>
                                            ) : null}
                                            {canManage && quote.status === 'Sent' && !isExpired ? (
                                                <ModernButton variant="danger" onClick={() => { setRejectTarget(quote); setRejectReason(''); }} className="px-3 py-2">
                                                    Reject
                                                </ModernButton>
                                            ) : null}
                                            {canManage && quote.status === 'Approved' && !isPaid ? (
                                                <ModernButton variant="secondary" onClick={() => onCreateWorkOrder(quote)} className="px-3 py-2">
                                                    To Work Order
                                                </ModernButton>
                                            ) : null}
                                            <ModernButton variant="ghost" onClick={() => onSelectQuotation(quote)} className="px-3 py-2">
                                                View
                                            </ModernButton>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtered.length === 0 ? (
                    <div className="p-6">
                        <ModernEmptyState title="No quotations found." description="Create a quotation or broaden the current search." />
                    </div>
                ) : null}
            </ModernTableShell>
        </ModernShell>
    );
};

export default QuotationsView;
