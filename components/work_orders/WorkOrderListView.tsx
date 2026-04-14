import React, { useMemo } from 'react';
import { Customer, User, WorkOrder } from '../../types';
import { ModernButton, ModernEmptyState, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface WorkOrderListViewProps {
    workOrders: WorkOrder[];
    users: User[];
    customers: Customer[];
    onViewWorkOrder: (workOrder: WorkOrder) => void;
    onCreateRequest: () => void;
}

const StatusBadge: React.FC<{ status: WorkOrder['status'] }> = ({ status }) => {
    const colorClasses = {
        Pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        'In Progress': 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
        'Awaiting Parts': 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
        'Ready for Pickup': 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        Completed: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        Delivered: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
        Cancelled: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    } as const;

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorClasses[status]}`}>{status}</span>;
};

const icons = {
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    progress: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m4 14 5-5 4 4 7-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 10V6h-4" /></svg>,
    completed: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>,
    delivered: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13l5 5v5h-2" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 17h8" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="17.5" cy="17.5" r="1.5" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const WorkOrderListView: React.FC<WorkOrderListViewProps> = ({ workOrders, onViewWorkOrder, onCreateRequest }) => {
    const sortedWorkOrders = useMemo(() => [...workOrders].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()), [workOrders]);

    const summaryCards = useMemo(() => {
        const counts = { Pending: 0, 'In Progress': 0, Completed: 0, Delivered: 0 };
        workOrders.forEach((workOrder) => {
            if (workOrder.status === 'Pending') counts.Pending++;
            if (workOrder.status === 'In Progress') counts['In Progress']++;
            if (workOrder.status === 'Completed') counts.Completed++;
            if (workOrder.status === 'Delivered') counts.Delivered++;
        });
        return counts;
    }, [workOrders]);

    return (
        <ModernShell
            eyebrow="Service Ops"
            title="Work Orders"
            description="Manage repair, service, and custom job progress with the same modern operational treatment used across the POS."
            actions={<ModernButton onClick={onCreateRequest}>{icons.plus}Create Work Order</ModernButton>}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Pending" value={summaryCards.Pending} subtitle="Jobs not yet started" icon={icons.pending} accent="amber" />
                <ModernStatCard title="In Progress" value={summaryCards['In Progress']} subtitle="Jobs currently being worked" icon={icons.progress} accent="blue" />
                <ModernStatCard title="Completed" value={summaryCards.Completed} subtitle="Jobs ready for final handoff" icon={icons.completed} accent="emerald" />
                <ModernStatCard title="Delivered" value={summaryCards.Delivered} subtitle="Closed and handed over jobs" icon={icons.delivered} accent="violet" />
            </div>

            <ModernTableShell title="Work Order Register" description="Open any work order to inspect job details, balance, and status transitions.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">WO #</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Promised By</th>
                            <th className="px-6 py-4 text-right">Balance Due</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {sortedWorkOrders.map((workOrder) => (
                            <tr key={workOrder.id} className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45" onClick={() => onViewWorkOrder(workOrder)}>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{workOrder.id}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{workOrder.customerName}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{workOrder.jobTitle}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(workOrder.promisedDate).toLocaleDateString() || '-'}</td>
                                <td className="px-6 py-4 text-right font-semibold text-rose-600 dark:text-rose-300">{workOrder.balanceDue.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center"><StatusBadge status={workOrder.status} /></td>
                                <td className="px-6 py-4 text-right">
                                    <ModernButton variant="secondary" onClick={() => onViewWorkOrder(workOrder)} className="px-3 py-2">View</ModernButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {sortedWorkOrders.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No work orders found." description="Create a work order to start tracking service and repair jobs." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default WorkOrderListView;
