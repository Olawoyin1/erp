import { useState, useEffect } from 'react';
import { FiUser, FiCheck, FiX, FiEdit2, FiPaperclip, FiDownload } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { FormField, Textarea } from '../../../components/ui/FormField';
import { leaveService } from '../../../services/hr.service';
import { apiError, formatDate, titleCase } from '../../../services/apiHelpers';
import { fullName } from '../hrUtils';

const STATUS = {
  pending:  { bg: '#FEF3C7', color: '#92400E' },
  approved: { bg: '#DCFCE7', color: '#166534' },
  declined: { bg: '#FEE2E2', color: '#991B1B' },
};

const stamp = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-GB')} • ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const dotColor = (action) => {
  if (action.includes('approved')) return '#16A34A';
  if (action.includes('declined')) return '#DC2626';
  if (action.includes('changes')) return '#EA580C';
  return '#1E3A8A';
};

/**
 * Leave request details with approval history from `GET /leave-requests/:id/history`.
 * `canDecide` is false for the person's own request. Handlers resolve to an error message or nothing.
 */
export default function LeaveDetailsModal({ leave, canDecide, ownRequest, onClose, onApprove, onDecline, onRequestChanges, showToast }) {
  const [showChanges, setShowChanges] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState({ id: null, items: [], error: '' });
  const leaveId = leave._id;

  useEffect(() => {
    let cancelled = false;
    leaveService.history(leaveId)
      .then((res) => { if (!cancelled) setHistory({ id: leaveId, items: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setHistory({ id: leaveId, items: [], error: apiError(err, 'History could not be loaded') }); });
    return () => { cancelled = true; };
  }, [leaveId, leave.status]);

  const loaded = history.id === leaveId;
  const isPending = leave.status === 'pending';
  const st = STATUS[leave.status] || STATUS.pending;

  const run = async (fn) => {
    setBusy(true);
    setError('');
    const result = await fn();
    setBusy(false);
    if (result) setError(result);
  };

  const sendChanges = () => run(async () => {
    if (!message.trim()) return 'Describe the changes needed';
    const result = await onRequestChanges(leave, message.trim());
    if (!result) { setShowChanges(false); setMessage(''); }
    return result;
  });

  const openAttachment = async () => {
    try {
      const res = await leaveService.attachmentUrl(leaveId);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const duration = leave.durationDays != null ? `${leave.durationDays} ${leave.durationDays === 1 ? 'Day' : 'Days'}` : '—';

  return (
    <Modal isOpen onClose={onClose} title="Leave Request Details" subtitle={`${fullName(leave.employeeId)} • ${leave.leaveId}`} maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
          <FiUser size={15} color="#1D4ED8" />
          <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
          <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600, backgroundColor: st.bg, color: st.color }}>{titleCase(leave.status)}</span>
          {isPending && canDecide && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <button disabled={busy} onClick={() => run(() => onApprove(leave))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: '0.81rem', fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: '#059669', color: '#fff', cursor: 'pointer' }}><FiCheck size={13} /> Approve</button>
              <button disabled={busy} onClick={() => onDecline(leave)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: '0.81rem', fontWeight: 600, borderRadius: 6, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}><FiX size={13} /> Reject</button>
              <button disabled={busy} onClick={() => setShowChanges((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: '0.81rem', fontWeight: 500, borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}><FiEdit2 size={13} /> Request Changes</button>
            </div>
          )}
        </div>
        {isPending && ownRequest && (
          <div style={{ fontSize: '0.78rem', color: '#92400E', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px' }}>
            You cannot approve or decline your own leave request; another approver must decide it.
          </div>
        )}
        {error && <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>{error}</div>}
        {showChanges && (
          <div style={{ padding: 12, backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <FormField label="What needs to change?" required>
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Please attach a supporting medical document." />
            </FormField>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowChanges(false)}>Cancel</button>
              <button disabled={busy} onClick={sendChanges} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Send</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
          {[
            ['EMPLOYEE', fullName(leave.employeeId)],
            ['LEAVE TYPE', leave.leaveTypeId?.name],
            ['START DATE', formatDate(leave.startDate)],
            ['END DATE', formatDate(leave.endDate)],
            ['DURATION', `${duration} (working days)`],
            ['STATUS', titleCase(leave.status)],
            ...(leave.decidedBy ? [['DECIDED BY', fullName(leave.decidedBy)], ['DECIDED ON', formatDate(leave.decidedAt)]] : []),
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: '#0F172A' }}>{value || '—'}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>REASON</div>
          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{leave.reason || '—'}</div>
          {leave.declineReason && <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#991B1B' }}>Declined: {leave.declineReason}</div>}
        </div>

        {leave.attachmentId && (
          <button onClick={openAttachment} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#1D4ED8' }}>
            <FiPaperclip size={14} /> Supporting document <FiDownload size={13} />
          </button>
        )}

        <div>
          <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>APPROVAL HISTORY</div>
          {history.error ? (
            <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>{history.error}</div>
          ) : !loaded ? (
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Loading…</div>
          ) : history.items.length === 0 ? (
            <div style={{ fontSize: '0.813rem', color: '#94A3B8' }}>No history yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 12 }}>
              <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, backgroundColor: '#E2E8F0' }} />
              {history.items.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 3, backgroundColor: dotColor(h.action) }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{stamp(h.occurredAt)}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{h.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 1 }}>{h.actorName ? `By ${h.actorName}` : ''}{h.reason ? `${h.actorName ? '. ' : ''}${h.reason}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
