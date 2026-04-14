import React, { useMemo, useState } from 'react';
import { Quotation, Permission, Sale } from '../../types';
import { ModernButton, ModernEmptyState, ModernPanel, ModernSearchInput, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

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
    const map: Record<string, string> = {
        Draft: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        Sent: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Approved: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        Rejected: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
        Expired: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
        Converted: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
        Invoiced: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] || map.Draft}`}>{status}</span>;
};

const icons = {
    quote: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v14H4V3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h5" /></svg>,
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    approved: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>,
    converted: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m4 14 5-5 4 4 7-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 10V6h-4" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const QuotationsView: React.FC<QuotationsViewProps> = ({ quotations, onSelectQuotation, onCreateQuoteRequest, onApprove, onReject, onCreateWorkOrder, permissions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectTarget, setRejectTarget] = useState<Quotation | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const canManage = permissions.includes('manage_quotations');

    const pipeline = useMemo(() => ({
        pending: quotations.filter((quote) => quote.status === 'Draft' || quote.status === 'Sent').reduce((sum, quote) => sum + quote.total, 0),
        approved: quotations.filter((quote) => quote.status === 'Approved').reduce((sum, quote) => sum + quote.total, 0),
        converted: quotations.filter((quote) => quote.status === 'Converted' || quote.status === 'Invoiced').reduce((sum, quote) => sum + quote.total, 0),
    }), [quotations]);

    const filtered = useMemo(() => {
        return quotations
            .filter((quote) => quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }, [quotations, searchTerm]);

    const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <ModernShell
            eyebrow="Sales Pipeline"
            title="Quotations"
            description="Track quote pipeline value, approve or reject submissions, and convert approved work into downstream jobs."
            actions={canManage ? <ModernButton onClick={onCreateQuoteRequest}>{icons.plus}New Quote</ModernButton> : undefined}
        >
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/92 p-6 shadow-[0_35px_100px_-50px_rgba(15,23,42,0.7)] dark:border-white/10 dark:bg-slate-900/90">
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Reject Quotation {rejectTarget.quoteNumber}</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Provide a reason before rejecting this quotation.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            rows={4}
                            placeholder="Reason for rejection"
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm outline-none dark:border-white/10 dark:bg-slate-950/70"
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <ModernButton variant="secondary" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</ModernButton>
                            <ModernButton variant="danger" onClick={() => { onReject(rejectTarget, rejectReason); setRejectTarget(null); setRejectReason(''); }} disabled={!rejectReason.trim()}>
                                Confirm Reject
                            </ModernButton>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernStatCard title="Pending Value" value={formatCurrency(pipeline.pending)} subtitle="Draft and sent quotations still open" icon={icons.pending} accent="amber" />
                <ModernStatCard title="Approved Value" value={formatCurrency(pipeline.approved)} subtitle="Approved quotations ready for conversion" icon={icons.approved} accent="emerald" />
                <ModernStatCard title="Converted Value" value={formatCurrency(pipeline.converted)} subtitle="Quotes already turned into jobs or invoices" icon={icons.converted} accent="violet" />
            </div>

            <ModernPanel>
                <ModernSearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by quote # or customer..." />
            </ModernPanel>

            <ModernTableShell title="Quotation Register" description="Select a quotation to inspect it in detail or move it forward in the pipeline.">
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
                        {filtered.map((quote) => (
                            <tr key={quote.id} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45" onClick={() => onSelectQuotation(quote)}>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                    {quote.quoteNumber}{quote.version && quote.version > 1 ? ` v${quote.version}` : ''}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{quote.customerName}</td>
                                <td className="px-6 py-4"><StatusBadge status={quote.status} /></td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(quote.createdDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(quote.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(quote.total)}</td>
                                <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                                    <div className="flex justify-end gap-2">
                                        {canManage && quote.status === 'Sent' ? <ModernButton variant="secondary" onClick={() => onApprove(quote)} className="px-3 py-2">Approve</ModernButton> : null}
                                        {canManage && quote.status === 'Sent' ? <ModernButton variant="danger" onClick={() => setRejectTarget(quote)} className="px-3 py-2">Reject</ModernButton> : null}
                                        {canManage && quote.status === 'Approved' ? <ModernButton variant="secondary" onClick={() => onCreateWorkOrder(quote)} className="px-3 py-2">To Work Order</ModernButton> : null}
                                        <ModernButton variant="secondary" onClick={() => onSelectQuotation(quote)} className="px-3 py-2">View</ModernButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No quotations found." description="Create a quotation or broaden the current search." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default QuotationsView;
