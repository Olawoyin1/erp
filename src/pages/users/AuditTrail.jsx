import { useEffect, useState } from 'react';
import { apiError } from '../../services/apiHelpers';
import { auditActionLabel, auditReason, formatDateTime } from './auditFormat';

const head = { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B' };

/**
 * Audit trail table for one record. `fetchPage({ page, limit })` must return the axios promise of a paginated
 * audit-log route (`/users/:id/audit-log`, `/roles/:id/audit-log`) and must be a stable function; rows carry
 * `actorName`.
 */
export default function AuditTrail({ fetchPage, pageSize = 10 }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // First page (and every retry): setState only runs in the promise callbacks.
  useEffect(() => {
    let cancelled = false;
    fetchPage({ page: 1, limit: pageSize })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data);
        setMeta(res.data.meta);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(apiError(err, 'Could not load the audit trail'));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, pageSize, attempt]);

  const loadMore = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPage({ page: (meta?.page || 1) + 1, limit: pageSize });
      setRows((prev) => [...prev, ...res.data.data]);
      setMeta(res.data.meta);
    } catch (err) {
      setError(apiError(err, 'Could not load more entries'));
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    if (rows.length) {
      loadMore();
    } else {
      setLoading(true);
      setAttempt((n) => n + 1);
    }
  };

  return (
    <div>
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1fr', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 14px' }}>
          <span style={head}>Date &amp; Time</span>
          <span style={head}>Action</span>
          <span style={head}>Changed By</span>
        </div>

        {rows.map((entry, i) => (
          <div
            key={entry._id}
            style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1fr', padding: '12px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.813rem' }}
          >
            <span style={{ color: '#475569' }}>{formatDateTime(entry.at)}</span>
            <span style={{ color: '#0F172A', fontWeight: 500 }}>
              {auditActionLabel(entry.action)}
              {auditReason(entry) && (
                <span style={{ display: 'block', fontWeight: 400, color: '#64748B', fontSize: '0.75rem', marginTop: 2 }}>
                  Reason: {auditReason(entry)}
                </span>
              )}
            </span>
            <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{entry.actorName || 'System'}</span>
          </div>
        ))}

        {loading && rows.length === 0 &&
          [1, 2, 3].map((k) => (
            <div key={k} style={{ padding: '14px' }}>
              <div style={{ height: 12, borderRadius: 4, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            </div>
          ))}

        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: '28px 14px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No audit entries yet.</div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={retry} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {meta && meta.page < meta.totalPages && !error && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn btn-secondary" disabled={loading} onClick={loadMore} style={{ padding: '7px 16px' }}>
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
      <style>{'@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </div>
  );
}
