import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Permission, User } from '../types';
import UserModal from './settings/UserModal';
import ConfirmationModal from './common/ConfirmationModal';
import ResetPasscodeModal from './settings/ResetPasscodeModal';
import { ModernButton, ModernEmptyState, ModernShell, ModernStatCard, ModernTableShell } from './common/ModernUI';

interface StaffViewProps {
    users: User[];
    permissions: Permission[];
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onManagePermissionsRequest: () => void;
}

const icons = {
    user: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 8v6M16 11h6" /></svg>,
    shield: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v6c0 5 3.4 7.4 8 8 4.6-.6 8-3 8-8V7l-8-4Z" /></svg>,
    key: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a6 6 0 1 0 0 10l2-2h2v-2h2v-2h-2.17" /></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>,
};

const StaffView: React.FC<StaffViewProps> = ({ users, permissions, onAddUser, onUpdateUser, onDeleteUser, onManagePermissionsRequest }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [userToResetPasscode, setUserToResetPasscode] = useState<User | null>(null);

    const canManage = permissions.includes('manage_staff');
    const activeRoles = useMemo(() => new Set(users.map((user) => user.role)).size, [users]);
    const rootAccounts = useMemo(() => users.filter((user) => !!user.email).length, [users]);

    const openUserModal = (user?: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (userData: Omit<User, 'id'> | User) => {
        if ('id' in userData) {
            onUpdateUser(userData);
        } else {
            onAddUser(userData as Omit<User, 'id'>);
        }
        setIsUserModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (deletingUser) {
            onDeleteUser(deletingUser.id);
            setDeletingUser(null);
        }
    };

    const handlePasscodeSave = (userId: string, newPasscode: string) => {
        const userToUpdate = users.find((user) => user.id === userId);
        if (userToUpdate) {
            onUpdateUser({ ...userToUpdate, password: newPasscode });
        }
        setUserToResetPasscode(null);
    };

    return (
        <ModernShell
            eyebrow="Team Control"
            title="Staff"
            description="Manage users, roles, and passcodes with the same modern card and table system used across the POS modules."
            actions={canManage ? (
                <>
                    <ModernButton variant="secondary" onClick={onManagePermissionsRequest}>Manage Roles</ModernButton>
                    <ModernButton onClick={() => openUserModal()}>{icons.plus}Add New Staff</ModernButton>
                </>
            ) : undefined}
        >
            <AnimatePresence>
                {isUserModalOpen && <UserModal onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} user={editingUser} />}
                {deletingUser && (
                    <ConfirmationModal
                        title={`Delete User ${deletingUser.name}?`}
                        message="Are you sure you want to permanently delete this user? This action cannot be undone."
                        confirmText="Delete"
                        onConfirm={handleDeleteConfirm}
                        onClose={() => setDeletingUser(null)}
                        isDestructive
                    />
                )}
                {userToResetPasscode && <ResetPasscodeModal user={userToResetPasscode} onClose={() => setUserToResetPasscode(null)} onSave={handlePasscodeSave} />}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ModernStatCard title="Total Staff" value={users.length} subtitle="Accounts with access to the business" icon={icons.user} accent="violet" />
                <ModernStatCard title="Active Roles" value={activeRoles} subtitle="Distinct role types currently assigned" icon={icons.shield} accent="blue" />
                <ModernStatCard title="Primary Accounts" value={rootAccounts} subtitle="Email-backed business owner accounts" icon={icons.key} accent="amber" />
            </div>

            <ModernTableShell title="Staff Directory" description="Edit staff records, reset passcodes, or manage permissions from here.">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Staff Member</th>
                            <th className="px-6 py-4">Login ID</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {users.map((user) => {
                            const isRootAdmin = !!user.email;
                            return (
                                <tr key={user.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/45">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                                            {isRootAdmin ? <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">Owner</span> : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{user.email || user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-slate-900/6 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {canManage && !isRootAdmin ? (
                                            <div className="flex justify-end gap-2">
                                                <ModernButton variant="secondary" onClick={() => openUserModal(user)} className="px-3 py-2">Edit</ModernButton>
                                                <ModernButton variant="secondary" onClick={() => setUserToResetPasscode(user)} className="px-3 py-2">Reset Passcode</ModernButton>
                                                <ModernButton variant="danger" onClick={() => setDeletingUser(user)} className="px-3 py-2">Delete</ModernButton>
                                            </div>
                                        ) : (
                                            <div className="text-right text-xs font-semibold text-slate-400">Locked</div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="p-6">
                        <ModernEmptyState title="No staff records yet." description="Add your first staff account to start assigning access." />
                    </div>
                )}
            </ModernTableShell>
        </ModernShell>
    );
};

export default StaffView;
