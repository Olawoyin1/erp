import { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { FormField, Textarea } from '../../../components/ui/FormField';

/**
 * `onDeactivate(reason)` resolves to nothing on success or `{ message, blockers }` when the server
 * refuses (409): `blockers` lists what the person still manages or heads, so HR knows what to reassign.
 */
export default function DeactivateModal({ employee, onClose, onDeactivate }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [blockers, setBlockers] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('A reason is required'); return; }
    setSaving(true);
    setError('');
    setBlockers([]);
    const failure = await onDeactivate(reason.trim());
    setSaving(false);
    if (failure) {
      setBlockers(failure.blockers || []);
      setError(failure.blockers?.length ? '' : failure.message);
    }
  };

  return (
    <Modal isOpen title="Deactivate Employee?" onClose={onClose} maxWidth="460px">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
          This employee will lose access to the system and will no longer appear as an active employee.
        </p>
        <div style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.7 }}>
          <div><strong>Employee:</strong> {employee.fullName}</div>
          <div><strong>Employee ID:</strong> {employee.employeeId}</div>
        </div>

        {blockers.length > 0 && (
          <div style={{ padding: '12px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, color: '#92400E', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
              <FiAlertCircle size={15} /> Reassign these before deactivating
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {blockers.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}

        <FormField label="Reason for deactivation" required error={error}>
          <Textarea rows={4} value={reason} error={!!error} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder="Enter commentary…" />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}
            style={{ padding: '8px 18px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Deactivating…' : 'Deactivate Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
