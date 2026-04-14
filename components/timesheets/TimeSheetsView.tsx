import React, { useMemo, useState } from 'react';
import { TimeClockEvent, User, Permission } from '../../types';
import ConfirmationModal from '../common/ConfirmationModal';
import { ModernButton, ModernEmptyState, ModernInput, ModernSelect, ModernShell, ModernStatCard, ModernTableShell } from '../common/ModernUI';

interface TimeSheetsViewProps {
    timeClockEvents: TimeClockEvent[];
    users: User[];
    permissions: Permission[];
    onAddRequest: () => void;
    onEditRequest: (event: TimeClockEvent) => void;
    onDeleteRequest: (eventId: string) => void;
}

const formatDuration = (start: Date, end?: Date): string => {
    if (!end) return 'Active';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return 'Invalid';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};

const icons = {
    hours: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>,
    shifts: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="14" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h8" /></svg>,
    avg: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19 10 5l6 14 4-9" /></svg>,
    active: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 8v6M16 11h6" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const TimeSheetsView: React.FC<TimeSheetsViewProps> = ({ timeClockEvents, users, permissions, onAddRequest, onEditRequest, onDeleteRequest }) => {
    const [userFilter, setUserFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [eventToDelete, setEventToDelete] = useState<TimeClockEvent | null>(null);

    const canManage = permissions.includes('manage_timesheets');

    const filteredEvents = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = dateTo ? new Date(dateTo) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return timeClockEvents
            .filter((event) => userFilter === 'all' || event.userId === userFilter)
            .filter((event) => {
                const eventDate = new Date(event.clockInTime);
                if (start && eventDate < start) return false;
                if (end && eventDate > end) return false;
                return true;
            })
            .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());
    }, [timeClockEvents, userFilter, dateFrom, dateTo]);

    const { totalHours, avgDuration, activeStaffCount } = useMemo(() => {
        let totalMillis = 0;
        let completedEvents = 0;
        filteredEvents.forEach((event) => {
            if (event.clockOutTime) {
                totalMillis += new Date(event.clockOutTime).getTime() - new Date(event.clockInTime).getTime();
                completedEvents++;
            }
        });
        return {
            totalHours: totalMillis / 3600000,
            avgDuration: completedEvents > 0 ? (totalMillis / completedEvents) / 3600000 : 0,
            activeStaffCount: timeClockEvents.filter((event) => event.status === 'clocked-in').length,
        };
    }, [filteredEvents, timeClockEvents]);

    return (
        <ModernShell
            eyebrow="Staff Attendance"
            title="Staff Shifts"
            description="Track clock-in and clock-out activity, manual entries, and total hours worked in the same updated admin style."
            actions={canManage ? <ModernButton onClick={onAddRequest}>{icons.plus}Add Manual Entry</ModernButton> : undefined}
        >
            {eventToDelete && (
                <ConfirmationModal
                    title="Delete Time Entry?"
                    message={`Are you sure you want to delete this time clock entry for ${eventToDelete.userName}? This cannot be undone.`}
                    onConfirm={() => { onDeleteRequest(eventToDelete.id); setEventToDelete(null); }}
                    onClose={() => setEventToDelete(null)}
                    confirmText="Delete"
                    isDestructive
                />
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ModernStatCard title="Total Hours" value={`${totalHours.toFixed(2)} hrs`} subtitle="Hours across filtered entries" icon={icons.hours} accent="violet" />
                <ModernStatCard title="Shifts Recorded" value={filteredEvents.length} subtitle="Entries matching the active filter" icon={icons.shifts} accent="blue" />
                <ModernStatCard title="Average Duration" value={`${avgDuration.toFixed(2)} hrs`} subtitle="Average length of completed shifts" icon={icons.avg} accent="amber" />
                <ModernStatCard title="Staff Active Now" value={activeStaffCount} subtitle="Currently clocked-in staff" icon={icons.active} accent="emerald" />
            </div>

            <ModernTableShell
                title="Shift Entries"
                description="Filter by staff and period, then edit or remove manual entries when needed."
                actions={
                    <div className="grid gap-3 md:grid-cols-3">
                        <ModernSelect value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                            <option value="all">All Staff</option>
                            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </ModernSelect>
                        <ModernInput type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                        <ModernInput type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    </div>
                }
            >
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Staff Member</th>
                            <th className="px-6 py-4">Clock In</th>
                            <th className="px-6 py-4">Clock Out</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {filteredEvents.map((event) => (
                            <tr key={event.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45">
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{event.userName}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(event.clockInTime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{event.clockOutTime ? new Date(event.clockOutTime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : <span className="font-semibold text-violet-600 dark:text-violet-300">Active</span>}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatDuration(event.clockInTime, event.clockOutTime)}</td>
                                <td className="px-6 py-4 text-xs italic text-slate-500 dark:text-slate-400">{event.notes}</td>
                                <td className="px-6 py-4 text-right">
                                    {canManage ? (
                                        <div className="flex justify-end gap-2">
                                            <ModernButton variant="secondary" onClick={() => onEditRequest(event)} className="px-3 py-2">Edit</ModernButton>
                                            <ModernButton variant="danger" onClick={() => setEventToDelete(event)} className="px-3 py-2">Delete</ModernButton>
                                        </div>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredEvents.length === 0 && <div className="p-6"><ModernEmptyState title="No entries found." description="Adjust the date or staff filters to see more shift records." /></div>}
            </ModernTableShell>
        </ModernShell>
    );
};

export default TimeSheetsView;
