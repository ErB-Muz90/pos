import React, { useEffect, useState } from 'react';
import { fetchApi } from '../utils/api';

interface DlqEntry {
  id: string;
  eventType: string;
  amount?: number;
  deviceId?: string;
  createdAt: string;
  lastError: string;
  retryCount: number;
  status: 'DLQ' | 'VOIDED_BY_MANAGER' | 'RESOLVED';
  payload?: any;
}

interface SyncIssuesViewProps {
  managerPin?: string;
  onRequestManagerPin: (onSuccess: () => void) => void;
}

const SyncIssuesView: React.FC<SyncIssuesViewProps> = ({ onRequestManagerPin }) => {
  const [entries, setEntries] = useState<DlqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/sync/dlq') as DlqEntry[];
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load sync issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await fetchApi(`/sync/dlq/${id}/retry`, { method: 'POST' });
      await load();
    } catch (e: any) {
      setError(e.message || 'Retry failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoid = (id: string) => {
    onRequestManagerPin(async () => {
      setActionLoading(id);
      try {
        await fetchApi(`/sync/dlq/${id}/void`, { method: 'POST' });
        await load();
      } catch (e: any) {
        setError(e.message || 'Void failed.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const handlePostManually = (id: string) => {
    onRequestManagerPin(async () => {
      setActionLoading(id);
      try {
        await fetchApi(`/sync/dlq/${id}/post-manually`, { method: 'POST' });
        await load();
      } catch (e: any) {
        setError(e.message || 'Manual post failed.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  if (loading) return <div className="p-8 text-slate-500">Loading sync issues...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Sync Issues</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Events that failed to sync after 5 retries. Each requires manual resolution before the shift can close.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">No sync issues</p>
          <p className="text-sm mt-1">All events have synced successfully.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      DLQ
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{entry.eventType}</span>
                    {entry.amount != null && (
                      <span className="text-slate-600 text-sm">KES {entry.amount.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {new Date(entry.createdAt).toLocaleString()} · {entry.retryCount} retries
                  </p>
                  <p className="text-xs text-red-600 mt-1 truncate">{entry.lastError}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRetry(entry.id)}
                    disabled={actionLoading === entry.id}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => handlePostManually(entry.id)}
                    disabled={actionLoading === entry.id}
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    Post manually
                  </button>
                  <button
                    onClick={() => handleVoid(entry.id)}
                    disabled={actionLoading === entry.id}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    Void
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncIssuesView;
