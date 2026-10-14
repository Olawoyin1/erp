import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiUpload, FiPlus, FiEye, FiEdit, FiCheck, FiX, FiCheckCircle, FiFileText, FiShoppingBag, FiAlertTriangle } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { ordersSlice } from '../../store/procurement/slices';
import { apiError } from '../../services/apiHelpers';
import { deliveryService, goodsReceiptService, purchaseOrderService } from '../../services/procurement.service';
import {
  CATEGORIES, UNITS, countFilters, csvMoney, fieldErrorsOf, formatDate, fromKobo, money, refId, refName, rowErrorsOf, statChange, statValue,
  statusLabel, toKobo, toQuantity, toOptions, today, uploadStagedFiles, ymd,
} from './shared/procUtils';
import { useExport, useFetched, useLookups, useProcList, useRecord, useRunAction, useSelection } from './shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, PageHeader, PrimaryButton, ReasonModal,
  RecordSummary, SecondaryButton, SimpleTable, StatTiles, StatusBadge, StatusLine, Tag, TabBar, TwoCol, ViewHeader,
} from './shared/ProcUi';
import { AttachField, AttachToRecordDialog, DocumentList } from './shared/ProcExtras';

const EXPORT_COLUMNS = [
  { label: 'PO No', value: (o) => o.poNo },
  { label: 'Vendor', value: (o) => refName(o.vendorId, 'vendorName') },
  { label: 'Linked RFQ/RFP', value: (o) => (o.linkedRfqId ? refName(o.linkedRfqId, 'rfqId') : '') },
  { label: 'Category', value: (o) => o.procurementCategory },
  { label: 'PO Value (NGN)', value: (o) => csvMoney(o.poValue) },
  { label: 'PO Date', value: (o) => ymd(o.poDate) },
  { label: 'Delivery Due', value: (o) => ymd(o.expectedDeliveryDate) },
  { label: 'Status', value: (o) => statusLabel(o.status) },
];

const STATUS_OPTIONS = [
  { value: 'awarded', label: 'Awarded' },
  { value: 'issued', label: 'Issued' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'cancelled', label: 'Cancelled' },
];

const blankLine = { item: '', quantity: '', unit: 'Units', price: '' };

const lineTotal = (line) => {
  const qty = toQuantity(line.quantity);
  const price = toKobo(line.price);
  return Number.isNaN(qty) || Number.isNaN(price) ? 0 : Math.round(qty * price);
};

function initialState(order) {
  if (!order) {
    return { rfqId: '', vendor: '', project: '', category: 'Materials', poDate: today(), due: '', location: '', terms: '', reason: '', lines: [{ ...blankLine }] };
  }
  return {
    rfqId: refId(order.linkedRfqId),
    vendor: refId(order.vendorId),
    project: refId(order.linkedProjectId),
    category: order.procurementCategory,
    poDate: ymd(order.poDate),
    due: ymd(order.expectedDeliveryDate),
    location: refId(order.deliveryLocation),
    terms: order.paymentTerms || '',
    reason: order.directOrderReason || '',
    lines: (order.materialServiceSpecification || []).map((l) => ({ item: l.item, quantity: String(l.quantity), unit: l.unit, price: fromKobo(l.unitPrice) })),
  };
}

