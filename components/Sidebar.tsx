

import React, { ReactNode, ReactElement, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, User, Permission, Settings } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentUser: User;
    onLogout: () => void;
    permissions: Permission[];
    settings: Settings;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
export const Logo: React.FC<{ layout?: 'horizontal' | 'vertical'; collapsed?: boolean }> = ({ layout = 'vertical', collapsed = false }) => {
    const icon = (
        <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-60 blur-md" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" />
                <span className="text-base font-black text-white">B</span>
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
            </div>
        </div>
    );

    if (layout === 'horizontal') {
        return (
            <div className="flex items-center gap-3">
                {icon}
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="text-base font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent leading-tight">
                            Banduka POS™
                        </span>
                        <span className="text-[9px] tracking-widest text-white/40 uppercase">Point of Sale</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
            {icon}
            {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                    <span className="text-base font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent leading-tight">
                        Banduka POS™
                    </span>
                    <span className="text-[9px] tracking-widest text-white/40 uppercase">Point of Sale System</span>
                </motion.div>
            )}
        </div>
    );
};

// ── Menu items ────────────────────────────────────────────────────────────────
const ALL_MENU_ITEMS: { view: View; label: string; icon: ReactElement; permission: Permission; badge?: string }[] = [
    { view: View.Dashboard,         label: 'Dashboard',          icon: ICONS.dashboard,     permission: 'view_dashboard' },
    { view: View.POS,               label: 'Point of Sale',      icon: ICONS.pos,           permission: 'view_pos',              badge: 'Hot' },
    { view: View.Inventory,         label: 'Inventory',          icon: ICONS.inventory,     permission: 'view_inventory' },
    { view: View.Customers,         label: 'Customers',          icon: ICONS.customers,     permission: 'view_customers' },
    { view: View.Suppliers,         label: 'Suppliers',          icon: ICONS.suppliers,     permission: 'view_suppliers' },
    { view: View.AccountsPayable,   label: 'Accounts Payable',   icon: ICONS.ap,            permission: 'view_ap' },
    { view: View.Purchases,         label: 'Purchase Orders',    icon: ICONS.clipboardList, permission: 'view_purchases' },
    { view: View.SalesOrderList,    label: 'Sales Orders',       icon: ICONS.clipboardList, permission: 'manage_sales_orders' },
    { view: View.Quotations,        label: 'Quotations',         icon: ICONS.quotations,    permission: 'view_quotations' },
    { view: View.WorkOrderList,     label: 'Work Orders',        icon: ICONS.workOrder,     permission: 'manage_work_orders' },
    { view: View.LayawayList,       label: 'Layaways',           icon: ICONS.layaway,       permission: 'manage_layaways' },
    { view: View.HeldReceipts,      label: 'Held Receipts',      icon: ICONS.heldReceipts,  permission: 'view_held_receipts' },
    { view: View.SalesHistory,      label: 'Sales History',      icon: ICONS.salesHistory,  permission: 'view_sales_history' },
    { view: View.Staff,             label: 'Staff',              icon: ICONS.staff,         permission: 'view_staff' },
    { view: View.TimeSheets,        label: 'Shifts',             icon: ICONS.timeSheets,    permission: 'view_timesheets' },
    { view: View.Accounts,          label: 'Accounts & Finance', icon: ICONS.accounts,      permission: 'view_general_ledger' },
    { view: View.ProfitReport,      label: 'Reports',            icon: ICONS.profitReport,  permission: 'view_profit_report' },
    { view: View.FiscalPeriodReport,label: 'Fiscal Report',      icon: ICONS.generalLedger, permission: 'view_profit_report' },
    { view: View.TaxReport,         label: 'Tax Report',         icon: ICONS.tax,           permission: 'view_profit_report' },
    { view: View.Settings,          label: 'Settings',           icon: ICONS.settings,      permission: 'view_settings' },
];

