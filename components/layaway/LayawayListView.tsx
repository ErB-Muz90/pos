import React, { useMemo } from 'react';
import { Layaway } from '../../types';
import { ModernButton, ModernEmptyState, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface LayawayListViewProps {
    layaways: Layaway[];
    onSelectLayaway: (layaway: Layaway) => void;
    onCreateRequest: () => void;
    onDeleteRequest: (layaway: Layaway) => void;
}

const icons = {
    active: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M3 10h18" /></svg>,
    money: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    done: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const StatusBadge: React.FC<{ status: Layaway['status'] }> = ({ status }) => {
    const styles = {
        Active: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Completed: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        Defaulted: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
        Cancelled: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
    } as const;
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
};

const LayawayListView: React.FC<LayawayListViewProps> = ({ layaways, onSelectLayaway, onCreateRequest, onDeleteRequest }) => {
    const { activePlans, totalOutstanding, completed } = useMemo(() => {
        const active = layaways.filter((layaway) => layaway.status === 'Active');
        return {
            activePlans: active.length,
            totalOutstanding: active.reduce((sum, layaway) => sum + layaway.balance, 0),
            completed: layaways.filter((layaway) => layaway.status === 'Completed').length,
        };
    }, [layaways]);

    const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;

    return (
        <ModernShell
            eyebrow="Payment Plans"
            title="Layaway Plans"
            description="Manage customer installment plans, follow open balances, and recall plan details in the same updated workspace."
            actions={<ModernButton onClick={onCreateRequest}>{icons.plus}Create Layaway</ModernButton>}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModernStatCard title="Active Plans" value={activePlans} subtitle="Layaways currently collecting payments" icon={icons.active} accent="blue" />
                <ModernStatCard title="Total Outstanding" value={formatCurrency(totalOutstanding)} subtitle="Remaining amount across active plans" icon={icons.money} accent="amber" />
                <ModernStatCard title="Completed" value={completed} subtitle="Plans fully settled" icon={icons.done} accent="emerald" />
            </div>

            <ModernTableShell title="Layaway Register" description="View plan progress, open plan detail, or remove a plan when needed.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Layaway #</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Total Amount</th>
                            <th className="px-6 py-4">Paid</th>
                            <th className="px-6 py-4">Balance</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {layaways.map((layaway) => {
                            const paidAmount = layaway.total - layaway.balance;
                            const percentage = layaway.total > 0 ? (paidAmount / layaway.total) * 100 : 0;
                            return (
                                <tr key={layaway.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{layaway.id}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{layaway.customerName}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(layaway.total)}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900 dark:text-white">{formatCurrency(paidAmount)}</div>
                                        <div className="my-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
                                        </div>
                                        <div className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-300">{percentage.toFixed(0)}%</div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(layaway.balance)}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(layaway.expiryDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><StatusBadge status={layaway.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <ModernButton variant="secondary" onClick={() => onSelectLayaway(layaway)} className="px-3 py-2">View</ModernButton>
                                            <ModernButton variant="danger" onClick={() => onDeleteRequest(layaway)} className="px-3 py-2">Delete</ModernButton>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {layaways.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No layaway plans found." description="Create a layaway to start collecting installment payments." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default LayawayListView;
