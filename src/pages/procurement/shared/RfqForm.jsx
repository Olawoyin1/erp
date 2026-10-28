import { useMemo, useState } from 'react';
import Drawer from '../../../components/ui/Drawer';
import { DatePicker, Input } from '../../../components/ui/FormField';
import { apiError } from '../../../services/apiHelpers';
import { procurementRfqService, purchaseRequisitionService } from '../../../services/procurement.service';
import { UNITS, fieldErrorsOf, rowErrorsOf, today, toQuantity, ymd, refId, uploadStagedFiles } from './procUtils';
import { Choice, Field, FormBody, FormError, PrimaryButton, SecondaryButton, Tag, TwoCol } from './ProcUi';
import { AttachField } from './ProcExtras';

const emptyLine = { item: '', quantity: '', unit: 'Units' };

function initialState({ rfq, requisition }) {
  if (rfq) {
    return {
      title: rfq.rfqTitle || '',
      type: rfq.rfqRfp || 'RFQ',
      requisitionId: refId(rfq.relatedRequisitionId),
      project: refId(rfq.linkedProjectId),
      closingDate: ymd(rfq.closingDate),
      location: refId(rfq.deliveryLocation),
      paymentTerms: rfq.paymentTerms || '',
      vendors: (rfq.invitedVendorIds || []).map(refId),
      lines: (rfq.materialServiceSpecification || []).map((l) => ({ item: l.item, quantity: String(l.quantity), unit: l.unit })),
    };
  }
  return {
    title: requisition ? `Pricing Request: ${requisition.requestedMaterialService}` : '',
    type: 'RFQ',
    requisitionId: requisition?._id || '',
    project: refId(requisition?.projectId),
    closingDate: '',
    location: '',
    paymentTerms: '',
    vendors: [],
    lines: requisition
      ? [{ item: requisition.requestedMaterialService, quantity: String(requisition.quantity || ''), unit: requisition.unit || 'Units' }]
      : [{ ...emptyLine }],
  };
}

/**
 * Create / edit RFQ or RFP. Creating always goes through "convert requisition to RFQ" so the requisition is
 * marked converted; editing is only offered for drafts (the backend refuses anything else).
 */