function OrderFormModal({ order, presetRfqId, lookups, onClose, onSaved }) {
  const editing = Boolean(order);
  const locked = editing && order.status === 'acknowledged';
  const [form, setForm] = useState(() => initialState(order));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLine = (index, patch) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));

  const rfqs = useMemo(() => lookups.awardedRfqs || [], [lookups.awardedRfqs]);
  const rfq = rfqs.find((r) => r._id === form.rfqId);
  const linked = Boolean(form.rfqId);
  const vendorFixed = locked || linked;
  const total = form.lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const limit = lookups.directOrderLimit;
  const overLimit = !linked && limit > 0 && total > limit;

  const pickRfq = (id) => {
    const next = rfqs.find((r) => r._id === id);
    if (!next) {
      setForm((f) => ({ ...f, rfqId: '' }));
      return;
    }
    setForm((f) => ({
      ...f,
      rfqId: id,
      vendor: refId(next.awardedVendorId),
      project: refId(next.linkedProjectId) || f.project,
      category: next.procurementCategory,
      location: refId(next.deliveryLocation) || f.location,
      terms: next.paymentTerms || f.terms,
      reason: '',
      lines: (next.materialServiceSpecification || []).map((l) => ({ item: l.item, quantity: String(l.quantity), unit: l.unit, price: '' })),
    }));
  };

  const [presetApplied, setPresetApplied] = useState(false);
  if (presetRfqId && !presetApplied && rfqs.length > 0 && !editing) {
    setPresetApplied(true);
    pickRfq(presetRfqId);
  }

  const validate = () => {
    const next = {};
    if (!form.vendor) next.vendorId = 'Choose the vendor';
    if (!form.due) next.expectedDeliveryDate = 'Choose the expected delivery date';
    if (!form.location) next.deliveryLocation = 'Choose the delivery location';
    if (!linked && !editing && form.reason.trim().length < 5) next.directOrderReason = 'Explain why this was not competitively sourced (at least 5 characters)';
    if (!linked && editing && !order.linkedRfqId && form.reason.trim().length < 5) next.directOrderReason = 'Explain why this was not competitively sourced (at least 5 characters)';
    const lineProblems = {};
    form.lines.forEach((l, i) => {
      const row = {};
      if (!l.item.trim()) row.item = 'Required';
      if (Number.isNaN(toQuantity(l.quantity))) row.quantity = 'Enter a quantity above zero';
      if (Number.isNaN(toKobo(l.price))) row.unitPrice = 'Enter the unit price in naira';
      if (Object.keys(row).length) lineProblems[i] = row;
    });
    setErrors(next);
    setRowErrors(lineProblems);
    return Object.keys(next).length === 0 && Object.keys(lineProblems).length === 0;
  };

  const lines = () => form.lines.map((l) => ({ item: l.item.trim(), quantity: toQuantity(l.quantity), unit: l.unit, unitPrice: toKobo(l.price) }));

  const save = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      let saved;
      if (editing) {
        const patch = locked
          ? { expectedDeliveryDate: form.due, deliveryLocation: form.location, ...(form.terms.trim() ? { paymentTerms: form.terms.trim() } : {}) }
          : {
              vendorId: form.vendor,
              ...(form.project ? { linkedProjectId: form.project } : {}),
              procurementCategory: form.category,
              poDate: form.poDate || undefined,
              expectedDeliveryDate: form.due,
              deliveryLocation: form.location,
              ...(form.terms.trim() ? { paymentTerms: form.terms.trim() } : {}),
              materialServiceSpecification: lines(),
            };
        const res = await purchaseOrderService.update(order._id, patch);
        saved = res.data?.data;
      } else {
        const res = await purchaseOrderService.create({
          ...(linked ? { linkedRfqId: form.rfqId } : { directOrderReason: form.reason.trim() }),
          vendorId: form.vendor,
          ...(form.project ? { linkedProjectId: form.project } : {}),
          procurementCategory: form.category,
          ...(form.poDate ? { poDate: form.poDate } : {}),
          expectedDeliveryDate: form.due,
          deliveryLocation: form.location,
          ...(form.terms.trim() ? { paymentTerms: form.terms.trim() } : {}),
          materialServiceSpecification: lines(),
        });
        saved = res.data?.data;
      }
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(purchaseOrderService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(editing ? `Purchase order updated.${note}` : `Purchase order ${saved?.poNo || ''} created${saved?.status === 'issued' ? ' and issued to the vendor' : ''}.${note}`);
    } catch (err) {
      const payload = err?.response?.data?.error;
      setError(apiError(err, 'The purchase order could not be saved'));
      setErrors(fieldErrorsOf(payload));
      setRowErrors(rowErrorsOf(payload, 'materialServiceSpecification'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Purchase Order' : 'Create Purchase Order'}
      subtitle={editing ? order.poNo : 'Create a purchase order for goods or services.'}
      maxWidth="780px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Create PO'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        {locked && <Note tone="amber">The vendor has acknowledged this order, so the vendor, project, category and lines are locked. Delivery date, location and payment terms can still change; to change anything else, cancel the order and raise a new one.</Note>}
        <TwoCol>
          <Field label="Purchase order no" help="Assigned automatically when the order is created.">
            <Input value={editing ? order.poNo : ''} placeholder="Assigned on save" disabled />
          </Field>
          <Field label="Linked RFQ (optional)" error={errors.linkedRfqId} help={editing ? 'Fixed once the order exists.' : 'An order without an RFQ is a direct order.'}>
            <Choice
              value={form.rfqId}
              onChange={pickRfq}
              searchable
              disabled={editing}
              placeholder={editing ? (order.linkedRfqId ? refName(order.linkedRfqId, 'rfqId') : 'Direct order') : 'Direct order (no RFQ)'}
              options={[{ value: '', label: 'Direct order (no RFQ)' }, ...rfqs.map((r) => ({ value: r._id, label: `${r.rfqId}: ${r.rfqTitle}` }))]}
              error={errors.linkedRfqId}
            />
          </Field>
        </TwoCol>
        {rfq && rfq.awardedAmount != null && <Note>Awarded quotation for this RFQ: <strong>{money(rfq.awardedAmount)}</strong>. Enter unit prices that add up to the agreed price.</Note>}

        <Field label="Vendor" required error={errors.vendorId} help={linked ? "Must be the RFQ's awarded vendor." : undefined}>
          <Choice
            value={form.vendor}
            onChange={(v) => set('vendor', v)}
            searchable
            disabled={vendorFixed}
            placeholder="Select an active vendor"
            options={(lookups.vendors || []).map((v) => ({ value: v._id, label: v.vendorName }))
              .concat(editing && !(lookups.vendors || []).some((v) => v._id === form.vendor) ? [{ value: form.vendor, label: refName(order.vendorId, 'vendorName') }] : [])}
            error={errors.vendorId}
          />
        </Field>
        <Field label="Linked project" error={errors.linkedProjectId}>
          <Choice
            value={form.project}
            onChange={(v) => set('project', v)}
            searchable
            disabled={locked}
            placeholder="No project"
            options={[{ value: '', label: 'No project' }, ...toOptions(lookups.projects, (p) => `${p.projectId}: ${p.projectName}`)]}
          />
        </Field>
        <TwoCol>
          <Field label="Procurement category" required error={errors.procurementCategory}>
            <Choice value={form.category} onChange={(v) => set('category', v)} disabled={locked || linked} options={CATEGORIES} />
          </Field>
          <Field label="Purchase order value (₦)" help="The sum of the lines below, worked out in whole kobo.">
            <Input value={money(total)} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Purchase order date" error={errors.poDate}>
            <DatePicker value={form.poDate} onChange={(e) => set('poDate', e.target.value)} disabled={locked} />
          </Field>
          <Field label="Expected delivery date" required error={errors.expectedDeliveryDate}>
            <DatePicker value={form.due} onChange={(e) => set('due', e.target.value)} error={Boolean(errors.expectedDeliveryDate)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Delivery location" required error={errors.deliveryLocation}>
            <Choice value={form.location} onChange={(v) => set('location', v)} searchable placeholder="Select a location" options={toOptions(lookups.locations, 'name')} error={errors.deliveryLocation} />
          </Field>
          <Field label="Payment terms" error={errors.paymentTerms}>
            <Input value={form.terms} onChange={(e) => set('terms', e.target.value)} placeholder="e.g. 30% advance, balance net 30" />
          </Field>
        </TwoCol>

        {!linked && (!editing || !order.linkedRfqId) && (
          <>
            <Field label="Reason for direct order" required error={errors.directOrderReason} help="Required when no RFQ is linked: say why this was not competitively sourced.">
              <Textarea rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} disabled={locked} error={Boolean(errors.directOrderReason)} />
            </Field>
            {limit > 0 && (
              <Note tone={overLimit ? 'red' : 'blue'}>
                {overLimit ? <FiAlertTriangle style={{ verticalAlign: '-2px', marginRight: 6 }} /> : null}
                Direct orders (no RFQ) cannot exceed <strong>{money(limit)}</strong>. {overLimit ? 'This order is above the limit: source it through an awarded RFQ instead.' : 'Anything larger must come from an awarded RFQ.'}
              </Note>
            )}
          </>
        )}

        <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B' }}>Material / Service Specification</span>
            {!locked && <button type="button" onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { ...blankLine }] }))} style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>+ Add Item</button>}
          </div>
          {form.lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 1.2fr 1.2fr auto', gap: 8, alignItems: 'start' }}>
              <div>
                <Input value={line.item} onChange={(e) => setLine(i, { item: e.target.value })} placeholder="Item description" disabled={locked} error={Boolean(rowErrors[i]?.item)} />
                {rowErrors[i]?.item && <span style={{ fontSize: '0.72rem', color: '#DC2626' }}>{rowErrors[i].item}</span>}
              </div>
              <div>
                <Input value={line.quantity} inputMode="decimal" onChange={(e) => setLine(i, { quantity: e.target.value })} placeholder="Qty" disabled={locked} error={Boolean(rowErrors[i]?.quantity)} />
                {rowErrors[i]?.quantity && <span style={{ fontSize: '0.72rem', color: '#DC2626' }}>{rowErrors[i].quantity}</span>}
              </div>
              <Choice value={line.unit} onChange={(v) => setLine(i, { unit: v })} disabled={locked} options={UNITS} />
              <div>
                <Input value={line.price} inputMode="decimal" onChange={(e) => setLine(i, { price: e.target.value.replace(/,/g, '') })} placeholder="Unit price ₦" disabled={locked} error={Boolean(rowErrors[i]?.unitPrice)} />
                {rowErrors[i]?.unitPrice && <span style={{ fontSize: '0.72rem', color: '#DC2626' }}>{rowErrors[i].unitPrice}</span>}
              </div>
              <div style={{ padding: '10px 4px', fontSize: '0.84rem', fontWeight: 600, color: '#0F172A', textAlign: 'right' }}>{money(lineTotal(line))}</div>
              <button
                type="button"
                aria-label="Remove line"
                disabled={locked || form.lines.length === 1}
                onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))}
                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: locked || form.lines.length === 1 ? 'not-allowed' : 'pointer', padding: '10px 4px', opacity: locked || form.lines.length === 1 ? 0.4 : 1 }}
              >
                ×
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.86rem', fontWeight: 700, color: '#1E3A8A' }}>Total {money(total)}</div>
        </div>

        {!editing && (
          <Field label="Attach document (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function TrackingTab({ order }) {
  const deliveries = useFetched(() => deliveryService.list({ poId: order._id, limit: 100 }), order._id);
  const receipts = useFetched(() => goodsReceiptService.list({ poId: order._id, limit: 100 }), order._id);
  const canDeliveries = usePermission('procurement.delivery.view');
  const canReceipts = usePermission('procurement.goodsreceipt.view');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {canDeliveries && (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Deliveries</div>
          {deliveries.error && <FormError message={deliveries.error} />}
          <SimpleTable
            empty={deliveries.loading ? 'Loading…' : 'No delivery has been opened for this order yet.'}
            rows={deliveries.data}
            columns={[
              { key: 'deliveryRef', label: 'Delivery ref' },
              { key: 'material', label: 'Material' },
              { key: 'expectedDeliveryDate', label: 'Expected', render: (r) => formatDate(r.expectedDeliveryDate) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </div>
      )}
      {canReceipts && (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Goods receipts</div>
          {receipts.error && <FormError message={receipts.error} />}
          <SimpleTable
            empty={receipts.loading ? 'Loading…' : 'No goods have been received against this order yet.'}
            rows={receipts.data}
            columns={[
              { key: 'grnNo', label: 'GRN no' },
              { key: 'material', label: 'Material' },
              { key: 'receiptDate', label: 'Received', render: (r) => formatDate(r.receiptDate) },
              { key: 'status', label: 'Inspection', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </div>
      )}
      {!canDeliveries && !canReceipts && <Note>Delivery and receipt tracking is only shown to users who can view deliveries or goods receipts.</Note>}
    </div>
  );
}

function ViewOrderModal({ id, refreshKey, tab, onTab, canUpdate, canDecide, onAction, onEdit, onClose }) {
  const { record, error, loading } = useRecord(purchaseOrderService, id, refreshKey);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="800px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading purchase order…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader icon={<FiShoppingBag size={22} />} title={refName(record.vendorId, 'vendorName')} subtitle={`${record.poNo} • ${record.linkedRfqId ? refName(record.linkedRfqId, 'rfqId') : 'Direct PO'}`}>
            {['awarded', 'issued'].includes(record.status) && canDecide && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => onAction('acknowledge', record)}>Acknowledged</PrimaryButton>}
            {record.status !== 'cancelled' && canDecide && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onAction('cancel', record)}>Cancel PO</SecondaryButton>}
            {record.status !== 'cancelled' && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(record)}>Edit PO</SecondaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          <TabBar
            tabs={[{ id: 'details', label: 'PO Details' }, { id: 'items', label: 'Ordered Items' }, { id: 'tracking', label: 'Delivery Tracking' }, { id: 'documents', label: 'Documents' }]}
            active={tab}
            onChange={onTab}
          />
          {tab === 'details' && (
            <DetailGrid
              items={[
                ['Purchase order no', record.poNo],
                ['Linked RFQ', record.linkedRfqId ? `${refName(record.linkedRfqId, 'rfqId')}: ${record.linkedRfqId.rfqTitle || ''}` : 'None (direct order)'],
                ['Vendor', refName(record.vendorId, 'vendorName')],
                ['Linked project', record.linkedProjectId ? refName(record.linkedProjectId, 'projectName') : 'None'],
                ['Procurement category', record.procurementCategory],
                ['Purchase order value', money(record.poValue)],
                ['Issue date', formatDate(record.poDate)],
                ['Expected delivery date', formatDate(record.expectedDeliveryDate)],
                ['Delivery location', refName(record.deliveryLocation, 'name')],
                ['Payment terms', record.paymentTerms || '—'],
                record.directOrderReason ? ['Reason for direct order', record.directOrderReason] : null,
                record.status === 'cancelled' ? ['Cancellation reason', record.cancellationReason || '—'] : null,
              ]}
            />
          )}
          {tab === 'items' && (
            <SimpleTable
              rows={record.materialServiceSpecification || []}
              empty="No line items recorded."
              columns={[
                { key: 'item', label: 'Description' },
                { key: 'quantity', label: 'Qty', align: 'center' },
                { key: 'unit', label: 'Unit', align: 'center' },
                { key: 'unitPrice', label: 'Unit price', align: 'right', render: (l) => money(l.unitPrice) },
                { key: 'total', label: 'Total', align: 'right', render: (l) => <strong>{money(l.total)}</strong> },
              ]}
              footer={(
                <tfoot>
                  <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                    <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase' }}>Total PO value</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#1E3A8A' }}>{money(record.poValue)}</td>
                  </tr>
                </tfoot>
              )}
            />
          )}
          {tab === 'tracking' && <TrackingTab key={record._id} order={record} />}
          {tab === 'documents' && <DocumentList key={record._id} api={purchaseOrderService} id={record._id} canUpload={canUpdate && record.status !== 'cancelled'} title="Purchase order documents" />}
        </div>
      )}
    </Modal>
  );
}

