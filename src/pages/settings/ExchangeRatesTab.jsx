import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import { FormField, Input } from '../../components/ui/FormField';
import { exchangeRateService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import ConfirmDialog from '../users/ConfirmDialog';
import { EmptyState, ErrorBanner, LinkButton, NoticeBanner, PanelHeader, PanelSkeleton, PrimaryButton, SectionCard } from './settingsShared';
import { dateInput, detailErrors, tableCell, tableHead } from './settingsUtils';

const GRID = '1fr 1.2fr 1.3fr 2fr 0.8fr';
const today = () => new Date().toISOString().slice(0, 10);

function RateModal({ onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ currency: '', rate: '', effectiveDate: today(), source: '' });
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
    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) errs.currency = 'Use a 3-letter code, for example USD';
    if (form.currency.trim().toUpperCase() === 'NGN') errs.currency = 'The base currency NGN always has a rate of 1';
    const rate = Number(form.rate);
    if (!form.rate || Number.isNaN(rate) || rate <= 0) errs.rate = 'Enter a rate greater than zero';
    if (!form.effectiveDate) errs.effectiveDate = 'Choose the date the rate starts';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await exchangeRateService.create({
        currency: form.currency.trim().toUpperCase(),
        rate,
        effectiveDate: form.effectiveDate,
        ...(form.source.trim() ? { source: form.source.trim() } : {}),
      });
      showToast('Exchange rate saved', 'success');
      onSaved();
    } catch (err) {
      setErrors(detailErrors(err));
      const status = err.response?.status;
      setFormError(status === 409 ? 'A rate for this currency and date already exists. Delete it first or pick another date.' : apiError(err, 'Could not save the rate'));
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add Exchange Rate"
      subtitle="Naira per ONE unit of the foreign currency, effective from the date chosen"
      maxWidth="480px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Rate'}</button>
        </>
      }
    >
      <ErrorBanner message={formError} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Currency" required error={errors.currency}>
          <Input value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} placeholder="USD" maxLength={3} error={!!errors.currency} />
        </FormField>
        <FormField label="Rate (₦ per unit)" required error={errors.rate}>
          <Input inputMode="decimal" value={form.rate} onChange={(e) => set('rate', e.target.value)} placeholder="1500" error={!!errors.rate} />
        </FormField>
        <FormField label="Effective From" required error={errors.effectiveDate}>
          <Input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} error={!!errors.effectiveDate} />
        </FormField>
        <FormField label="Source (Optional)" error={errors.source}>
          <Input value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="CBN official rate" maxLength={200} />
        </FormField>
      </div>
    </Modal>
  );
}

export default function ExchangeRatesTab({ showToast }) {
  const canManage = usePermission('finance.exchangerate.manage');
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [removeState, setRemoveState] = useState({ rate: null, busy: false, error: '' });
  const code = filter.trim().toUpperCase();
  const valid = code.length === 3 || code.length === 0;
  const api = useApi(() => exchangeRateService.list(code.length === 3 ? { currency: code } : {}), [code.length === 3 ? code : '']);

  const rates = api.data?.data || [];

  const remove = async () => {
    const { rate } = removeState;
    setRemoveState((s) => ({ ...s, busy: true, error: '' }));
    try {
      await exchangeRateService.remove(rate._id);
      showToast('Exchange rate deleted', 'success');
      setRemoveState({ rate: null, busy: false, error: '' });
      api.reload();
    } catch (err) {
      setRemoveState((s) => ({ ...s, busy: false, error: apiError(err, 'Could not delete the rate') }));
    }
  };

  return (
    <div>
      <PanelHeader title="Exchange Rates" subtitle="Rates used to convert foreign-currency amounts into naira. A foreign amount with no rate on or before its date is refused." />
      <NoticeBanner>The latest rate effective on or before a transaction's date is used. History is kept: add a new dated rate rather than editing an old one.</NoticeBanner>

      <SectionCard
        title="Rates"
        action={canManage && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setModalOpen(true)}>Add Rate</PrimaryButton>}
      >
        <div style={{ maxWidth: 220, marginBottom: 14 }}>
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by currency, e.g. USD" maxLength={3} error={!valid} />
        </div>
        <ErrorBanner message={api.error} onRetry={api.reload} />
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
          {['Currency', 'Rate (₦)', 'Effective From', 'Source', ''].map((h) => <span key={h} style={tableHead}>{h}</span>)}
        </div>
        {api.loading && !api.data && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={3} /></div>}
        {!api.loading && !api.error && rates.length === 0 && <EmptyState>No exchange rates yet. Add one before recording foreign-currency amounts.</EmptyState>}
        {rates.map((rate) => (
          <div key={rate._id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, alignItems: 'center' }}>
            <span style={{ ...tableCell, fontWeight: 600 }}>{rate.currency}</span>
            <span style={tableCell}>{Number(rate.rate).toLocaleString('en-NG', { maximumFractionDigits: 6 })}</span>
            <span style={tableCell}>{dateInput(rate.effectiveDate)}</span>
            <span style={{ ...tableCell, color: '#64748B' }}>{rate.source || '—'}</span>
            <span style={tableCell}>{canManage && <LinkButton tone="danger" onClick={() => setRemoveState({ rate, busy: false, error: '' })}>Delete</LinkButton>}</span>
          </div>
        ))}
      </SectionCard>

      {modalOpen && <RateModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); api.reload(); }} showToast={showToast} />}

      <ConfirmDialog
        open={!!removeState.rate}
        title="Delete this exchange rate?"
        description="Transactions dated from this rate onward will use the previous rate, or be refused if there is none."
        subject={removeState.rate ? `${removeState.rate.currency} at ₦${removeState.rate.rate}` : ''}
        subjectDetail={removeState.rate ? `Effective ${dateInput(removeState.rate.effectiveDate)}` : ''}
        confirmLabel="Delete Rate"
        tone="danger"
        busy={removeState.busy}
        error={removeState.error}
        onConfirm={remove}
        onClose={() => setRemoveState({ rate: null, busy: false, error: '' })}
      />
    </div>
  );
}
