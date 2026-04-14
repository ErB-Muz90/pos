import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Account, AuditLog, DriveUser, Settings, ToastData, User } from '../types';
import BusinessInfoSettings from './settings/BusinessInfoSettings';
import { TaxSettings } from './settings/TaxSettings';
import UsersPermissionsSettings from './settings/UsersPermissionsSettings';
import ReceiptSettings from './settings/ReceiptSettings';
import AuditLogSettings from './settings/AuditLogSettings';
import LoyaltySettings from './settings/LoyaltySettings';
import DiscountSettings from './settings/DiscountSettings';
import HardwareSettings from './settings/HardwareSettings';
import PaymentMethodsSettings from './settings/PaymentMethodsSettings';
import InventorySettings from './settings/InventorySettings';
import DataManagementSettings from './settings/DataManagementSettings';
import LayawaySettings from './settings/LayawaySettings';
import { CategorySettings } from './settings/CategorySettings';
import { ICONS } from '../constants';
import { ModernShell } from './common/ModernUI';

interface SettingsViewProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    users: User[];
    auditLogs: AuditLog[];
    showToast: (message: string, type: ToastData['type']) => void;
    onBackup: () => void;
    onRestoreRequest: (file: File) => void;
    onFactoryResetRequest: () => void;
    openModalId?: string | null;
    onModalOpened?: () => void;
    onTestBarcodePrint: () => void;
    onInitDrive: () => void;
    isDriveReady: boolean;
    isDriveInitializing: boolean;
    isDriveAuthenticated: boolean;
    driveUser: DriveUser | null;
    onDriveSignIn: () => void;
    onDriveSignOut: () => void;
    onDriveBackup: () => void;
    onDriveRestore: () => void;
    onDriveBackupAuditLogs: () => void;
    isDriveConfigured: boolean;
}

const SettingsModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.96, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 18, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/92 shadow-[0_35px_100px_-50px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90"
            onClick={(event) => event.stopPropagation()}
        >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5 dark:border-white/10">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Settings Module</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
                </div>
                <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:bg-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
            </div>
            <div className="overflow-y-auto p-6">{children}</div>
        </motion.div>
    </motion.div>
);

const SettingsCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; eyebrow: string }> = ({ title, description, icon, onClick, eyebrow }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/88 p-6 text-left shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72"
    >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-violet-500/16 via-violet-500/8 to-transparent" />
        <div className="relative">
            <span className="inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                {eyebrow}
            </span>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/6 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                {icon}
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            <div className="mt-5 text-sm font-semibold text-violet-700 dark:text-violet-300">Open settings</div>
        </div>
    </motion.button>
);

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    useEffect(() => {
        if (props.openModalId) {
            setActiveModal(props.openModalId);
        }
    }, [props.openModalId]);

    useEffect(() => {
        if (props.onInitDrive) {
            props.onInitDrive();
        }
    }, [props.onInitDrive]);

    const handleCloseModal = () => {
        setActiveModal(null);
        if (props.onModalOpened) {
            props.onModalOpened();
        }
    };

    const handleUpdateAndClose = (newSettings: Partial<Settings>) => {
        props.onUpdateSettings(newSettings);
        handleCloseModal();
        props.showToast('Settings saved!', 'success');
    };

    const settingsConfig = {
        'business-info': {
            title: 'Business Information',
            eyebrow: 'Identity',
            description: 'Set your company name, KRA PIN, logo, and location.',
            icon: ICONS.business,
            component: <BusinessInfoSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} showToast={props.showToast} />,
        },
        'hardware-settings': {
            title: 'Hardware & Peripherals',
            eyebrow: 'Devices',
            description: 'Configure receipt printers, barcode scanners, and other hardware.',
            icon: ICONS.hardware,
            component: <HardwareSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} showToast={props.showToast} onTestBarcodePrint={props.onTestBarcodePrint} />,
        },
        'receipt-settings': {
            title: 'Receipt & Invoice',
            eyebrow: 'Documents',
            description: 'Customize receipt footers and document numbering.',
            icon: ICONS.receipt,
            component: <ReceiptSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'tax-config': {
            title: 'VAT & Tax',
            eyebrow: 'Compliance',
            description: 'Configure VAT rates and default product pricing.',
            icon: ICONS.tax,
            component: <TaxSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'discount-settings': {
            title: 'Discounts',
            eyebrow: 'Pricing',
            description: 'Enable and set limits for POS transaction discounts.',
            icon: ICONS.discount,
            component: <DiscountSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'loyalty-settings': {
            title: 'Loyalty Program',
            eyebrow: 'Retention',
            description: 'Manage how customers earn and redeem loyalty points.',
            icon: ICONS.loyalty,
            component: <LoyaltySettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'layaway-settings': {
            title: 'Layaway Program',
            eyebrow: 'Collections',
            description: 'Set minimum deposit percentages and maximum payment durations.',
            icon: ICONS.layaway,
            component: <LayawaySettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'payment-methods': {
            title: 'Payment Methods Display',
            eyebrow: 'Payments',
            description: 'Configure bank accounts, M-Pesa details, and payment info shown on documents.',
            icon: ICONS.mpesa,
            component: <PaymentMethodsSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} showToast={props.showToast} />,
        },
        'inventory-settings': {
            title: 'Inventory Settings',
            eyebrow: 'Stock',
            description: 'Manage stock alerts and inventory defaults.',
            icon: ICONS.inventory,
            component: <InventorySettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'category-settings': {
            title: 'Product Categories & Units',
            eyebrow: 'Catalog',
            description: 'Add, edit, and organize product categories and measurement units.',
            icon: ICONS.categories,
            component: <CategorySettings settings={props.settings} onUpdateSettings={props.onUpdateSettings} showToast={props.showToast} />,
        },
        'users-perms': {
            title: 'Users & Permissions',
            eyebrow: 'Access',
            description: 'Manage access rights and permissions for each staff role.',
            icon: ICONS.users,
            component: <UsersPermissionsSettings settings={props.settings} onUpdateSettings={props.onUpdateSettings} />,
        },
        'audit-log': {
            title: 'Audit Log',
            eyebrow: 'Security',
            description: 'View important actions taken in the system.',
            icon: ICONS.audit,
            component: <AuditLogSettings auditLogs={props.auditLogs} users={props.users} onDriveBackupAuditLogs={props.onDriveBackupAuditLogs} isDriveAuthenticated={props.isDriveAuthenticated} />,
        },
        'data-management': {
            title: 'Data Management',
            eyebrow: 'Recovery',
            description: 'Backup, restore, or reset all application data.',
            icon: ICONS.data,
            component: (
                <DataManagementSettings
                    onBackup={props.onBackup}
                    onRestoreRequest={props.onRestoreRequest}
                    onFactoryResetRequest={props.onFactoryResetRequest}
                    onClose={handleCloseModal}
                    isDriveInitializing={props.isDriveInitializing}
                    isDriveReady={props.isDriveReady}
                    isDriveAuthenticated={props.isDriveAuthenticated}
                    driveUser={props.driveUser}
                    onDriveSignIn={props.onDriveSignIn}
                    onDriveSignOut={props.onDriveSignOut}
                    onDriveBackup={props.onDriveBackup}
                    onDriveRestore={props.onDriveRestore}
                    isDriveConfigured={props.isDriveConfigured}
                />
            ),
        },
    };

    return (
        <ModernShell
            eyebrow="System Configuration"
            title="Settings"
            description="Business setup, peripherals, tax, permissions, and recovery controls now share the same modern settings index."
        >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(settingsConfig).map(([key, config]) => (
                    <SettingsCard
                        key={key}
                        title={config.title}
                        description={config.description}
                        icon={config.icon}
                        eyebrow={config.eyebrow}
                        onClick={() => setActiveModal(key)}
                    />
                ))}
            </div>

            <AnimatePresence>
                {activeModal && settingsConfig[activeModal as keyof typeof settingsConfig] && (
                    <SettingsModal title={settingsConfig[activeModal as keyof typeof settingsConfig].title} onClose={handleCloseModal}>
                        {settingsConfig[activeModal as keyof typeof settingsConfig].component}
                    </SettingsModal>
                )}
            </AnimatePresence>
        </ModernShell>
    );
};

export default SettingsView;