export default function RfqFormModal({ rfq, requisition, lookups, canIssue, onClose, onSaved }) {
  const editing = Boolean(rfq);
  const [form, setForm] = useState(() => initialState({ rfq, requisition }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [rowErrors, setRowErrors] = useState({});

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const requisitions = useMemo(() => {
    const list = lookups.approvedRequisitions || [];
    if (requisition && !list.some((r) => r._id === requisition._id)) return [requisition, ...list];
    return list;
  }, [lookups.approvedRequisitions, requisition]);
  const chosen = requisitions.find((r) => r._id === form.requisitionId);
  const category = editing ? rfq.procurementCategory : chosen?.category;

  const vendors = useMemo(() => {
    const list = [...(lookups.vendors || [])];
    return list.sort((a, b) => Number(b.approvedCategories?.includes(category)) - Number(a.approvedCategories?.includes(category)));
  }, [lookups.vendors, category]);

  const pickRequisition = (id) => {
    const next = requisitions.find((r) => r._id === id);
    setForm((f) => ({
      ...f,
      requisitionId: id,
      title: f.title || (next ? `Pricing Request: ${next.requestedMaterialService}` : ''),
      project: refId(next?.projectId) || f.project,
      lines: next ? [{ item: next.requestedMaterialService, quantity: String(next.quantity || ''), unit: next.unit || 'Units' }] : f.lines,
    }));
  };

  const setLine = (index, patch) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.rfqTitle = 'Enter a title';
    if (!editing && !form.requisitionId) next.relatedRequisitionId = 'Choose the approved requisition this sources';
    if (!form.closingDate) next.closingDate = 'Choose the closing date';
    if (!form.location) next.deliveryLocation = 'Choose the delivery location';
    if (form.vendors.length === 0) next.invitedVendorIds = 'Invite at least one vendor';
    const lineProblems = {};
    form.lines.forEach((l, i) => {
      const row = {};
      if (!l.item.trim()) row.item = 'Required';
      if (Number.isNaN(toQuantity(l.quantity))) row.quantity = 'Enter a quantity above zero';
      if (Object.keys(row).length) lineProblems[i] = row;
    });
    setErrors(next);
    setRowErrors(lineProblems);
    return Object.keys(next).length === 0 && Object.keys(lineProblems).length === 0;
  };

  const body = () => ({
    rfqTitle: form.title.trim(),
    rfqRfp: form.type,
    ...(form.project ? { linkedProjectId: form.project } : {}),
    closingDate: form.closingDate,
    deliveryLocation: form.location,
    ...(form.paymentTerms.trim() ? { paymentTerms: form.paymentTerms.trim() } : {}),
    invitedVendorIds: form.vendors,
    materialServiceSpecification: form.lines.map((l) => ({ item: l.item.trim(), quantity: toQuantity(l.quantity), unit: l.unit })),
  });

  const fail = (res) => {
    setError(res.error);
    setErrors(fieldErrorsOf(res.payload));
    setRowErrors(rowErrorsOf(res.payload, 'materialServiceSpecification'));
  };

  const save = async (issue) => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      let saved;
      if (editing) {
        await procurementRfqService.update(rfq._id, body());
        if (issue) await procurementRfqService.issue(rfq._id);
        saved = rfq;
      } else {
        const res = await purchaseRequisitionService.convertToRfq(form.requisitionId, { ...body(), issue });
        saved = res.data?.data;
      }
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(procurementRfqService, saved._id, files);
        if (failed.length) note = ` (documents not attached: ${failed.join('; ')})`;
      }
      onSaved(`${editing ? 'RFQ updated' : issue ? 'RFQ issued to the invited vendors' : 'RFQ saved as draft'}${issue && editing ? ' and issued' : ''}${note}`);
    } catch (err) {
      fail({ error: apiError(err, 'The RFQ could not be saved'), payload: err?.response?.data?.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit RFQ / RFP' : 'Create RFQ / RFP'}
      subtitle={editing ? 'Only a draft can be edited.' : 'Create a sourcing request for approved procurement requirements.'}
      width="720px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</SecondaryButton>
          {canIssue && <PrimaryButton onClick={() => save(true)} disabled={busy}>{editing ? 'Submit RFQ / RFP' : 'Issue RFQ'}</PrimaryButton>}
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="RFQ title" required error={errors.rfqTitle}>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Supply of Structural Steel Beams" error={Boolean(errors.rfqTitle)} />
        </Field>
        <TwoCol>
          <Field label="RFQ / RFP" required>
            <Choice value={form.type} onChange={(v) => set('type', v)} options={['RFQ', 'RFP']} />
          </Field>
          <Field label="Related requisition" required error={errors.relatedRequisitionId} help={editing ? 'Fixed once the RFQ exists.' : 'Only approved requisitions can be sourced.'}>
            {editing ? (
              <Input value={`${rfq.relatedRequisitionId?.requisitionId || ''} ${rfq.relatedRequisitionId?.requestedMaterialService ? `: ${rfq.relatedRequisitionId.requestedMaterialService}` : ''}`.trim()} disabled />
            ) : (
              <Choice
                value={form.requisitionId}
                onChange={pickRequisition}
                searchable
                disabled={Boolean(requisition)}
                placeholder="Select an approved requisition"
                options={requisitions.map((r) => ({ value: r._id, label: `${r.requisitionId}: ${r.requestedMaterialService}` }))}
                error={errors.relatedRequisitionId}
              />
            )}
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Procurement category" help="Taken from the requisition.">
            <Input value={category || ''} placeholder="Chosen with the requisition" disabled />
          </Field>
          <Field label="Issue date" help="Set automatically when the RFQ is issued.">
            <Input value={today()} disabled />
          </Field>
        </TwoCol>
        <Field label="Linked project" help="Select a project if this request is project-specific.">
          <Choice
            value={form.project}
            onChange={(v) => set('project', v)}
            searchable
            placeholder="No project"
            options={[{ value: '', label: 'No project' }, ...(lookups.projects || []).map((p) => ({ value: p._id, label: `${p.projectId}: ${p.projectName}` }))]}
          />
        </Field>
        <TwoCol>
          <Field label="Closing date" required error={errors.closingDate}>
            <DatePicker value={form.closingDate} onChange={(e) => set('closingDate', e.target.value)} error={Boolean(errors.closingDate)} />
          </Field>
          <Field label="Delivery location" required error={errors.deliveryLocation}>
            <Choice
              value={form.location}
              onChange={(v) => set('location', v)}
              searchable
              placeholder="Select a location"
              options={(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))}
              error={errors.deliveryLocation}
            />
          </Field>
        </TwoCol>
        <Field label="Payment terms">
          <Input value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} placeholder="e.g. Net 30" />
        </Field>

        <Field label="Invite vendors (select multiple)" required error={errors.invitedVendorIds} help="Only active vendors can be invited; vendors approved for this category are listed first.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', maxHeight: 200, overflowY: 'auto' }}>
            {vendors.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No active vendors yet. Approve a vendor prequalification first.</span>}
            {vendors.map((v) => (
              <label key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.vendors.includes(v._id)}
                  onChange={(e) => set('vendors', e.target.checked ? [...form.vendors, v._id] : form.vendors.filter((id) => id !== v._id))}
                  style={{ accentColor: '#1E3A8A' }}
                />
                {v.vendorName}
                {category && v.approvedCategories?.includes(category) && <Tag tone="green">Category match</Tag>}
              </label>
            ))}
          </div>
        </Field>

        <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B' }}>Material / Service Specification</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { ...emptyLine }] }))} style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>+ Add Item</button>
          </div>
          {form.lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'start' }}>
              <div>
                <Input value={line.item} onChange={(e) => setLine(i, { item: e.target.value })} placeholder="Item description" error={Boolean(rowErrors[i]?.item)} />
                {rowErrors[i]?.item && <span style={{ fontSize: '0.72rem', color: '#DC2626' }}>{rowErrors[i].item}</span>}
              </div>
              <div>
                <Input value={line.quantity} inputMode="decimal" onChange={(e) => setLine(i, { quantity: e.target.value })} placeholder="Qty" error={Boolean(rowErrors[i]?.quantity)} />
                {rowErrors[i]?.quantity && <span style={{ fontSize: '0.72rem', color: '#DC2626' }}>{rowErrors[i].quantity}</span>}
              </div>
              <Choice value={line.unit} onChange={(v) => setLine(i, { unit: v })} options={UNITS} />
              <button
                type="button"
                aria-label="Remove line"
                disabled={form.lines.length === 1}
                onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))}
                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: form.lines.length === 1 ? 'not-allowed' : 'pointer', padding: '10px 4px', opacity: form.lines.length === 1 ? 0.4 : 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {!editing && (
          <Field label="Attach document (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}
