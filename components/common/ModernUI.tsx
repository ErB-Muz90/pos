import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Accent = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

const accentMap: Record<Accent, { soft: string; text: string; wash: string }> = {
    violet: {
        soft: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
        text: 'text-violet-700 dark:text-violet-300',
        wash: 'from-violet-500/18 via-violet-500/8 to-transparent',
    },
    emerald: {
        soft: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        text: 'text-emerald-700 dark:text-emerald-300',
        wash: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
    },
    blue: {
        soft: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
        text: 'text-blue-700 dark:text-blue-300',
        wash: 'from-blue-500/18 via-blue-500/8 to-transparent',
    },
    amber: {
        soft: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        text: 'text-amber-700 dark:text-amber-300',
        wash: 'from-amber-500/18 via-amber-500/8 to-transparent',
    },
    rose: {
        soft: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
        text: 'text-rose-700 dark:text-rose-300',
        wash: 'from-rose-500/18 via-rose-500/8 to-transparent',
    },
    slate: {
        soft: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
        text: 'text-slate-700 dark:text-slate-300',
        wash: 'from-slate-500/18 via-slate-500/8 to-transparent',
    },
};

export const ModernShell: React.FC<{
    eyebrow?: string;
    title: string;
    description: string;
    actions?: ReactNode;
    children: ReactNode;
}> = ({ eyebrow, title, description, actions, children }) => (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_26%)] px-4 py-5 md:px-6 md:py-6">
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    {eyebrow ? (
                        <span className="mb-3 inline-flex rounded-full bg-violet-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                            {eyebrow}
                        </span>
                    ) : null}
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>
            {children}
        </div>
    </div>
);

export const ModernPanel: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 ${className}`}>
        {children}
    </div>
);

export const ModernStatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: ReactNode;
    accent?: Accent;
}> = ({ title, value, subtitle, icon, accent = 'violet' }) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/88 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72"
    >
        <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${accentMap[accent].wash}`} />
        <div className="relative">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentMap[accent].soft}`}>
                {icon}
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
            {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
    </motion.div>
);

export const ModernButton: React.FC<{
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}> = ({ children, onClick, className = '', type = 'button', disabled, variant = 'primary' }) => {
    const variants = {
        primary: 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
        secondary: 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-800',
        ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70',
        danger: 'bg-rose-500 text-white hover:bg-rose-600',
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
};

export const ModernSearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>
        <input
            {...props}
            className={`w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white ${props.className || ''}`}
        />
    </div>
);

export const ModernInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white ${props.className || ''}`}
    />
);

export const ModernSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className={`rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white ${props.className || ''}`}
    />
);

export const ModernTableShell: React.FC<{ children: ReactNode; title?: string; description?: string; actions?: ReactNode }> = ({ children, title, description, actions }) => (
    <ModernPanel className="overflow-hidden p-0">
        {(title || description || actions) ? (
            <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-5 dark:border-white/10 md:flex-row md:items-center md:justify-between">
                <div>
                    {title ? <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2> : null}
                    {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
        ) : null}
        <div className="overflow-x-auto">{children}</div>
    </ModernPanel>
);

export const ModernEmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
);
