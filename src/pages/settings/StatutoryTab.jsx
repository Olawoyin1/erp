import { useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { statutoryService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import ConfirmDialog from '../users/ConfirmDialog';
import Loaded from './Loaded';
import { ErrorBanner, LinkButton, NoticeBanner, PanelHeader, PrimaryButton, SectionCard, StatusTag, ToggleSwitch } from './settingsShared';
import { dateInput, detailErrors, formatNaira, inputToKobo, koboToInput, tableCell, tableHead } from './settingsUtils';

const BASES = [
  { value: 'basic', label: 'Basic pay' },
  { value: 'basic_housing_transport', label: 'Basic + housing + transport' },
  { value: 'gross', label: 'Gross pay' },
];
const KINDS = [{ value: 'percent', label: 'Percent of pay' }, { value: 'fixed', label: 'Fixed monthly amount' }];
const PAYE_BASES = [
  { value: 'monthly', label: 'Monthly: apply the tax brackets to each month' },
  { value: 'annualised', label: 'Annualised: scale to a year, apply, divide by 12' },
];
const baseLabel = (v) => BASES.find((b) => b.value === v)?.label || v;
const today = () => new Date().toISOString().slice(0, 10);
const RULES_GRID = '2fr 0.8fr 1.6fr 1.4fr 0.7fr';

function VersionStatus({ version }) {
  return version.needsConfirmation
    ? <StatusTag active={false} inactiveLabel="Needs accountant confirmation" />
    : <StatusTag active activeLabel={`Confirmed ${dateInput(version.confirmedAt)}`} />;
}

function VersionForm({ base, onClose, onSaved, showToast }) {
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [note, setNote] = useState('');
  const [rules, setRules] = useState(() =>
    (base.rules || []).map((r) => ({ ...r, ratePercent: String(r.ratePercent ?? 0), fixedAmount: koboToInput(r.fixedAmount), monthlyBaseCap: koboToInput(r.monthlyBaseCap) })),
  );
  const [paye, setPaye] = useState({
    basis: base.paye?.basis || 'monthly',
    annualFixedRelief: koboToInput(base.paye?.annualFixedRelief),
    reliefPercentOfGross: String(base.paye?.reliefPercentOfGross ?? 0),
    deductPensionAndNhf: !!base.paye?.deductPensionAndNhf,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const setRule = (index, patch) => {
    setRules((p) => p.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setErrors({});
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!effectiveFrom) errs.effectiveFrom = 'Choose the date this version starts';
    const bodyRules = rules.map((r, i) => {
      const rate = Number(r.ratePercent);
      const fixed = inputToKobo(r.fixedAmount || '0');
      const cap = inputToKobo(r.monthlyBaseCap || '0');
      if (Number.isNaN(rate) || rate < 0 || rate > 100) errs[`rule${i}`] = 'Rate must be from 0 to 100';
      else if (fixed === null || cap === null) errs[`rule${i}`] = 'Amounts must be in naira with at most 2 decimals';
      return { code: r.code, label: r.label, side: r.side, kind: r.kind, basis: r.basis, ratePercent: rate, fixedAmount: fixed ?? 0, monthlyBaseCap: cap ?? 0, enabled: r.enabled };
    });
    const relief = inputToKobo(paye.annualFixedRelief || '0');
    const reliefPct = Number(paye.reliefPercentOfGross);
    if (relief === null) errs.annualFixedRelief = 'Enter an amount in naira';
    if (Number.isNaN(reliefPct) || reliefPct < 0 || reliefPct > 100) errs.reliefPercentOfGross = 'Enter a percentage from 0 to 100';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await statutoryService.saveVersion({
        effectiveFrom,
        rules: bodyRules,
        paye: { basis: paye.basis, annualFixedRelief: relief, reliefPercentOfGross: reliefPct, deductPensionAndNhf: paye.deductPensionAndNhf },
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      showToast('Saved as a new version. It needs confirming before it counts as signed off.', 'success');
      onSaved();
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save the configuration'));
      setSaving(false);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      <button type="submit" form="statutory-form" disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save New Version'}</button>
    </>
  );

  return (
    <Drawer isOpen onClose={onClose} title="New Statutory Version" subtitle="History is never rewritten: every change is a new version with its own start date" width="680px" footer={footer}>
      <form id="statutory-form" onSubmit={save} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <NoticeBanner tone="warn">These figures are configurable defaults, not legal advice. Have your accountant confirm the version after saving.</NoticeBanner>
        <ErrorBanner message={formError} />
        <FormField label="Effective From" required error={errors.effectiveFrom}>
          <Input type="date" value={effectiveFrom} onChange={(e) => { setEffectiveFrom(e.target.value); setErrors({}); }} error={!!errors.effectiveFrom} />
        </FormField>

        {rules.map((r, i) => (
          <div key={r.code} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>{r.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{r.code} · paid by the {r.side}</div>
              </div>
              <ToggleSwitch checked={r.enabled} onChange={(v) => setRule(i, { enabled: v })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Calculation"><Select value={r.kind} onChange={(e) => setRule(i, { kind: e.target.value })} options={KINDS} /></FormField>
              <FormField label="Applied To"><Select value={r.basis} onChange={(e) => setRule(i, { basis: e.target.value })} options={BASES} /></FormField>
              <FormField label="Rate (%)"><Input inputMode="decimal" value={r.ratePercent} onChange={(e) => setRule(i, { ratePercent: e.target.value })} disabled={r.kind === 'fixed'} /></FormField>
              <FormField label="Fixed Amount (₦ per month)"><Input inputMode="decimal" value={r.fixedAmount} onChange={(e) => setRule(i, { fixedAmount: e.target.value })} disabled={r.kind !== 'fixed'} /></FormField>
              <FormField label="Monthly Pay Ceiling (₦, 0 = none)" style={{ gridColumn: '1 / -1' }}><Input inputMode="decimal" value={r.monthlyBaseCap} onChange={(e) => setRule(i, { monthlyBaseCap: e.target.value })} disabled={r.kind === 'fixed'} /></FormField>
            </div>
            {errors[`rule${i}`] && <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 6 }}>{errors[`rule${i}`]}</div>}
          </div>
        ))}

        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>PAYE (income tax)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Basis" style={{ gridColumn: '1 / -1' }}><Select value={paye.basis} onChange={(e) => setPaye((p) => ({ ...p, basis: e.target.value }))} options={PAYE_BASES} /></FormField>
            <FormField label="Annual Fixed Relief (₦)" error={errors.annualFixedRelief}><Input inputMode="decimal" value={paye.annualFixedRelief} onChange={(e) => setPaye((p) => ({ ...p, annualFixedRelief: e.target.value }))} error={!!errors.annualFixedRelief} /></FormField>
            <FormField label="Relief (% of annual gross)" error={errors.reliefPercentOfGross}><Input inputMode="decimal" value={paye.reliefPercentOfGross} onChange={(e) => setPaye((p) => ({ ...p, reliefPercentOfGross: e.target.value }))} error={!!errors.reliefPercentOfGross} /></FormField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>Deduct the employee's pension and NHF before applying PAYE</span>
            <ToggleSwitch checked={paye.deductPensionAndNhf} onChange={(v) => setPaye((p) => ({ ...p, deductPensionAndNhf: v }))} />
          </div>
        </div>

        <FormField label="Note (Optional)" error={errors.note}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="What changed and why, for example the accountant's reference" />
        </FormField>
      </form>
    </Drawer>
  );
}

function StatutoryView({ effective, versions, canApprove, showToast, onChanged }) {
  const [formOpen, setFormOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ version: null, busy: false, error: '' });

  const confirm = async () => {
    const { version } = confirmState;
    setConfirmState((s) => ({ ...s, busy: true, error: '' }));
    try {
      await statutoryService.confirmVersion(version._id);
      showToast(`Version ${version.version} confirmed`, 'success');
      setConfirmState({ version: null, busy: false, error: '' });
      onChanged();
    } catch (err) {
      setConfirmState((s) => ({ ...s, busy: false, error: apiError(err, 'Could not confirm the version') }));
    }
  };

  return (
    <div>
      {effective.needsConfirmation && (
        <NoticeBanner tone="warn">
          The configuration in force (version {effective.version}) still needs accountant confirmation. Payroll uses it as it stands, so make sure the rates are right before running payroll.
        </NoticeBanner>
      )}

      <SectionCard
        title={`In Force Today: Version ${effective.version}`}
        subtitle={`Effective from ${dateInput(effective.effectiveFrom)}${effective.note ? ` · ${effective.note}` : ''}`}
        action={
          canApprove && (
            <div style={{ display: 'flex', gap: 8 }}>
              {effective.needsConfirmation && <PrimaryButton onClick={() => setConfirmState({ version: effective, busy: false, error: '' })}>Confirm This Version</PrimaryButton>}
              <PrimaryButton icon={<FiEdit2 size={13} />} onClick={() => setFormOpen(true)}>New Version</PrimaryButton>
            </div>
          )
        }
      >
        <div style={{ marginBottom: 10 }}><VersionStatus version={effective} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: RULES_GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
          {['Contribution', 'Paid by', 'Applied to', 'Rate or amount', 'On'].map((h) => <span key={h} style={tableHead}>{h}</span>)}
        </div>
        {(effective.rules || []).map((r) => (
          <div key={r.code} style={{ display: 'grid', gridTemplateColumns: RULES_GRID, gap: 10, alignItems: 'center' }}>
            <span style={{ ...tableCell, fontWeight: 600 }}>{r.label}</span>
            <span style={{ ...tableCell, textTransform: 'capitalize' }}>{r.side}</span>
            <span style={tableCell}>{r.kind === 'fixed' ? 'Fixed monthly amount' : baseLabel(r.basis)}</span>
            <span style={tableCell}>
              {r.kind === 'fixed' ? formatNaira(r.fixedAmount) : `${r.ratePercent}%`}
              {r.kind !== 'fixed' && r.monthlyBaseCap > 0 ? ` up to ${formatNaira(r.monthlyBaseCap)}` : ''}
            </span>
            <span style={tableCell}><StatusTag active={r.enabled} activeLabel="Yes" inactiveLabel="No" /></span>
          </div>
        ))}
        <div style={{ marginTop: 14, fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
          <strong>PAYE:</strong> {effective.paye?.basis === 'annualised' ? 'annualised' : 'monthly'} basis, annual fixed relief {formatNaira(effective.paye?.annualFixedRelief ?? 0)}, relief {effective.paye?.reliefPercentOfGross ?? 0}% of gross, pension and NHF {effective.paye?.deductPensionAndNhf ? 'deducted' : 'not deducted'} before tax.
        </div>
      </SectionCard>

      <SectionCard title="Version History" subtitle="Every payslip records the version it was calculated with">
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.2fr 1.2fr 2fr 1fr', gap: 10, borderBottom: '1px solid #E2E8F0' }}>
          {['Version', 'Starts', 'Rules on', 'Status', ''].map((h) => <span key={h} style={tableHead}>{h}</span>)}
        </div>
        {versions.map((v) => (
          <div key={v._id} style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.2fr 1.2fr 2fr 1fr', gap: 10, alignItems: 'center' }}>
            <span style={{ ...tableCell, fontWeight: 600 }}>v{v.version}</span>
            <span style={tableCell}>{dateInput(v.effectiveFrom)}</span>
            <span style={tableCell}>{(v.rules || []).filter((r) => r.enabled).length} of {(v.rules || []).length}</span>
            <span style={tableCell}><VersionStatus version={v} /></span>
            <span style={tableCell}>{canApprove && v.needsConfirmation && <LinkButton onClick={() => setConfirmState({ version: v, busy: false, error: '' })}>Confirm</LinkButton>}</span>
          </div>
        ))}
      </SectionCard>

      {formOpen && <VersionForm base={effective} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); onChanged(); }} showToast={showToast} />}

      <ConfirmDialog
        open={!!confirmState.version}
        title="Confirm this statutory configuration?"
        description="Confirming records that your accountant has checked these rates and rules. It does not change how payroll calculates."
        subject={confirmState.version ? `Version ${confirmState.version.version}` : ''}
        subjectDetail={confirmState.version ? `Effective ${dateInput(confirmState.version.effectiveFrom)}` : ''}
        confirmLabel="Confirm Version"
        tone="success"
        busy={confirmState.busy}
        error={confirmState.error}
        onConfirm={confirm}
        onClose={() => setConfirmState({ version: null, busy: false, error: '' })}
      />
    </div>
  );
}

export default function StatutoryTab({ showToast }) {
  const canApprove = usePermission('hr.payroll.approve');
  const api = useApi(() => statutoryService.getConfig(), []);
  return (
    <div>
      <PanelHeader title="Statutory Payroll" subtitle="Pension, NHF, NSITF, ITF and PAYE settings used when payroll is calculated" />
      <Loaded api={api} rows={5}>
        {(config) => <StatutoryView effective={config.effective} versions={config.versions || []} canApprove={canApprove} showToast={showToast} onChanged={api.reload} />}
      </Loaded>
    </div>
  );
}
