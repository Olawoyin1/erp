import { useMemo, useState } from 'react';
import { FiUpload, FiPlus, FiEye, FiTruck, FiCheckCircle, FiClock, FiAlertTriangle, FiEdit2 } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { deliveriesSlice } from '../../store/procurement/slices';
import { apiError } from '../../services/apiHelpers';
import { deliveryService } from '../../services/procurement.service';
import {
  countFilters, fieldErrorsOf, formatDate, formatDateTime, refId, refName, statValue, statChange, statusLabel, toQuantity, ymd, uploadStagedFiles,
} from './shared/procUtils';
import { useExport, useFetched, useLookups, useProcList, useRecord, useSelection } from './shared/procHooks';
import {
  Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, PageHeader, Panel, PrimaryButton, SecondaryButton,
  StatTiles, StatusBadge, StatusLine, TabBar, TwoCol, ViewHeader,
} from './shared/ProcUi';
import { AttachField, AttachToRecordDialog, DocumentList } from './shared/ProcExtras';

const STATUSES = ['in_production', 'ready_for_shipment', 'customs_clearance', 'in_transit', 'delivered', 'delayed'];
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: statusLabel(s) }));

const EXPORT_COLUMNS = [
  { label: 'Delivery Ref', value: (d) => d.deliveryRef },
  { label: 'PO No', value: (d) => refName(d.poId, 'poNo') },
  { label: 'Vendor', value: (d) => refName(d.vendorId, 'vendorName') },
  { label: 'Material', value: (d) => d.material },
  { label: 'Quantity', value: (d) => d.quantity },
  { label: 'Expected Delivery', value: (d) => ymd(d.expectedDeliveryDate) },
  { label: 'Status', value: (d) => statusLabel(d.status) },
  { label: 'Latest Note', value: (d) => d.statusNote || '' },
];

