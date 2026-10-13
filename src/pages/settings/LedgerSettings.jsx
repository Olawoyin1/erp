import { useState } from 'react';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { financeSettingsService, legalEntityService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import ConfirmDialog from '../users/ConfirmDialog';
import Loaded from './Loaded';
import { ErrorBanner, FooterButtons, NoticeBanner, NotifRow, PrimaryButton, SectionCard } from './settingsShared';
import { ACCOUNT_MAPPING_LABELS, detailErrors, formatNaira, inputToKobo, koboToInput } from './settingsUtils';

const BUDGET_MODES = [
  { value: 'off', label: 'Off: no budget check' },
  { value: 'warn', label: 'Warn: allow, but flag over-budget spending' },
  { value: 'block', label: 'Block: refuse spending above the budget' },
];
const PAYABLE_MODES = [
  { value: 'always', label: 'Always: every vendor invoice needs a second approver' },
  { value: 'above_threshold', label: 'Above threshold: only larger invoices need approval' },
  { value: 'off', label: 'Off: no second approval' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  .map((label, i) => ({ value: String(i + 1), label }));

/** Every active ledger account (the list route caps a page at 100). */
async function fetchAllAccounts() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 10) {
    const res = await financeSettingsService.accounts({ page, limit: 100, status: 'active' });
    all.push(...res.data.data);
    totalPages = res.data.meta?.totalPages || 1;
    page += 1;
  }
  return { data: { data: all } };
}

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';

function LedgerForm({ settings, accounts, entities, canEdit, showToast, onSaved }) {
  const mappingKeys = Object.keys(ACCOUNT_MAPPING_LABELS);
  const initial = {
    autoPosting: !!settings.autoPosting,
    budgetControl: settings.budgetControl || 'warn',
    payableApproval: settings.payableApproval || 'always',
    directPurchaseReasonAbove: koboToInput(settings.directPurchaseReasonAbove),
    fiscalYearStartMonth: String(settings.fiscalYearStartMonth || 1),
    defaultLegalEntity: idOf(settings.defaultLegalEntity),
    mappings: Object.fromEntries(mappingKeys.map((k) => [k, idOf(settings.accountMappings?.[k])])),
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };
  const setMapping = (key, value) => setForm((p) => ({ ...p, mappings: { ...p.mappings, [key]: value } }));

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const accountOptions = [
    { value: '', label: 'Not mapped' },
    ...accounts.map((a) => ({ value: a._id, label: `${a.accountCode} · ${a.accountName}` })),
  ];
  const entityOptions = [{ value: '', label: 'None' }, ...entities.filter((e) => e.status === 'active').map((e) => ({ value: e._id, label: e.name }))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const threshold = inputToKobo(form.directPurchaseReasonAbove);
    if (threshold === null) { setErrors({ directPurchaseReasonAbove: 'Enter an amount in naira (0 means never)' }); return; }

    const payload = {};
    if (form.autoPosting !== saved.autoPosting) payload.autoPosting = form.autoPosting;
    if (form.budgetControl !== saved.budgetControl) payload.budgetControl = form.budgetControl;
    if (form.payableApproval !== saved.payableApproval) payload.payableApproval = form.payableApproval;
    if (form.directPurchaseReasonAbove !== saved.directPurchaseReasonAbove) payload.directPurchaseReasonAbove = threshold;
    if (form.fiscalYearStartMonth !== saved.fiscalYearStartMonth) payload.fiscalYearStartMonth = Number(form.fiscalYearStartMonth);
    if (form.defaultLegalEntity !== saved.defaultLegalEntity) payload.defaultLegalEntity = form.defaultLegalEntity || null;
    const changedMappings = {};
    mappingKeys.forEach((k) => {
      if (form.mappings[k] !== saved.mappings[k]) changedMappings[k] = form.mappings[k] || null;
    });
    if (Object.keys(changedMappings).length) payload.accountMappings = changedMappings;

    setSaving(true);
    try {
      await financeSettingsService.update(payload);
      setSaved(form);
      showToast('Ledger settings saved', 'success');
      onSaved();
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save the ledger settings'));
    } finally {
      setSaving(false);
    }
  };

  const mappedCount = mappingKeys.filter((k) => form.mappings[k]).length;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorBanner message={formError} />
      {!canEdit && <NoticeBanner>You can see the ledger settings but your role cannot change them.</NoticeBanner>}

      <SectionCard title="Ledger Posting & Controls" subtitle="How business events reach the ledger and how spending is controlled">
        <NotifRow
          label="Automatic Posting"
          desc="Post invoices, payables, payments, payroll, tax and asset events to the ledger automatically. A posting whose accounts are not mapped waits in the queue until they are."
          checked={form.autoPosting}
          onChange={(v) => set('autoPosting', v)}
          disabled={!canEdit}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <FormField label="Budget Control" helpText="What happens when a purchase order or payable would exceed the project budget">
            <Select value={form.budgetControl} onChange={(e) => set('budgetControl', e.target.value)} options={BUDGET_MODES} disabled={!canEdit} />
          </FormField>
          <FormField label="Payable Approval" helpText="Whether a vendor invoice needs a second person's approval before it can be paid">
            <Select value={form.payableApproval} onChange={(e) => set('payableApproval', e.target.value)} options={PAYABLE_MODES} disabled={!canEdit} />
          </FormField>
          <FormField
            label="Direct Purchase Reason Above (₦)"
            error={errors.directPurchaseReasonAbove}
            helpText={!errors.directPurchaseReasonAbove ? `Direct vendor invoices (no purchase order) above ${formatNaira(inputToKobo(form.directPurchaseReasonAbove) ?? 0)} need a written reason. 0 means never.` : undefined}
          >
            <Input inputMode="decimal" value={form.directPurchaseReasonAbove} onChange={(e) => set('directPurchaseReasonAbove', e.target.value)} disabled={!canEdit} error={!!errors.directPurchaseReasonAbove} />
          </FormField>
          <FormField label="Financial Year Starts In" helpText="Reports use it for year-to-date figures">
            <Select value={form.fiscalYearStartMonth} onChange={(e) => set('fiscalYearStartMonth', e.target.value)} options={MONTHS} disabled={!canEdit} />
          </FormField>
          <FormField label="Default Legal Entity" error={errors.defaultLegalEntity} helpText="Used for system postings such as invoices and payroll">
            <Select value={form.defaultLegalEntity} onChange={(e) => set('defaultLegalEntity', e.target.value)} options={entityOptions} disabled={!canEdit} searchable />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Account Mappings" subtitle={`${mappedCount} of ${mappingKeys.length} ledger accounts mapped. Automatic postings use these accounts.`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {mappingKeys.map((key) => (
            <FormField key={key} label={ACCOUNT_MAPPING_LABELS[key]} error={errors[`accountMappings.${key}`]}>
              <Select value={form.mappings[key]} onChange={(e) => setMapping(key, e.target.value)} options={accountOptions} disabled={!canEdit} searchable />
            </FormField>
          ))}
        </div>
      </SectionCard>

      {canEdit && <FooterButtons onDiscard={() => { setForm(saved); setErrors({}); setFormError(''); }} saving={saving} dirty={dirty} />}
    </form>
  );
}

