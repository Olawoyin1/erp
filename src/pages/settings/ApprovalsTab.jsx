import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { FormField, Input } from '../../components/ui/FormField';
import { settingsService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import Loaded from './Loaded';
import { ErrorBanner, FooterButtons, NoticeBanner, PanelHeader, SectionCard } from './settingsShared';
import { detailErrors, formatNaira, inputToKobo, koboToInput, shallowEqual } from './settingsUtils';

const hint = { margin: '6px 0 0', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 };

function ApprovalsForm({ settings, canEdit, showToast }) {
  const initial = {
    fundRequestThreshold1: koboToInput(settings.fundRequestThreshold1),
    fundRequestThreshold2: koboToInput(settings.fundRequestThreshold2),
    fundRequestThreshold3: koboToInput(settings.fundRequestThreshold3),
    threeWayMatchingTolerancePercent: String(settings.threeWayMatchingTolerancePercent ?? ''),
    documentExpiryAlertWindowDays: String(settings.documentExpiryAlertWindowDays ?? ''),
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setForm((p) => ({ ...p, [name]: e.target.value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const kobo = {};
    ['fundRequestThreshold1', 'fundRequestThreshold2', 'fundRequestThreshold3'].forEach((key) => {
      const value = inputToKobo(form[key]);
      if (value === null || value <= 0) errs[key] = 'Enter an amount in naira greater than zero (at most 2 decimals)';
      else kobo[key] = value;
    });
    if (!errs.fundRequestThreshold1 && !errs.fundRequestThreshold2 && kobo.fundRequestThreshold1 >= kobo.fundRequestThreshold2) errs.fundRequestThreshold2 = 'Must be higher than threshold 1';
    if (!errs.fundRequestThreshold2 && !errs.fundRequestThreshold3 && kobo.fundRequestThreshold2 >= kobo.fundRequestThreshold3) errs.fundRequestThreshold3 = 'Must be higher than threshold 2';
    const tolerance = Number(form.threeWayMatchingTolerancePercent);
    if (form.threeWayMatchingTolerancePercent === '' || Number.isNaN(tolerance) || tolerance < 0 || tolerance > 100) errs.threeWayMatchingTolerancePercent = 'Enter a percentage from 0 to 100';
    const days = Number(form.documentExpiryAlertWindowDays);
    if (!Number.isInteger(days) || days < 1) errs.documentExpiryAlertWindowDays = 'Enter a whole number of days, 1 or more';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await settingsService.updateApprovals({
        ...kobo,
        threeWayMatchingTolerancePercent: tolerance,
        documentExpiryAlertWindowDays: days,
      });
      setSaved({ ...form });
      showToast('Approval settings saved', 'success');
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save the approval settings'));
    } finally {
      setSaving(false);
    }
  };

  const ro = !canEdit;
  const preview = (key) => {
    const value = inputToKobo(form[key]);
    return value === null ? null : formatNaira(value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {ro && <NoticeBanner>You can see these settings but your role cannot change them.</NoticeBanner>}
      <ErrorBanner message={formError} />

      <SectionCard title="Fund Request Approval Thresholds">
        <p style={{ fontSize: '0.83rem', color: '#64748B', margin: '0 0 16px 0' }}>
          Requests above each threshold need a higher level of approval (line manager, head of department, then manager or CFO). The first threshold also limits direct purchase orders. Enter amounts in Nigerian Naira; they are stored in kobo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[1, 2, 3].map((n) => {
            const key = `fundRequestThreshold${n}`;
            return (
              <FormField key={key} label={`Threshold ${n} (₦)`} error={errors[key]} helpText={!errors[key] ? preview(key) || undefined : undefined}>
                <Input inputMode="decimal" value={form[key]} onChange={set(key)} disabled={ro} error={!!errors[key]} />
              </FormField>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Matching & Expiry Rules">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <FormField label="3-Way Matching Discrepancy Tolerance (%)" error={errors.threeWayMatchingTolerancePercent}>
              <Input inputMode="decimal" value={form.threeWayMatchingTolerancePercent} onChange={set('threeWayMatchingTolerancePercent')} disabled={ro} error={!!errors.threeWayMatchingTolerancePercent} />
            </FormField>
            <p style={hint}><FiCheckCircle size={11} /> Maximum allowed variance between PO, GRN, and invoice amounts.</p>
          </div>
          <div>
            <FormField label="Document / Certificate Expiry Alert Window (Days)" error={errors.documentExpiryAlertWindowDays}>
              <Input inputMode="numeric" value={form.documentExpiryAlertWindowDays} onChange={set('documentExpiryAlertWindowDays')} disabled={ro} error={!!errors.documentExpiryAlertWindowDays} />
            </FormField>
            <p style={hint}><FiCheckCircle size={11} /> Days before expiry to flag a record as "Expiring Soon"</p>
          </div>
        </div>
      </SectionCard>

      {!ro && <FooterButtons onDiscard={() => { setForm(saved); setErrors({}); setFormError(''); }} saving={saving} dirty={!shallowEqual(form, saved)} />}
    </form>
  );
}

export default function ApprovalsTab({ showToast }) {
  const canEdit = usePermission('core.settings.update');
  const api = useApi(() => settingsService.getApprovals(), []);
  return (
    <div>
      <PanelHeader title="Approvals & Compliance" subtitle="Configure approval thresholds, matching tolerances, and document expiry windows" />
      <Loaded api={api} rows={4}>
        {(settings) => <ApprovalsForm key={settings.updatedAt} settings={settings} canEdit={canEdit} showToast={showToast} />}
      </Loaded>
    </div>
  );
}
