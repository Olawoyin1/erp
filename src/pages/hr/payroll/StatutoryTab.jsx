import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, DatePicker } from '../../../components/ui/FormField';
import { createStatutoryVersion, confirmStatutoryVersion, fetchStatutoryConfig, selectStatutory } from '../../../store/hr/payrollSlice';
import { formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf } from '../hrUtils';
import { money, parseNaira, koboToInput, primaryBtn } from './payrollUtils';
import { LoadError, FormBanner, Pill } from './payrollParts';

const BASIS = { basic: 'Basic salary', basic_housing_transport: 'Basic + housing + transport', gross: 'Gross pay' };

function VersionDrawer({ source, onClose, onSaved, showToast }) {
  const dispatch = useDispatch();
  const [rules, setRules] = useState(() => (source?.rules || []).map((r) => ({
    ...r, ratePercent: String(r.ratePercent ?? 0), fixedAmount: koboToInput(r.fixedAmount || 0), monthlyBaseCap: koboToInput(r.monthlyBaseCap || 0),
  })));
  const [paye, setPaye] = useState(() => ({
    basis: source?.paye?.basis || 'monthly',
    annualFixedRelief: koboToInput(source?.paye?.annualFixedRelief || 0),
    reliefPercentOfGross: String(source?.paye?.reliefPercentOfGross ?? 0),
    deductPensionAndNhf: !!source?.paye?.deductPensionAndNhf,
  }));
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const setRule = (i, k, v) => setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const submit = async () => {
    setFormError('');
    const next = {};
    if (!effectiveFrom) next.effectiveFrom = 'Choose the date this version takes effect';
    const outRules = [];
    rules.forEach((r, i) => {
      const fixed = parseNaira(r.fixedAmount);
      const cap = parseNaira(r.monthlyBaseCap);
      const rate = Number(r.ratePercent);
      if (fixed === null || cap === null || Number.isNaN(rate) || rate < 0 || rate > 100) next[`rule${i}`] = `${r.label}: use a rate from 0 to 100 and plain naira amounts`;
      else outRules.push({ code: r.code, label: r.label, side: r.side, kind: r.kind, basis: r.basis, ratePercent: rate, fixedAmount: fixed, monthlyBaseCap: cap, enabled: !!r.enabled });
    });
    const relief = parseNaira(paye.annualFixedRelief);
    const pct = Number(paye.reliefPercentOfGross);
    if (relief === null) next.annualFixedRelief = 'Use a plain naira amount';
    if (Number.isNaN(pct) || pct < 0 || pct > 100) next.reliefPercentOfGross = 'Use a percentage from 0 to 100';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const result = await dispatch(createStatutoryVersion({
      effectiveFrom, rules: outRules, note: note.trim() || undefined,
      paye: { basis: paye.basis, annualFixedRelief: relief, reliefPercentOfGross: pct, deductPensionAndNhf: paye.deductPensionAndNhf },
    }));
    setSaving(false);
    if (createStatutoryVersion.fulfilled.match(result)) {
      showToast(`Version ${result.payload.version} saved. It needs confirming before it counts as signed off.`, 'success');
      onSaved();
      return;
    }
    setErrors((e) => ({ ...e, ...fieldErrorsOf(result.payload?.details) }));
    setFormError(result.payload?.message || 'The configuration could not be saved');
  };

  return (
    <Drawer isOpen onClose={onClose} title="New Statutory Configuration Version" subtitle="Every change creates a new version; history is never rewritten" width="640px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save as New Version'}</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormBanner message={formError} />
        <FormBanner tone="warn" message="These rates are only starting values. The system never asserts a rate is the legally correct one: your accountant must confirm each version." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Effective from" required error={errors.effectiveFrom}><DatePicker value={effectiveFrom} onChange={(e) => { setEffectiveFrom(e.target.value); setErrors((x) => ({ ...x, effectiveFrom: undefined })); }} /></FormField>
          <FormField label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rates per accountant letter" /></FormField>
        </div>
        {rules.map((r, i) => (
          <div key={r.code} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.88rem' }}>{r.label} <span style={{ color: '#94A3B8', fontWeight: 400 }}>({r.side})</span></strong>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <input type="checkbox" checked={!!r.enabled} onChange={(e) => setRule(i, 'enabled', e.target.checked)} style={{ accentColor: '#1D4ED8' }} /> Enabled
              </label>
            </div>
            {errors[`rule${i}`] && <div style={{ fontSize: '0.78rem', color: '#DC2626' }}>{errors[`rule${i}`]}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <FormField label="Kind"><Select value={r.kind} onChange={(e) => setRule(i, 'kind', e.target.value)} options={[{ value: 'percent', label: 'Percent' }, { value: 'fixed', label: 'Fixed amount' }]} /></FormField>
              <FormField label="Basis"><Select value={r.basis} onChange={(e) => setRule(i, 'basis', e.target.value)} options={Object.entries(BASIS).map(([value, label]) => ({ value, label }))} /></FormField>
              <FormField label="Rate (%)"><Input inputMode="decimal" value={r.ratePercent} onChange={(e) => setRule(i, 'ratePercent', e.target.value)} /></FormField>
              <FormField label="Fixed (₦ per month)"><Input inputMode="decimal" value={r.fixedAmount} onChange={(e) => setRule(i, 'fixedAmount', e.target.value)} /></FormField>
              <FormField label="Monthly base cap (₦, 0 = none)"><Input inputMode="decimal" value={r.monthlyBaseCap} onChange={(e) => setRule(i, 'monthlyBaseCap', e.target.value)} /></FormField>
            </div>
          </div>
        ))}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <strong style={{ fontSize: '0.88rem' }}>PAYE settings</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            <FormField label="Basis"><Select value={paye.basis} onChange={(e) => setPaye((p) => ({ ...p, basis: e.target.value }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annualised', label: 'Annualised' }]} /></FormField>
            <FormField label="Annual fixed relief (₦)" error={errors.annualFixedRelief}><Input inputMode="decimal" value={paye.annualFixedRelief} onChange={(e) => setPaye((p) => ({ ...p, annualFixedRelief: e.target.value }))} /></FormField>
            <FormField label="Relief (% of gross)" error={errors.reliefPercentOfGross}><Input inputMode="decimal" value={paye.reliefPercentOfGross} onChange={(e) => setPaye((p) => ({ ...p, reliefPercentOfGross: e.target.value }))} /></FormField>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <input type="checkbox" checked={paye.deductPensionAndNhf} onChange={(e) => setPaye((p) => ({ ...p, deductPensionAndNhf: e.target.checked }))} style={{ accentColor: '#1D4ED8' }} /> Deduct employee pension and NHF before applying PAYE
          </label>
        </div>
      </div>
    </Drawer>
  );
}

export default function StatutoryTab({ showToast }) {
  const dispatch = useDispatch();
  const config = useSelector(selectStatutory);
  const canApprove = usePermission('hr.payroll.approve');
  const [drawer, setDrawer] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    dispatch(fetchStatutoryConfig()).then((r) => { if (fetchStatutoryConfig.rejected.match(r)) setLoadError(r.payload?.message || 'Failed to load the statutory configuration'); });
  }, [dispatch, attempt]);

  const confirm = async (version) => {
    const result = await dispatch(confirmStatutoryVersion(version._id));
    if (confirmStatutoryVersion.fulfilled.match(result)) showToast(`Version ${version.version} confirmed`, 'success');
    else showToast(result.payload?.message || 'Could not confirm', 'error');
  };

  if (loadError) return <LoadError message={loadError} onRetry={() => { setLoadError(''); setAttempt((n) => n + 1); }} />;
  if (!config) return <div style={{ padding: 30, textAlign: 'center', color: '#94A3B8' }}>Loading statutory configuration…</div>;

  const eff = config.effective;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>Effective configuration {eff ? `(version ${eff.version}, from ${formatDate(eff.effectiveFrom)})` : ''}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Payslips record the version they were computed with.</div>
        </div>
        {canApprove && <button style={primaryBtn} onClick={() => setDrawer(true)}><FiPlus size={14} /> New Version</button>}
      </div>
      {eff?.needsConfirmation && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, color: '#92400E', fontSize: '0.82rem' }}>
          <FiAlertTriangle size={16} style={{ marginTop: 1, flexShrink: 0 }} /> The effective version has not been confirmed. Its rates are starting values only; have your accountant confirm them.
        </div>
      )}
      {eff && (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead><tr style={{ backgroundColor: '#F8FAFC', textAlign: 'left' }}>{['RULE', 'SIDE', 'BASIS', 'VALUE', 'MONTHLY CAP', 'STATE'].map((h) => <th key={h} style={{ padding: '10px 14px', color: '#64748B', fontSize: '0.7rem' }}>{h}</th>)}</tr></thead>
            <tbody>
              {eff.rules.map((r) => (
                <tr key={r.code} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{r.label}</td>
                  <td style={{ padding: '10px 14px', textTransform: 'capitalize' }}>{r.side}</td>
                  <td style={{ padding: '10px 14px' }}>{BASIS[r.basis] || r.basis}</td>
                  <td style={{ padding: '10px 14px' }}>{r.kind === 'fixed' ? `${money(r.fixedAmount)} / month` : `${r.ratePercent}%`}</td>
                  <td style={{ padding: '10px 14px' }}>{r.monthlyBaseCap ? money(r.monthlyBaseCap) : 'None'}</td>
                  <td style={{ padding: '10px 14px' }}>{r.enabled ? <Pill text="Enabled" bg="#DCFCE7" color="#166534" /> : <Pill text="Disabled" bg="#F1F5F9" color="#64748B" />}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>PAYE settings</td>
                <td colSpan={5} style={{ padding: '10px 14px' }}>
                  {eff.paye.basis === 'annualised' ? 'Annualised' : 'Monthly'}; fixed relief {money(eff.paye.annualFixedRelief || 0)}; relief {eff.paye.reliefPercentOfGross || 0}% of gross; {eff.paye.deductPensionAndNhf ? 'pension and NHF deducted first' : 'pension and NHF not deducted first'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div>
        <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Versions</div>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
          {config.versions.length === 0 && <div style={{ padding: 16, color: '#94A3B8', fontSize: '0.85rem' }}>No versions saved yet.</div>}
          {config.versions.map((v, i) => (
            <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: i ? '1px solid #F1F5F9' : 'none', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>Version {v.version} <span style={{ color: '#94A3B8', fontWeight: 400 }}>from {formatDate(v.effectiveFrom)}</span></div>
                {v.note && <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{v.note}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {v.needsConfirmation ? <Pill text="Needs confirmation" bg="#FEF3C7" color="#92400E" /> : <Pill text={`Confirmed ${formatDate(v.confirmedAt)}`} bg="#DCFCE7" color="#166534" />}
                {v.needsConfirmation && canApprove && <button className="btn btn-secondary" onClick={() => confirm(v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiCheck size={13} /> Confirm</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {drawer && <VersionDrawer source={eff} showToast={showToast} onClose={() => setDrawer(false)} onSaved={() => { setDrawer(false); dispatch(fetchStatutoryConfig()); }} />}
    </div>
  );
}
