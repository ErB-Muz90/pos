import React, { useMemo } from 'react';
import { getCloudConfirmedCash } from '../../utils/serverSync';

interface CashBalanceDisplayProps {
  estimatedBalance: number;
  currency?: string;
  /** If true, blocks payout and shows override prompt */
  onPayoutGuardBlock?: () => void;
  payoutAmount?: number;
}

const AMBER_THRESHOLD_MS = 2 * 60 * 60 * 1000;  // 2 hours
const RED_THRESHOLD_MS   = 8 * 60 * 60 * 1000;  // 8 hours
const PAYOUT_GUARD_AMOUNT = 500;                  // KES 500

const CashBalanceDisplay: React.FC<CashBalanceDisplayProps> = ({
  estimatedBalance,
  currency = 'KES',
  onPayoutGuardBlock,
  payoutAmount,
}) => {
  const cloudData = getCloudConfirmedCash();

  const { staleness, color, label } = useMemo(() => {
    if (!cloudData) return { staleness: null, color: 'text-slate-500', label: 'Not yet synced' };
    const ageMs = Date.now() - new Date(cloudData.syncedAt).getTime();
    const mins = Math.floor(ageMs / 60000);
    const label = mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)}h ago`;
    if (ageMs > RED_THRESHOLD_MS) return { staleness: ageMs, color: 'text-red-600', label };
    if (ageMs > AMBER_THRESHOLD_MS) return { staleness: ageMs, color: 'text-amber-600', label };
    return { staleness: ageMs, color: 'text-emerald-600', label };
  }, [cloudData]);

  // Gap 6 — F5: Payout guard — block payouts >500 if last sync >2h
  const isPayoutBlocked = useMemo(() => {
    if (!onPayoutGuardBlock || !payoutAmount || payoutAmount <= PAYOUT_GUARD_AMOUNT) return false;
    if (!cloudData) return true;
    const ageMs = Date.now() - new Date(cloudData.syncedAt).getTime();
    return ageMs > AMBER_THRESHOLD_MS;
  }, [cloudData, payoutAmount, onPayoutGuardBlock]);

  React.useEffect(() => {
    if (isPayoutBlocked && onPayoutGuardBlock) {
      onPayoutGuardBlock();
    }
  }, [isPayoutBlocked, onPayoutGuardBlock]);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Cash on hand (estimated)</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">
        {currency} {estimatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>

      {cloudData ? (
        <div className={`flex items-center gap-1.5 text-xs ${color}`}>
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <span>
            Last cloud-confirmed: {currency} {cloudData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} · synced {label}
          </span>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Cloud balance not yet confirmed for this session.</p>
      )}

      {staleness !== null && staleness > RED_THRESHOLD_MS && (
        <p className="text-xs text-red-600 font-medium mt-1">
          ⚠ Balance unconfirmed — multi-device accuracy not guaranteed.
        </p>
      )}
    </div>
  );
};

export default CashBalanceDisplay;
