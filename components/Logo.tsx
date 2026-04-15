import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
    layout?: 'horizontal' | 'vertical';
    variant?: 'full' | 'icon' | 'horizontal';
    collapsed?: boolean;
    className?: string;
    animated?: boolean;
}

const LogoIcon: React.FC<{ animated?: boolean; compact?: boolean }> = ({ animated = true, compact = false }) => (
    <div className="relative flex-shrink-0">
        {animated && (
            <>
                <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-2 rounded-[22px] border border-violet-400/20"
                />
                <motion.div
                    animate={{ scale: [1, 1.32, 1], opacity: [0.22, 0, 0.22] }}
                    transition={{ duration: 2.2, delay: 0.45, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-3 rounded-[26px] border border-indigo-400/15"
                />
            </>
        )}
        <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 shadow-[0_16px_40px_-20px_rgba(109,40,217,0.8)] ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/25 via-transparent to-transparent" />
            <span className={`relative font-black text-white drop-shadow-lg ${compact ? 'text-lg' : 'text-2xl'}`}>B</span>
            <div className={`absolute rounded-full bg-emerald-400 ring-2 ring-violet-600 ${compact ? '-right-0.5 -top-0.5 h-2.5 w-2.5' : '-right-1 -top-1 h-3 w-3'}`} />
        </div>
    </div>
);

const LogoText: React.FC = () => (
    <div className="flex flex-col">
        <span className="text-base font-black uppercase tracking-[0.16em] leading-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.18)] md:text-lg">
            BANDUKA POS
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-200/90 md:text-[10px]">
            Point Of Sale
        </span>
    </div>
);

const Logo: React.FC<LogoProps> = ({
    layout = 'vertical',
    variant,
    collapsed = false,
    className = '',
    animated = true,
}) => {
    const resolvedVariant = variant ?? (layout === 'horizontal' ? 'horizontal' : 'full');

    if (resolvedVariant === 'icon') {
        return (
            <div className={`inline-flex ${className}`}>
                <LogoIcon animated={animated} compact />
            </div>
        );
    }

    if (resolvedVariant === 'horizontal') {
        return (
            <div className={`flex min-w-0 items-center gap-3 ${className}`}>
                <LogoIcon animated={animated} compact={collapsed} />
                {!collapsed && <div className="min-w-0"><LogoText /></div>}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''} ${className}`}>
            <LogoIcon animated={animated} compact={collapsed} />
            {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    <LogoText />
                </motion.div>
            )}
        </div>
    );
};

export default Logo;