export default function LedgerSettings({ showToast }) {
  const canAdmin = usePermission('finance.ledger.admin');
  const canListEntities = usePermission('finance.legalentity.view');
  const canListAccounts = usePermission('finance.account.view');
  const settingsApi = useApi(() => financeSettingsService.get(), []);
  const accountsApi = useApi(() => (canListAccounts ? fetchAllAccounts() : Promise.resolve({ data: { data: [] } })), [canListAccounts]);
  const entitiesApi = useApi(() => (canListEntities ? legalEntityService.list({ all: true }) : Promise.resolve({ data: { data: [] } })), [canListEntities]);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seed, setSeed] = useState({ busy: false, error: '' });

  const applyDefaults = async () => {
    setSeed({ busy: true, error: '' });
    try {
      const res = await financeSettingsService.seedDefaults();
      const result = res.data.data || {};
      showToast(`Default chart applied: ${result.created ?? 0} accounts created, ${result.mapped ?? 0} mappings set`, 'success');
      setSeedOpen(false);
      setSeed({ busy: false, error: '' });
      settingsApi.reload();
      accountsApi.reload();
      entitiesApi.reload();
    } catch (err) {
      setSeed({ busy: false, error: apiError(err, 'Could not apply the default chart') });
    }
  };

  return (
    <div>
      {canAdmin && (
        <SectionCard
          title="Starter Chart of Accounts"
          subtitle="Creates any missing standard accounts and maps them. Existing accounts and mappings are never changed."
          action={<PrimaryButton onClick={() => setSeedOpen(true)}>Apply Default Chart</PrimaryButton>}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Use this on a new system so automatic postings have accounts to land in.</span>
        </SectionCard>
      )}
      {!canListAccounts && <NoticeBanner tone="warn">Your role cannot list ledger accounts, so the mapping pickers below are empty.</NoticeBanner>}
      <Loaded api={settingsApi} rows={6}>
        {(settings) => (
          <LedgerForm
            key={settings.updatedAt}
            settings={settings}
            accounts={accountsApi.data?.data || []}
            entities={entitiesApi.data?.data || []}
            canEdit={canAdmin}
            showToast={showToast}
            onSaved={settingsApi.reload}
          />
        )}
      </Loaded>
      <ConfirmDialog
        open={seedOpen}
        title="Apply the default chart of accounts?"
        description="Any standard account that does not exist yet is created, mapped, and a default legal entity is picked. Nothing that exists is overwritten."
        confirmLabel="Apply Default Chart"
        busy={seed.busy}
        error={seed.error}
        onConfirm={applyDefaults}
        onClose={() => setSeedOpen(false)}
      />
    </div>
  );
}
