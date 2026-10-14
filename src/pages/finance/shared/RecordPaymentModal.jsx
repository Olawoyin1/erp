import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { populatedName } from '../../../services/apiHelpers';
import { AttachField } from './FinanceRecordExtras';
import { Choice, Field, FormBody, FormError, MoneyInput, PrimaryButton, SecondaryButton, TwoCol } from './FinanceUi';
import { fieldErrorsOf, fromKobo, money, today, toKobo, uploadStagedFiles } from './financeUtils';
import { useAccountOptions } from './useRefOptions';
import { useRunAction } from './useFinanceList';

const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Cash', 'Remita RRR', 'Card'];

/**
 * Record a receipt on an invoice or a payment on a vendor invoice (same backend shape).
 * `kind`: 'receipt' (client pays us) or 'payment' (we pay a vendor).
 */
export default function RecordPaymentModal({ kind, slice, api, record, canAttach, onClose, onSaved }) {
  const receipt = kind === 'receipt';
  const run = useRunAction(slice);
  const accounts = useAccountOptions({ category: 'Asset' });
  const owed = record.outstanding;
  const [form, setForm] = useState({
    amount: fromKobo(owed), paymentDate: today(), method: 'Bank Transfer', reference: '', bankAccount: '', exchangeRate: '', note: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const foreign = record.currency && record.currency !== 'NGN';
  const typed = toKobo(form.amount);
  const remaining = owed - (Number.isNaN(typed) ? 0 : typed);
  const party = receipt ? populatedName(record.client) : populatedName(record.vendor);
  const reference = receipt ? record.invoiceId : record.payableId;
  const totalLabel = receipt ? record.netReceivable : record.netAmount;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (Number.isNaN(typed) || typed <= 0) next.amount = receipt ? 'Enter the amount received' : 'Enter the amount paid';
    else if (typed > owed) next.amount = 'Cannot exceed the outstanding balance';
    if (!form.paymentDate) next.paymentDate = 'Choose the payment date';
    if (!form.reference.trim()) next.reference = 'Enter the transaction reference';
    if (foreign && form.exchangeRate !== '' && !(Number(form.exchangeRate) > 0)) next.exchangeRate = 'Enter a positive rate';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const payload = { amount: typed, paymentDate: form.paymentDate, method: form.method, reference: form.reference.trim() };
    if (form.note.trim()) payload.note = form.note.trim();
    if (form.bankAccount) payload.bankAccount = form.bankAccount;
    if (foreign && form.exchangeRate !== '') payload.exchangeRate = Number(form.exchangeRate);
    setBusy(true);
    const result = await run('recordPayment', record._id, payload);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length) failed = await uploadStagedFiles(api, record._id, files);
    setBusy(false);
    onSaved(receipt ? 'Payment received and recorded' : 'Payment recorded', failed);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Record Payment"
      subtitle={receipt ? 'Record a payment received from the customer' : 'Record a payment made against an outstanding supplier invoice'}
      maxWidth="640px"
    >
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label={receipt ? 'Invoice ID' : 'Payable ID'}><Input value={reference} disabled /></Field>
          <Field label={receipt ? 'Client' : 'Vendor'}><Input value={party} disabled /></Field>
        </TwoCol>
        <Field label="Project"><Input value={record.project ? populatedName(record.project) : '—'} disabled /></Field>
        <TwoCol>
          <Field label="Currency"><Input value={record.currency} disabled /></Field>
          <Field label={receipt ? 'Invoice amount (net receivable)' : 'Invoice amount (net payable)'}><Input value={money(totalLabel, record.currency)} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label={receipt ? 'Amount received' : 'Amount paid'} required error={errors.amount}><MoneyInput value={form.amount} onChange={(v) => set('amount', v)} error={errors.amount} /></Field>
          <Field label="Outstanding balance after this payment"><Input value={money(Math.max(remaining, 0), record.currency)} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Payment date" required error={errors.paymentDate}><DatePicker value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} error={Boolean(errors.paymentDate)} /></Field>
          <Field label="Payment method" required><Choice value={form.method} onChange={(v) => set('method', v)} options={PAYMENT_METHODS} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Transaction reference" required error={errors.reference}><Input value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="e.g. NIP45892031" error={Boolean(errors.reference)} /></Field>
          <Field label="Payment account" error={errors.bankAccount} help="Leave blank to use the default bank account.">
            <Choice value={form.bankAccount} onChange={(v) => set('bankAccount', v)} options={[{ value: '', label: 'Default bank account' }, ...accounts.options]} searchable placeholder={accounts.loading ? 'Loading accounts…' : 'Select account'} />
          </Field>
        </TwoCol>
        {foreign && (
          <Field label="Exchange rate on the payment date (NGN per 1)" error={errors.exchangeRate} help="Leave blank to use the rate table; a difference from the document rate is booked as realised FX gain or loss.">
            <Input value={form.exchangeRate} inputMode="decimal" onChange={(e) => set('exchangeRate', e.target.value)} error={Boolean(errors.exchangeRate)} />
          </Field>
        )}
        <Field label="Remarks (optional)"><Textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder={receipt ? 'First milestone payment received from client.' : 'First instalment payment for the invoice.'} /></Field>
        {canAttach && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Recording…' : 'Record Payment'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}
