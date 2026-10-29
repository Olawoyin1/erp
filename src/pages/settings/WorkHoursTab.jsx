import { useState } from 'react';
import { FiClock, FiInfo } from 'react-icons/fi';
import { FormField, Input } from '../../components/ui/FormField';
import { settingsService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import Loaded from './Loaded';
import { ErrorBanner, FooterButtons, NoticeBanner, PanelHeader, SectionCard } from './settingsShared';
import { detailErrors, shallowEqual } from './settingsUtils';

const DAYS = [
  ['monday', 'Mon'], ['tuesday', 'Tue'], ['wednesday', 'Wed'], ['thursday', 'Thu'],
  ['friday', 'Fri'], ['saturday', 'Sat'], ['sunday', 'Sun'],
];

const hint = { margin: '6px 0 0', fontSize: '0.72rem', color: '#94A3B8' };

const toMinutes = (clock) => {
  const [h, m] = String(clock || '').split(':').map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const formatHours = (hours) => {
  const total = Math.round(Number(hours) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
};

const wholeNumber = (text, max) => {
  if (text === '' || !/^\d+$/.test(String(text))) return null;
  const value = Number(text);
  return value > max ? null : value;
};

function WorkHoursForm({ settings, canEdit, showToast }) {
  const initial = {
    ...Object.fromEntries(DAYS.map(([key]) => [key, !!settings.workingDays?.[key]])),
    startTime: settings.startTime,
    endTime: settings.endTime,
    graceMinutes: String(settings.graceMinutes ?? ''),
    breakMinutes: String(settings.breakMinutes ?? ''),
    earlyDepartureGraceMinutes: String(settings.earlyDepartureGraceMinutes ?? ''),
    standardDailyHours: settings.customStandardDailyHours == null ? '' : String(settings.customStandardDailyHours),
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const ro = !canEdit;
  const set = (name) => (e) => {
    setForm((p) => ({ ...p, [name]: e.target.value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };
  const toggleDay = (key) => {
    if (ro) return;
    setForm((p) => ({ ...p, [key]: !p[key] }));
    setErrors((p) => ({ ...p, workingDays: '' }));
    setFormError('');
  };

  const span = toMinutes(form.endTime) - toMinutes(form.startTime);
  const breakMinutes = wholeNumber(form.breakMinutes, 480) ?? 0;
  const derived = span > 0 ? Math.max(0, span - breakMinutes) / 60 : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (toMinutes(form.startTime) === null) errs.startTime = 'Enter a start time';
    if (toMinutes(form.endTime) === null) errs.endTime = 'Enter an end time';
    if (!errs.startTime && !errs.endTime && span <= 0) errs.endTime = 'The working day must end after it starts';
    const grace = wholeNumber(form.graceMinutes, 240);
    if (grace === null) errs.graceMinutes = 'Enter whole minutes from 0 to 240';
    const brk = wholeNumber(form.breakMinutes, 480);
    if (brk === null) errs.breakMinutes = 'Enter whole minutes from 0 to 480';
    else if (span > 0 && brk >= span) errs.breakMinutes = 'The break must be shorter than the working day';
    const early = wholeNumber(form.earlyDepartureGraceMinutes, 240);
    if (early === null) errs.earlyDepartureGraceMinutes = 'Enter whole minutes from 0 to 240';
    let standard = null;
    if (String(form.standardDailyHours).trim() !== '') {
      standard = Number(form.standardDailyHours);
      if (Number.isNaN(standard) || standard < 0.5 || standard > 24) errs.standardDailyHours = 'Enter hours from 0.5 to 24, or leave blank to calculate';
    }
    if (!DAYS.some(([key]) => form[key])) errs.workingDays = 'Choose at least one working day';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await settingsService.updateWorkHours({
        workingDays: Object.fromEntries(DAYS.map(([key]) => [key, !!form[key]])),
        startTime: form.startTime,
        endTime: form.endTime,
        graceMinutes: grace,
        breakMinutes: brk,
        earlyDepartureGraceMinutes: early,
        standardDailyHours: standard,
      });
      setSaved({ ...form });
      showToast('Work hours saved', 'success');
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save the work hours'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {ro && <NoticeBanner>You can see the work schedule but your role cannot change it.</NoticeBanner>}
      <ErrorBanner message={formError} />

      <SectionCard title="Working Days" subtitle="Days outside this list, and public holidays, count as non-working: any time worked is overtime.">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DAYS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="checkbox"
              aria-checked={form[key]}
              disabled={ro}
              onClick={() => toggleDay(key)}
              style={{
                minWidth: 56, padding: '9px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                border: `1px solid ${form[key] ? '#1D4ED8' : '#E2E8F0'}`,
                backgroundColor: form[key] ? '#EFF6FF' : '#F8FAFC',
                color: form[key] ? '#1D4ED8' : '#64748B',
                cursor: ro ? 'not-allowed' : 'pointer', opacity: ro ? 0.75 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.workingDays && <span style={{ display: 'block', marginTop: 8, fontSize: '0.75rem', color: '#DC2626', fontWeight: 500 }}>{errors.workingDays}</span>}
      </SectionCard>

      <SectionCard title="Working Hours" subtitle={`Times are read in the company time zone (${settings.timeZone}). Change the time zone under Company & Security.`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <FormField label="Start Time" error={errors.startTime}>
            <Input type="time" value={form.startTime} onChange={set('startTime')} disabled={ro} error={!!errors.startTime} />
          </FormField>
          <FormField label="End Time" error={errors.endTime}>
            <Input type="time" value={form.endTime} onChange={set('endTime')} disabled={ro} error={!!errors.endTime} />
          </FormField>
          <div>
            <FormField label="Unpaid Break (Minutes)" error={errors.breakMinutes}>
              <Input inputMode="numeric" value={form.breakMinutes} onChange={set('breakMinutes')} disabled={ro} error={!!errors.breakMinutes} />
            </FormField>
            <p style={hint}>Taken off the day when working out standard hours.</p>
          </div>
          <div>
            <FormField label="Lateness Grace (Minutes)" error={errors.graceMinutes}>
              <Input inputMode="numeric" value={form.graceMinutes} onChange={set('graceMinutes')} disabled={ro} error={!!errors.graceMinutes} />
            </FormField>
            <p style={hint}>Clocking in after start plus this many minutes marks the person Late.</p>
          </div>
          <div>
            <FormField label="Early Departure Grace (Minutes)" error={errors.earlyDepartureGraceMinutes}>
              <Input inputMode="numeric" value={form.earlyDepartureGraceMinutes} onChange={set('earlyDepartureGraceMinutes')} disabled={ro} error={!!errors.earlyDepartureGraceMinutes} />
            </FormField>
            <p style={hint}>Clocking out earlier than end time minus this is recorded as leaving early.</p>
          </div>
          <div>
            <FormField label="Standard Daily Hours" error={errors.standardDailyHours}>
              <Input inputMode="decimal" value={form.standardDailyHours} onChange={set('standardDailyHours')} placeholder={derived == null ? '' : String(derived)} disabled={ro} error={!!errors.standardDailyHours} />
            </FormField>
            <p style={hint}>{derived == null ? 'Set valid start and end times.' : `Leave blank to use the calculated ${formatHours(derived)} (end minus start minus break).`}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="How Attendance Uses This">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.83rem', color: '#475569', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', gap: 10 }}><FiClock size={15} style={{ flexShrink: 0, marginTop: 2, color: '#D97706' }} /><span><strong>Late:</strong> clock-in after {form.startTime || 'start'} plus {form.graceMinutes || 0} minutes on a working day. The minutes late are counted from {form.startTime || 'start'}.</span></div>
          <div style={{ display: 'flex', gap: 10 }}><FiClock size={15} style={{ flexShrink: 0, marginTop: 2, color: '#1D4ED8' }} /><span><strong>Overtime:</strong> time worked after {form.endTime || 'end time'} on a working day. Arriving early does not create overtime. On non-working days and public holidays every hour worked is overtime. Overtime still needs approval.</span></div>
          <div style={{ display: 'flex', gap: 10 }}><FiInfo size={15} style={{ flexShrink: 0, marginTop: 2, color: '#64748B' }} /><span><strong>Early departure:</strong> clock-out before {form.endTime || 'end time'} minus {form.earlyDepartureGraceMinutes || 0} minutes. Records already saved keep their values; changes apply to new attendance.</span></div>
        </div>
      </SectionCard>

      {!ro && <FooterButtons onDiscard={() => { setForm(saved); setErrors({}); setFormError(''); }} saving={saving} dirty={!shallowEqual(form, saved)} />}
    </form>
  );
}

export default function WorkHoursTab({ showToast }) {
  const canEdit = usePermission('core.settings.update');
  const api = useApi(() => settingsService.getWorkHours(), []);
  return (
    <div>
      <PanelHeader title="Work Hours" subtitle="Set the working days, start and end times and grace periods attendance uses to track late arrival, overtime and early departure" />
      <Loaded api={api} rows={4}>
        {(settings) => <WorkHoursForm key={`${settings.startTime}${settings.endTime}${settings.timeZone}`} settings={settings} canEdit={canEdit} showToast={showToast} />}
      </Loaded>
    </div>
  );
}
