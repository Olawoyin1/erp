import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { holidayService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import ConfirmDialog from '../users/ConfirmDialog';
import { EmptyState, ErrorBanner, LinkButton, PanelHeader, PanelSkeleton, PrimaryButton, SectionCard, StatusTag } from './settingsShared';
import { dateInput, detailErrors, tableCell, tableHead } from './settingsUtils';

const GRID = '2fr 1.2fr 1fr 1fr';

function HolidayModal({ holiday, onClose, onSaved, showToast }) {
  const isEditing = !!holiday;
  const [form, setForm] = useState({ name: holiday?.name || '', date: dateInput(holiday?.date), recurring: holiday?.recurring ? 'yes' : 'no' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };

  const save = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.date) errs.date = 'Choose the date';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const body = { name: form.name.trim(), date: form.date, recurring: form.recurring === 'yes' };
      if (isEditing) await holidayService.update(holiday._id, body);
      else await holidayService.create(body);
      showToast(isEditing ? 'Public holiday updated' : 'Public holiday added', 'success');
      onSaved();
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save the holiday'));
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edit Public Holiday' : 'Add Public Holiday'}
      maxWidth="480px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
        </>
      }
    >
      <ErrorBanner message={formError} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Holiday Name" required error={errors.name} style={{ gridColumn: '1 / -1' }}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Independence Day" maxLength={150} error={!!errors.name} />
        </FormField>
        <FormField label="Date" required error={errors.date}>
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} error={!!errors.date} />
        </FormField>
        <FormField label="Repeats Every Year">
          <Select value={form.recurring} onChange={(e) => set('recurring', e.target.value)} options={[{ value: 'yes', label: 'Yes, same day each year' }, { value: 'no', label: 'No, this date only' }]} />
        </FormField>
      </div>
    </Modal>
  );
}

export default function HolidaysTab({ showToast }) {
  const canManage = usePermission('hr.holiday.manage');
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(String(thisYear));
  const [modal, setModal] = useState({ open: false, holiday: null });
  const [removeState, setRemoveState] = useState({ holiday: null, busy: false, error: '' });
  const api = useApi(() => holidayService.list({ year: Number(year) }), [year]);

  const holidays = [...(api.data?.data || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map((y) => ({ value: String(y), label: String(y) }));

  const remove = async () => {
    const { holiday } = removeState;
    setRemoveState((s) => ({ ...s, busy: true, error: '' }));
    try {
      await holidayService.remove(holiday._id);
      showToast('Public holiday deleted', 'success');
      setRemoveState({ holiday: null, busy: false, error: '' });
      api.reload();
    } catch (err) {
      setRemoveState((s) => ({ ...s, busy: false, error: apiError(err, 'Could not delete the holiday') }));
    }
  };

  return (
    <div>
      <PanelHeader title="Public Holidays" subtitle="Days that do not count as working days for leave, attendance and reminders" />
      <SectionCard
        title="Holiday Calendar"
        action={canManage && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setModal({ open: true, holiday: null })}>Add Holiday</PrimaryButton>}
      >
        <div style={{ maxWidth: 160, marginBottom: 14 }}>
          <Select value={year} onChange={(e) => setYear(e.target.value)} options={yearOptions} />
        </div>
        <ErrorBanner message={api.error} onRetry={api.reload} />
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
          {['Holiday', 'Date', 'Repeats', 'Actions'].map((h) => <span key={h} style={tableHead}>{h}</span>)}
        </div>
        {api.loading && !api.data && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={4} /></div>}
        {!api.loading && !api.error && holidays.length === 0 && <EmptyState>No public holidays recorded for {year}.</EmptyState>}
        {holidays.map((h) => (
          <div key={h._id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, alignItems: 'center' }}>
            <span style={{ ...tableCell, fontWeight: 600 }}>{h.name}</span>
            <span style={tableCell}>{dateInput(h.date)}</span>
            <span style={tableCell}><StatusTag active={!!h.recurring} activeLabel="Every year" inactiveLabel="One-off" /></span>
            <span style={tableCell}>
              {canManage && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <LinkButton onClick={() => setModal({ open: true, holiday: h })}>Edit</LinkButton>
                  <LinkButton tone="danger" onClick={() => setRemoveState({ holiday: h, busy: false, error: '' })}>Delete</LinkButton>
                </div>
              )}
            </span>
          </div>
        ))}
      </SectionCard>

      {modal.open && (
        <HolidayModal key={modal.holiday?._id || 'new'} holiday={modal.holiday} onClose={() => setModal({ open: false, holiday: null })} onSaved={() => { setModal({ open: false, holiday: null }); api.reload(); }} showToast={showToast} />
      )}

      <ConfirmDialog
        open={!!removeState.holiday}
        title="Delete this public holiday?"
        description="The day will count as a working day again."
        subject={removeState.holiday?.name}
        subjectDetail={removeState.holiday ? dateInput(removeState.holiday.date) : ''}
        confirmLabel="Delete Holiday"
        tone="danger"
        busy={removeState.busy}
        error={removeState.error}
        onConfirm={remove}
        onClose={() => setRemoveState({ holiday: null, busy: false, error: '' })}
      />
    </div>
  );
}