export default function PurchaseOrders() {
  const canCreate = usePermission('procurement.purchaseorder.create');
  const canUpdate = usePermission('procurement.purchaseorder.update');
  const canDecide = usePermission('procurement.purchaseorder.decide');
  const [searchParams, setSearchParams] = useSearchParams();
  const fromRfq = searchParams.get('fromRfq') || '';

  const list = useProcList(ordersSlice, { initialFilters: { status: '', procurementCategory: '', vendorId: '', dateFrom: '', dateTo: '' } });
  const run = useRunAction(ordersSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const { lookups } = useLookups(['vendors', 'projects', 'locations', 'awardedRfqs', 'directOrderLimit']);
  const exporter = useExport(purchaseOrderService, list, selection, EXPORT_COLUMNS, 'purchase-order-register.csv');

  const [formFor, setFormFor] = useState(fromRfq && canCreate ? 'new' : null);
  const [presetRfq, setPresetRfq] = useState(fromRfq && canCreate ? fromRfq : '');
  const [viewId, setViewId] = useState(null);
  const [viewTab, setViewTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (fromRfq) setSearchParams({}, { replace: true });
  }, [fromRfq, setSearchParams]);

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const doAction = async (method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await run(method, ...args);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      showToast(success, 'success');
      refresh();
    } else {
      setActionError(res.error);
      if (!confirm) showToast(res.error, 'error');
    }
  };

  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'cancelled') return items;
    if (canUpdate) items.push({ label: 'Edit Purchase Order', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (['awarded', 'issued'].includes(row.status) && canDecide) items.push({ label: 'Mark as Acknowledged', icon: <FiCheck size={14} color="#16A34A" />, action: () => ask('acknowledge', row) });
    if (canDecide) items.push({ label: 'Cancel Purchase Order', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('cancel', row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'poNo', label: 'PO NO', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'vendorId', label: 'VENDOR', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{refName(v, 'vendorName')}</span> },
    { key: 'linkedRfqId', label: 'LINKED RFQ / RFP', render: (v) => (v ? <span style={{ color: '#475569' }}>{refName(v, 'rfqId')}</span> : <Tag>Direct PO</Tag>) },
    { key: 'procurementCategory', label: 'CATEGORY', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'poValue', label: 'PO VALUE', render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{money(v)}</span> },
    { key: 'poDate', label: 'PO DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'expectedDeliveryDate', label: 'DELIVERY DUE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Purchase Order" aria-label="View purchase order" onClick={() => { setViewId(row._id); setViewTab('details'); }} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDecide]);

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast('Purchase order register exported', 'success');
  };

  const tiles = [
    { label: 'ACTIVE PURCHASE ORDER', value: statValue(list.stats, 'active_orders'), sub: `+${statChange(list.stats, 'active_orders') ?? 0} this week`, icon: <FiFileText size={18} />, tone: 'blue' },
    { label: 'PENDING VENDOR ACCEPTANCE', value: statValue(list.stats, 'pending_acceptance'), sub: 'Awaiting confirmation', icon: <FiAlertTriangle size={18} />, tone: 'amber' },
    { label: 'DELIVERED ORDERS', value: statValue(list.stats, 'delivered_orders'), sub: 'Completed this month', icon: <FiCheckCircle size={18} />, tone: 'green' },
    { label: 'OVERDUE DELIVERIES', value: statValue(list.stats, 'overdue_deliveries'), sub: 'Require follow-up', subColor: '#DC2626', icon: <FiX size={18} />, tone: 'red' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'procurementCategory', label: 'Procurement category', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'vendorId', label: 'Vendor', options: toOptions(lookups.vendors, 'vendorName') },
    { key: 'dateFrom', label: 'PO date from', type: 'date' },
    { key: 'dateTo', label: 'PO date to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Purchase Order Tracking" subtitle="Track purchase orders from issuance to vendor delivery and completion">
        {(canCreate || canUpdate) && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No purchase orders found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search PO No, Vendor ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => { setPresetRfq(''); setFormFor('new'); }}>Create PO</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Purchase Orders" subtitle="Narrow the register." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <OrderFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          order={formFor === 'new' ? null : formFor}
          presetRfqId={presetRfq}
          lookups={lookups}
          onClose={() => { setFormFor(null); setPresetRfq(''); }}
          onSaved={(message) => { setFormFor(null); setPresetRfq(''); setViewId(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewOrderModal
          id={viewId}
          refreshKey={refreshKey}
          tab={viewTab}
          onTab={setViewTab}
          canUpdate={canUpdate}
          canDecide={canDecide}
          onAction={ask}
          onEdit={(record) => { setViewId(null); setFormFor(record); }}
          onClose={() => setViewId(null)}
        />
      )}

      {uploadOpen && (
        <AttachToRecordDialog
          api={purchaseOrderService}
          title="Upload Purchase Order Document"
          recordNoun="purchase order"
          recordLabel={(o) => `${o.poNo}: ${refName(o.vendorId, 'vendorName')}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshKey((k) => k + 1); }}
        />
      )}

      {confirm?.type === 'acknowledge' && (
        <ConfirmModal
          title="Mark as Acknowledged?"
          message="Record that the vendor has accepted this order. Once acknowledged the vendor, project and lines are locked, and deliveries and goods receipts can be logged against it."
          detail={<RecordSummary rows={[['PO No', confirm.row.poNo], ['Vendor', refName(confirm.row.vendorId, 'vendorName')], ['Value', money(confirm.row.poValue)]]} />}
          confirmLabel="Mark Acknowledged"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('acknowledge', [confirm.row._id], `Purchase order ${confirm.row.poNo} acknowledged`)}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ReasonModal
          title="Cancel Purchase Order?"
          message={`Are you sure you want to cancel ${confirm.row.poNo}? It will be marked as cancelled and can no longer be used for procurement or warehouse processing.`}
          detail={<RecordSummary rows={[['Vendor', refName(confirm.row.vendorId, 'vendorName')], ['PO No', confirm.row.poNo]]} />}
          label="Reason for cancellation"
          confirmLabel="Confirm Cancellation"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('cancel', [confirm.row._id, reason], `Purchase order ${confirm.row.poNo} cancelled`)}
        />
      )}
    </div>
  );
}
