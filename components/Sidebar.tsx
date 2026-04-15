import React, { ReactElement, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, User, Permission, Settings } from '../types';
import { ICONS } from '../constants';
import Logo from './Logo';

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
            whileHover={{
                x: collapsed ? 0 : 4,
                y: -1,
                boxShadow: isActive
                    ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(245,158,11,0.22), 0 0 24px rgba(245,158,11,0.18), 8px 8px 20px rgba(0,0,0,0.5), -6px -6px 16px rgba(255,255,255,0.03)'
                    : '0 0 0 1px rgba(245,158,11,0.16), 0 0 20px rgba(245,158,11,0.12), 8px 8px 20px rgba(0,0,0,0.46), -6px -6px 16px rgba(255,255,255,0.025)',
            }}
            whileTap={{
                scale: 0.985,
                y: 0,
                boxShadow: 'inset 6px 6px 14px rgba(0,0,0,0.58), inset -4px -4px 10px rgba(255,255,255,0.03)',
            }}
            className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
            } ${
                isActive
                    ? 'border border-amber-500/25 bg-[linear-gradient(145deg,#181b22,#12141a)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(245,158,11,0.18),0_0_22px_rgba(245,158,11,0.14),10px_10px_24px_rgba(0,0,0,0.52),-6px_-6px_16px_rgba(255,255,255,0.03)]'
                    : 'border border-white/5 bg-[linear-gradient(145deg,#15181f,#0e1015)] text-white shadow-[8px_8px_20px_rgba(0,0,0,0.46),-6px_-6px_16px_rgba(255,255,255,0.025)] hover:text-white'
            }`}
        >
            <div className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-all duration-200 ${isActive ? 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.75)]' : 'bg-transparent group-hover:bg-amber-500/80 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.45)]'}`} />
            <div className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200 ${isActive ? 'bg-[radial-gradient(circle_at_right,_rgba(245,158,11,0.10),_transparent_42%)] opacity-100' : 'bg-[radial-gradient(circle_at_right,_rgba(245,158,11,0.08),_transparent_38%)] opacity-0 group-hover:opacity-100'}`} />
            {/* Active left bar */}
            {isActive && (
                <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 h-7 w-1 rounded-r-full bg-amber-300"
                />
            )}
            {/* Icon */}
            <span className={`relative h-5 w-5 flex-shrink-0 ${isActive ? 'text-amber-300' : 'text-white/80 group-hover:text-amber-200'}`}>
                {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
            </span>
            {/* Label + badge */}
            {!collapsed && (
                <>
                    <span className="relative flex-1 truncate text-left font-medium text-white">{item.label}</span>
                    {item.badge && (
                        <span className="relative rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-[0_0_14px_rgba(245,158,11,0.32)]">
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </motion.button>
        {/* Tooltip when collapsed */}
        {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-amber-500/20 bg-[#16181f] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-[0_0_24px_rgba(245,158,11,0.12)] transition-opacity group-hover:opacity-100">
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
        <div className="flex h-full flex-col overflow-hidden rounded-r-[28px] border-r border-amber-500/10 bg-[#0b0b0d] shadow-[0_24px_80px_-48px_rgba(0,0,0,1)]">
            <div className={`border-b border-sidebar-border ${collapsed ? 'px-3 py-5' : 'px-4 py-5'}`}>
                <Logo collapsed={collapsed} />
            </div>

            {/* Section label */}
            {!collapsed && (
                <div className="px-4 pt-4 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Main Menu</p>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
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
            <div className="border-t border-sidebar-border p-3">
                <div className={`rounded-2xl border border-white/5 bg-[linear-gradient(145deg,#15181f,#0f1116)] p-3 shadow-[8px_8px_18px_rgba(0,0,0,0.42),-6px_-6px_14px_rgba(255,255,255,0.02)] ${collapsed ? 'flex justify-center' : 'flex items-center gap-3'}`}>
                    <div className="relative group flex-shrink-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">{userInitials}</span>
                        </div>
                        {collapsed && (
                            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-amber-500/20 bg-[#16181f] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-[0_0_24px_rgba(245,158,11,0.12)] transition-opacity group-hover:opacity-100">
                                {currentUser.name}<br />
                                <span className="text-[#7e8a98]">{currentUser.role}</span>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-[#7e8a98]">{currentUser.role}</p>
                            </div>
                            <motion.button
                                onClick={onLogout}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="rounded-lg p-1.5 text-white/65 transition-colors hover:bg-red-500/10 hover:text-red-400"
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
const Sidebar = ({ currentView, setCurrentView, isOpen, setIsOpen, currentUser, onLogout, permissions, settings }: SidebarProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const effectiveCollapsed = collapsed && !isHovered;

    return (
        <>
            <div className="hidden md:block flex-shrink-0 no-print">
                <motion.aside
                    initial={false}
                    animate={{ width: effectiveCollapsed ? 84 : 280 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className="relative h-full"
                >
                    <button
                        type="button"
                        onClick={() => setCollapsed((value) => !value)}
                        className="absolute right-3 top-4 z-10 rounded-full border border-amber-500/15 bg-[#17191f] p-1.5 text-white/70 shadow-[6px_6px_14px_rgba(0,0,0,0.42),-4px_-4px_10px_rgba(255,255,255,0.02)] transition-colors hover:border-amber-400/30 hover:text-amber-200"
                        title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <span className="block h-4 w-4">{effectiveCollapsed ? ICONS.chevronRight : ICONS.chevronLeft}</span>
                    </button>
                    <SidebarContent
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        permissions={permissions}
                        settings={settings}
                        currentUser={currentUser}
                        onLogout={onLogout}
                        collapsed={effectiveCollapsed}
                    />
                </motion.aside>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="md:hidden no-print">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 z-40 h-full w-[min(18rem,calc(100vw-0.75rem))] max-w-full"
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
};

export default Sidebar;