function NewDeliveryModal({ lookups, onClose, onSaved }) {
  const orders = lookups.acknowledgedOrders || [];
  const [form, setForm] = useState({ poId: '', material: '', quantity: '', due: '', location: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const order = orders.find((o) => o._id === form.poId);

  const pickOrder = (id) => {
    const next = orders.find((o) => o._id === id);
    const first = next?.materialServiceSpecification?.[0];
    setForm({
      poId: id,
      material: first ? first.item : '',
      quantity: first ? String(first.quantity) : '',
      due: ymd(next?.expectedDeliveryDate),
      location: refId(next?.deliveryLocation),
    });
  };

  const submit = async () => {
    const next = {};
    if (!form.poId) next.poId = 'Choose the acknowledged purchase order';
    if (!form.material.trim()) next.material = 'Enter the material being delivered';
    if (Number.isNaN(toQuantity(form.quantity))) next.quantity = 'Enter a quantity above zero';
    if (!form.due) next.expectedDeliveryDate = 'Choose the expected delivery date';
    if (!form.location) next.deliveryLocation = 'Choose the delivery location';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      const res = await deliveryService.create({
        poId: form.poId,
        material: form.material.trim(),
        quantity: toQuantity(form.quantity),
        expectedDeliveryDate: form.due,
        deliveryLocation: form.location,
      });
      let note = '';
      const saved = res.data?.data;
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(deliveryService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`Delivery ${saved?.deliveryRef || ''} is now being tracked.${note}`);
    } catch (err) {
      setError(apiError(err, 'The delivery could not be created'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New Delivery"
      subtitle="Start tracking a delivery against an acknowledged purchase order."
      maxWidth="600px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Start Tracking'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Purchase order" required error={errors.poId} help="Only acknowledged orders can be tracked.">
          <Choice
            value={form.poId}
            onChange={pickOrder}
            searchable
            placeholder="Select a purchase order"
            options={orders.map((o) => ({ value: o._id, label: `${o.poNo}: ${refName(o.vendorId, 'vendorName')}` }))}
            error={errors.poId}
          />
        </Field>
        <Field label="Material" required error={errors.material} help={order && order.materialServiceSpecification.length > 1 ? 'This order has several lines; track one delivery per shipment.' : undefined}>
          <Input value={form.material} onChange={(e) => set('material', e.target.value)} error={Boolean(errors.material)} />
        </Field>
        {order && order.materialServiceSpecification.length > 1 && (
          <Field label="Fill from order line">
            <Choice
              value=""
              onChange={(v) => {
                const line = order.materialServiceSpecification[Number(v)];
                if (line) setForm((f) => ({ ...f, material: line.item, quantity: String(line.quantity) }));
              }}
              placeholder="Pick a line to copy"
              options={order.materialServiceSpecification.map((l, i) => ({ value: String(i), label: `${l.item} (${l.quantity} ${l.unit})` }))}
            />
          </Field>
        )}
        <TwoCol>
          <Field label="Quantity" required error={errors.quantity}>
            <Input value={form.quantity} inputMode="decimal" onChange={(e) => set('quantity', e.target.value)} error={Boolean(errors.quantity)} />
          </Field>
          <Field label="Expected delivery date" required error={errors.expectedDeliveryDate}>
            <DatePicker value={form.due} onChange={(e) => set('due', e.target.value)} error={Boolean(errors.expectedDeliveryDate)} />
          </Field>
        </TwoCol>
        <Field label="Delivery location" required error={errors.deliveryLocation}>
          <Choice value={form.location} onChange={(v) => set('location', v)} searchable placeholder="Select a location" options={(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))} error={errors.deliveryLocation} />
        </Field>
        <Field label="Attach document (optional)">
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function UpdateStatusModal({ delivery, onClose, onSaved }) {
  const [status, setStatus] = useState(delivery.status);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await deliveryService.updateStatus(delivery._id, { status, ...(note.trim() ? { statusNote: note.trim() } : {}) });
      onSaved(`Delivery ${delivery.deliveryRef} marked ${statusLabel(status)}`);
    } catch (err) {
      setError(apiError(err, 'The status could not be updated'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Update Delivery Status"
      subtitle={`${delivery.deliveryRef} • ${refName(delivery.poId, 'poNo')}`}
      maxWidth="480px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Updating…' : 'Update'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <div style={{ fontSize: '0.813rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
          Current status: <StatusBadge status={delivery.status} />
        </div>
        <Field label="Delivery status" required error={errors.status}>
          <Choice value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </Field>
        <Field label="Update note" error={errors.statusNote} help="Record exceptions such as a customs hold or a breakdown. A new note replaces the previous one; the full history stays on the timeline.">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter update details..." />
        </Field>
        {delivery.statusNote && <Panel title="Previous note">{delivery.statusNote}</Panel>}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewDeliveryModal({ id, refreshKey, tab, onTab, canUpdate, onUpdate, onClose }) {
  const { record, error, loading } = useRecord(deliveryService, id, refreshKey);
  const timeline = useFetched(() => deliveryService.timeline(id), tab === 'timeline' ? `${id}:${refreshKey}` : null);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="760px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading delivery…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader icon={<FiTruck size={22} />} title={refName(record.vendorId, 'vendorName')} subtitle={`${record.deliveryRef} • ${refName(record.poId, 'poNo')}`}>
            {canUpdate && <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => onUpdate(record)}>Update Status</SecondaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          <TabBar tabs={[{ id: 'details', label: 'Delivery Details' }, { id: 'timeline', label: 'Delivery Timeline' }, { id: 'documents', label: 'Documents' }]} active={tab} onChange={onTab} />

          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Delivery reference', record.deliveryRef],
                  ['Purchase order no', refName(record.poId, 'poNo')],
                  ['Linked RFQ no', record.linkedRfqId ? refName(record.linkedRfqId, 'rfqId') : '—'],
                  ['Vendor', refName(record.vendorId, 'vendorName')],
                  ['Linked project', record.linkedProjectId ? refName(record.linkedProjectId, 'projectName') : 'None'],
                  ['Material', record.material],
                  ['Quantity', record.quantity],
                  ['Expected delivery date', formatDate(record.expectedDeliveryDate)],
                  ['Delivery location', refName(record.deliveryLocation, 'name')],
                  ['Status', statusLabel(record.status)],
                  record.deliveredAt ? ['Delivered on', formatDateTime(record.deliveredAt)] : null,
                ]}
              />
              {record.statusNote && <Panel title="Latest note">{record.statusNote}</Panel>}
            </>
          )}

          {tab === 'timeline' && (
            <div style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', padding: 24 }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Delivery timeline</div>
              {timeline.loading && <span style={{ color: '#64748B', fontSize: '0.84rem' }}>Loading timeline…</span>}
              {timeline.error && <FormError message={timeline.error} />}
              {!timeline.loading && !timeline.error && timeline.data.length === 0 && <span style={{ color: '#94A3B8', fontSize: '0.84rem' }}>No history recorded yet.</span>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {timeline.data.map((entry, i) => (
                  <div key={`${entry.at}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', marginTop: 4, flexShrink: 0, backgroundColor: entry.toStatus === 'delivered' ? '#10B981' : entry.toStatus === 'delayed' ? '#EF4444' : '#3B82F6' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{entry.toStatus ? statusLabel(entry.toStatus) : entry.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                        {formatDateTime(entry.at)}{entry.actor ? ` • ${entry.actor}` : ''}{entry.note ? ` — ${entry.note}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <>
              <Note>Delivery documents added when the goods are inspected on receipt appear here as well.</Note>
              <DocumentList key={record._id} api={deliveryService} id={record._id} canUpload={canUpdate} title="Delivery documents" />
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function ExpeditingDelivery() {
  const canCreate = usePermission('procurement.delivery.create');
  const canUpdate = usePermission('procurement.delivery.update');

  const list = useProcList(deliveriesSlice, { initialFilters: { status: '', late: '', vendorId: '', dateFrom: '', dateTo: '' } });
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const { lookups } = useLookups(['locations', 'acknowledgedOrders', 'vendors']);
  const exporter = useExport(deliveryService, list, selection, EXPORT_COLUMNS, 'delivery-status-log.csv');

  const [newOpen, setNewOpen] = useState(false);
  const [statusFor, setStatusFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewTab, setViewTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const columns = useMemo(() => [
    { key: 'deliveryRef', label: 'DELIVERY REF', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'poId', label: 'PO NO', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'poNo')}</span> },
    { key: 'vendorId', label: 'VENDOR', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{refName(v, 'vendorName')}</span> },
    { key: 'material', label: 'MATERIAL', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'expectedDeliveryDate', label: 'EXPECTED DELIVERY', render: (v, row) => (
      <span style={{ color: row.status !== 'delivered' && v && new Date(v) < new Date() ? '#DC2626' : '#64748B' }}>{formatDate(v)}</span>
    ) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="icon-btn" title="View Delivery Details" aria-label="View delivery details" onClick={() => { setViewId(row._id); setViewTab('details'); }} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
          {canUpdate ? <RowMenu items={[{ label: 'Update Delivery Status', icon: <FiEdit2 size={14} color="#1E3A8A" />, action: () => setStatusFor(row) }]} /> : <span style={{ width: 24 }} />}
        </div>
      ),
    },
  ], [canUpdate]);

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast('Delivery status log exported', 'success');
  };

  const tiles = [
    { label: 'ACTIVE DELIVERIES', value: statValue(list.stats, 'active_deliveries'), sub: 'Deliveries currently being monitored', icon: <FiTruck size={18} />, tone: 'blue' },
    { label: 'DUE THIS WEEK', value: statValue(list.stats, 'due_this_week'), sub: 'Scheduled to arrive within next 7 days', icon: <FiClock size={18} />, tone: 'amber' },
    {
      label: 'ON-TIME DELIVERY RATE',
      value: `${statValue(list.stats, 'on_time_rate')}%`,
      sub: statChange(list.stats, 'on_time_rate') ? `Based on ${statChange(list.stats, 'on_time_rate')} completed deliveries` : 'No completed deliveries yet',
      icon: <FiCheckCircle size={18} />,
      tone: 'green',
    },
    { label: 'DELAYED DELIVERIES', value: statValue(list.stats, 'late_deliveries'), sub: 'Past the expected delivery date', subColor: '#DC2626', icon: <FiAlertTriangle size={18} />, tone: 'red' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'late', label: 'Timing', allLabel: 'All deliveries', options: [{ value: 'true', label: 'Past the expected date and not delivered' }] },
    { key: 'vendorId', label: 'Vendor', options: (lookups.vendors || []).map((v) => ({ value: v._id, label: v.vendorName })) },
    { key: 'dateFrom', label: 'Expected from', type: 'date' },
    { key: 'dateTo', label: 'Expected to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Expediting & Delivery" subtitle="Track vendor fulfilment, shipment progress, and scheduled deliveries to ensure materials arrive on time">
        {(canCreate || canUpdate) && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No delivery tracking records found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Delivery Ref, PO No, Vendor ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setNewOpen(true)}>New Delivery</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Deliveries" subtitle="Narrow the delivery log." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {newOpen && (
        <NewDeliveryModal
          lookups={lookups}
          onClose={() => setNewOpen(false)}
          onSaved={(message) => { setNewOpen(false); showToast(message, 'success'); refresh(); }}
        />
      )}

      {statusFor && (
        <UpdateStatusModal
          key={statusFor._id}
          delivery={statusFor}
          onClose={() => setStatusFor(null)}
          onSaved={(message) => { setStatusFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewDeliveryModal
          id={viewId}
          refreshKey={refreshKey}
          tab={viewTab}
          onTab={setViewTab}
          canUpdate={canUpdate}
          onUpdate={setStatusFor}
          onClose={() => setViewId(null)}
        />
      )}

      {uploadOpen && (
        <AttachToRecordDialog
          api={deliveryService}
          title="Upload Delivery Document"
          recordNoun="delivery"
          recordLabel={(d) => `${d.deliveryRef}: ${d.material}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
