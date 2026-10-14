import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRepeat } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, DatePicker } from '../../../components/ui/FormField';
import { holidayService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, ymd } from '../hrUtils';

const longDate = (value) => new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Public holidays decide which days count as leave days, so leave managers can see and (with hr.holiday.manage) maintain them here. */
export default function HolidaysDrawer({ onClose, showToast }) {
  const canManage = usePermission('hr.holiday.manage');
  const thisYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(thisYear);
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', recurring: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    holidayService.list(year)
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Could not load public holidays') }); });
    return () => { cancelled = true; };
  }, [year, attempt]);

  const changeYear = (delta) => { setState((s) => ({ ...s, loading: true })); setYear((y) => y + delta); };

  const startEdit = (holiday) => {
    setEditing(holiday || {});
    setForm({ name: holiday?.name || '', date: ymd(holiday?.date), recurring: !!holiday?.recurring });
    setErrors({});
  };

  const save = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter the holiday name';
    if (!form.date) next.date = 'Choose the date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), date: form.date, recurring: form.recurring };
      if (editing?._id) await holidayService.update(editing._id, body);
      else await holidayService.create(body);
      showToast(editing?._id ? 'Public holiday updated' : 'Public holiday added', 'success');
      setEditing(null);
      reload();
    } catch (err) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(err), form: apiError(err, 'The holiday could not be saved') }));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (holiday) => {
    if (!window.confirm(`Remove ${holiday.name}? Leave durations are computed from the current list.`)) return;
    try {
      await holidayService.remove(holiday._id);
      showToast('Public holiday removed', 'success');
      reload();
    } catch (err) {
      showToast(apiError(err, 'The holiday could not be removed'), 'error');
    }
  };

  const sorted = [...state.items].sort((a, b) => {
    const da = a.recurring ? new Date(Date.UTC(year, new Date(a.date).getUTCMonth(), new Date(a.date).getUTCDate())) : new Date(a.date);
    const db = b.recurring ? new Date(Date.UTC(year, new Date(b.date).getUTCMonth(), new Date(b.date).getUTCDate())) : new Date(b.date);
    return da - db;
  });
  const shownDate = (h) => (h.recurring ? longDate(new Date(Date.UTC(year, new Date(h.date).getUTCMonth(), new Date(h.date).getUTCDate()))) : longDate(h.date));

  return (
    <Drawer isOpen onClose={onClose} title="Public Holidays" subtitle="Weekends and these days are not counted as leave days" width="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => changeYear(-1)} style={{ padding: '4px 10px' }}>&lt;</button>
            <strong>{year}</strong>
            <button className="btn btn-secondary" onClick={() => changeYear(1)} style={{ padding: '4px 10px' }}>&gt;</button>
          </div>
          {canManage && (
            <button onClick={() => startEdit(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
              <FiPlus size={13} /> Add holiday
            </button>
          )}
        </div>

        {editing && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#F8FAFC' }}>
            {errors.form && <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>{errors.form}</div>}
            <FormField label="Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((x) => ({ ...x, name: undefined })); }} placeholder="e.g. Eid al-Fitr" />
            </FormField>
            <FormField label="Date" required error={errors.date}>
              <DatePicker value={form.date} error={!!errors.date} onChange={(e) => { setForm((f) => ({ ...f, date: e.target.value })); setErrors((x) => ({ ...x, date: undefined })); }} />
            </FormField>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155' }}>
              <input type="checkbox" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} style={{ accentColor: '#1D4ED8' }} />
              Repeats on the same date every year
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding: '7px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}

        {state.error ? (
          <div style={{ padding: 14, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.85rem' }}>{state.error}</div>
        ) : state.loading ? (
          <div style={{ padding: 20, color: '#94A3B8', textAlign: 'center' }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 20, color: '#94A3B8', textAlign: 'center', fontSize: '0.85rem' }}>No public holidays recorded for {year}. Moveable holidays such as Eid and Easter must be added each year.</div>
        ) : (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
            {sorted.map((h, i) => (
              <div key={h._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i < sorted.length - 1 ? '1px solid #F1F5F9' : 'none', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {h.name} {h.recurring && <FiRepeat size={12} color="#94A3B8" title="Repeats every year" />}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{shownDate(h)}</div>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" title="Edit" onClick={() => startEdit(h)}><FiEdit2 size={14} /></button>
                    <button className="icon-btn" title="Remove" onClick={() => remove(h)}><FiTrash2 size={14} color="#DC2626" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
