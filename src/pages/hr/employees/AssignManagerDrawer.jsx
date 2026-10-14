import { useState } from 'react';
import Drawer from '../../../components/ui/Drawer';
import { FormField } from '../../../components/ui/FormField';
import EmployeePicker from '../EmployeePicker';

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

/** `onAssign(managerId)` resolves to an error message string when the server refuses, otherwise nothing. */
export default function AssignManagerDrawer({ employee, onClose, onAssign }) {
  const current = employee && typeof employee.reportingManagerId === 'object' ? employee.reportingManagerId : null;
  const [selectedId, setSelectedId] = useState(idOf(employee?.reportingManagerId) || '');
  const [selected, setSelected] = useState(current);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!selectedId) { setError('Choose the reporting manager'); return; }
    setSaving(true);
    const message = await onAssign(selectedId);
    setSaving(false);
    if (message) setError(message);
  };

  const unchanged = selectedId === (idOf(employee?.reportingManagerId) || '');

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem' }} onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary" disabled={!selectedId || unchanged || saving} onClick={handleSubmit}
        style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', opacity: (!selectedId || unchanged || saving) ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Update Supervisor'}
      </button>
    </>
  );

  return (
    <Drawer isOpen onClose={onClose} title="Assign Reporting Supervisor"
      subtitle={`Set direct operational reporting manager for ${employee?.fullName || 'employee'}`}
      width="420px" footer={footer}>
      <FormField label="Reporting manager" required error={error}>
        <EmployeePicker value={selectedId} selected={selected} params={{ activeOnly: 'true' }} excludeIds={[employee?._id]} error={!!error}
          onChange={(id, emp) => { setSelectedId(id); setSelected(emp); setError(''); }} />
      </FormField>
    </Drawer>
  );
}