// ── NavItem ───────────────────────────────────────────────────────────────────
const NavItem: React.FC<{
    item: typeof ALL_MENU_ITEMS[0];
    isActive: boolean;
    collapsed: boolean;
    onClick: () => void;
}> = ({ item, isActive, collapsed, onClick }) => (
    <div className="relative group">
        <motion.button
            onClick={onClick}
            whileHover={{ x: collapsed ? 0 : 3 }}
            whileTap={{ scale: 0.97 }}
            className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
            } ${
                isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white border border-purple-500/25 shadow-lg shadow-purple-500/5'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
        >
            {/* Active left bar */}
            {isActive && (
                <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 h-7 w-0.5 rounded-r-full bg-gradient-to-b from-purple-400 to-indigo-500"
                />
            )}
            {/* Icon */}
            <span className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-purple-400' : ''}`}>
                {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
            </span>
            {/* Label + badge */}
            {!collapsed && (
                <>
                    <span className="flex-1 text-left font-medium truncate">{item.label}</span>
                    {item.badge && (
                        <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </motion.button>
        {/* Tooltip when collapsed */}
        {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {item.label}
                {item.badge && <span className="ml-1 text-amber-400">🔥</span>}
            </div>
        )}
    </div>
);

// ── SidebarContent ────────────────────────────────────────────────────────────
const SidebarContent: React.FC<Omit<SidebarProps, 'isOpen' | 'setIsOpen'> & { collapsed?: boolean }> = ({
    currentView, setCurrentView, permissions, currentUser, onLogout, collapsed = false,
}) => {
    const menuItems = useMemo(() => ALL_MENU_ITEMS.filter(i => permissions.includes(i.permission)), [permissions]);

    const userInitials = useMemo(() => {
        if (!currentUser?.name) return '?';
        const parts = currentUser.name.split(' ').filter(Boolean);
        return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
    }, [currentUser]);

    return (
        <div className="flex h-full flex-col bg-slate-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl">
            {/* Logo */}
            <Logo collapsed={collapsed} />

            {/* Section label */}
            {!collapsed && (
                <div className="px-4 pt-4 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Main Menu</p>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {menuItems.map(item => (
                    <NavItem
                        key={item.view}
                        item={item}
                        isActive={currentView === item.view}
                        collapsed={collapsed}
                        onClick={() => setCurrentView(item.view)}
                    />
                ))}
            </nav>

            {/* User footer */}
            <div className="border-t border-white/10 p-3">
                <div className={`rounded-xl bg-white/5 p-3 ${collapsed ? 'flex justify-center' : 'flex items-center gap-3'}`}>
                    <div className="relative group flex-shrink-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">{userInitials}</span>
                        </div>
                        {collapsed && (
                            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                {currentUser.name}<br />
                                <span className="text-white/40">{currentUser.role}</span>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-white/40">{currentUser.role}</p>
                            </div>
                            <motion.button
                                onClick={onLogout}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                title="Logout"
                            >
                                <div className="w-4 h-4">{ICONS.logout}</div>
                            </motion.button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ currentView, setCurrentView, isOpen, setIsOpen, currentUser, onLogout, permissions, settings }: SidebarProps) => (
    <>
        {/* Desktop */}
        <div className="hidden md:block flex-shrink-0 no-print w-64">
            <SidebarContent
                currentView={currentView}
                setCurrentView={setCurrentView}
                permissions={permissions}
                settings={settings}
                currentUser={currentUser}
                onLogout={onLogout}
            />
        </div>

        {/* Mobile overlay */}
        <AnimatePresence>
            {isOpen && (
                <div className="md:hidden no-print">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div
                        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full z-40 w-64"
                    >
                        <SidebarContent
                            currentView={currentView}
                            setCurrentView={(v) => { setCurrentView(v); setIsOpen(false); }}
                            permissions={permissions}
                            settings={settings}
                            currentUser={currentUser}
                            onLogout={onLogout}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </>
);

export default Sidebar;
