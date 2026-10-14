import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiClipboard } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { goodsReceiptService } from '../../../services/procurement.service';
import { countFilters, fieldErrorsOf, formatDate, refId, refName, toQuantity, today, toOptions, uploadStagedFiles } from '../shared/procUtils';
import {
  Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, Panel, PrimaryButton, SecondaryButton, SimpleTable,
  StatusBadge, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../shared/ProcUi';
import { AttachField, DocumentList, DropZone } from '../shared/ProcExtras';
import { useRecord } from '../shared/procHooks';
import { FAILED_INSPECTION_CONSEQUENCE } from './inventoryConstants';

const INSPECTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
];

function LogReceiptModal({ lookups, onClose, onSaved }) {
  const orders = lookups.acknowledgedOrders || [];
  const [form, setForm] = useState({ poId: '', material: '', quantity: '', warehouse: '', receiptDate: today(), lines: [] });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const items = (warehouse) => (lookups.inventoryItems || []).filter((i) => refId(i.warehouseId) === warehouse);

  const pickOrder = (id) => {
    const order = orders.find((o) => o._id === id);
    const warehouse = refId(order?.deliveryLocation);
    const stock = items(warehouse);
    setForm((f) => ({
      ...f,
      poId: id,
      warehouse: warehouse || f.warehouse,
      material: order ? order.materialServiceSpecification.map((l) => l.item).join(', ').slice(0, 300) : '',
      quantity: order ? String(order.materialServiceSpecification.reduce((sum, l) => sum + l.quantity, 0)) : '',
      lines: (order?.materialServiceSpecification || []).map((l) => ({
        description: l.item,
        ordered: String(l.quantity),
        received: String(l.quantity),
        itemId: stock.find((i) => i.itemName.toLowerCase() === l.item.toLowerCase())?._id || '',
      })),
    }));
  };

  const setLine = (index, patch) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));

  const submit = async () => {
    const next = {};
    if (!form.poId) next.poId = 'Choose the acknowledged purchase order';
    if (!form.material.trim()) next.material = 'Describe the material received';
    if (Number.isNaN(toQuantity(form.quantity))) next.quantity = 'Enter the quantity received';
    if (!form.warehouse) next.warehouseId = 'Choose the receiving warehouse';
    if (form.lines.length === 0) next.receivedItems = 'Add at least one received line';
    const badLine = form.lines.findIndex((l) => !l.description.trim() || Number.isNaN(Number(l.ordered)) || l.received === '' || Number.isNaN(Number(l.received)) || Number(l.received) < 0);
    if (badLine >= 0) next.receivedItems = `Line ${badLine + 1} needs a description, an ordered quantity and a received quantity`;
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      const res = await goodsReceiptService.create({
        poId: form.poId,
        material: form.material.trim(),
        quantity: toQuantity(form.quantity),
        warehouseId: form.warehouse,
        ...(form.receiptDate ? { receiptDate: form.receiptDate } : {}),
        receivedItems: form.lines.map((l) => ({ description: l.description.trim(), orderedQty: Number(l.ordered), receivedQty: Number(l.received), ...(l.itemId ? { itemId: l.itemId } : {}) })),
      });
      let note = '';
      const saved = res.data?.data;
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(goodsReceiptService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`Goods receipt ${saved?.grnNo || ''} logged, awaiting inspection.${note}`);
    } catch (err) {
      const payload = err?.response?.data?.error;
      setError(apiError(err, 'The goods receipt could not be logged'));
      const fieldErrors = fieldErrorsOf(payload);
      const lineMessage = (payload?.details || []).find((d) => String(d.field).startsWith('receivedItems'))?.message;
      setErrors({ ...fieldErrors, ...(lineMessage ? { receivedItems: lineMessage } : {}) });
    } finally {
      setBusy(false);
    }
  };

  const warehouseItems = items(form.warehouse);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Log Goods Receipt"
      subtitle="Record materials arriving against an acknowledged purchase order. The receipt starts as pending inspection."
      maxWidth="760px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Log Receipt'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Purchase order" required error={errors.poId} help="Only acknowledged orders can receive goods.">
          <Choice value={form.poId} onChange={pickOrder} searchable placeholder="Select a purchase order" options={orders.map((o) => ({ value: o._id, label: `${o.poNo}: ${refName(o.vendorId, 'vendorName')}` }))} error={errors.poId} />
        </Field>
        <TwoCol>
          <Field label="Material" required error={errors.material}>
            <Input value={form.material} onChange={(e) => set('material', e.target.value)} error={Boolean(errors.material)} />
          </Field>
          <Field label="Total quantity received" required error={errors.quantity}>
            <Input value={form.quantity} inputMode="decimal" onChange={(e) => set('quantity', e.target.value)} error={Boolean(errors.quantity)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Warehouse" required error={errors.warehouseId}>
            <Choice
              value={form.warehouse}
              onChange={(v) => setForm((f) => ({ ...f, warehouse: v, lines: f.lines.map((l) => ({ ...l, itemId: '' })) }))}
              searchable
              placeholder="Select a warehouse"
              options={toOptions((lookups.locations || []).filter((l) => ['warehouse', 'yard'].includes(l.type)), 'name')}
              error={errors.warehouseId}
            />
          </Field>
          <Field label="Receipt date">
            <DatePicker value={form.receiptDate} onChange={(e) => set('receiptDate', e.target.value)} />
          </Field>
        </TwoCol>
        <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B' }}>Materials received</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { description: '', ordered: '0', received: '', itemId: '' }] }))} style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>+ Add line</button>
          </div>
          {form.lines.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Choose a purchase order to load its lines.</span>}
          {form.lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.8fr 1.6fr auto', gap: 8, alignItems: 'start' }}>
              <Input value={line.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Description" />
              <Input value={line.ordered} inputMode="decimal" onChange={(e) => setLine(i, { ordered: e.target.value })} placeholder="Ordered" />
              <Input value={line.received} inputMode="decimal" onChange={(e) => setLine(i, { received: e.target.value })} placeholder="Received" />
              <Choice
                value={line.itemId}
                onChange={(v) => setLine(i, { itemId: v })}
                searchable
                placeholder="Inventory item"
                options={[{ value: '', label: 'Not stocked (service / consumable)' }, ...warehouseItems.map((it) => ({ value: it._id, label: `${it.itemCode}: ${it.itemName}` }))]}
              />
              <button type="button" aria-label="Remove line" onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '10px 4px' }}>×</button>
            </div>
          ))}
          {errors.receivedItems && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.receivedItems}</span>}
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Lines linked to an inventory item of this warehouse are added to its stock when the receipt passes inspection; lines without one are not stocked.</span>
        </div>
        <Field label="Attach document (optional)">
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function InspectionModal({ receipt, onClose, onSaved }) {
  const [status, setStatus] = useState('passed');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [lines, setLines] = useState(() => (receipt.receivedItems || []).map((l) => ({ ...l, itemId: refId(l.itemId), receivedQty: String(l.receivedQty) })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const next = {};
    if (!notes.trim()) next.inspectionNotes = 'Inspection notes are required';
    if (!file) next.file = 'Attach the delivery document';
    const bad = lines.findIndex((l) => l.receivedQty === '' || Number.isNaN(Number(l.receivedQty)) || Number(l.receivedQty) < 0);
    if (bad >= 0) next.receivedItems = `Line ${bad + 1} needs a received quantity`;
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('status', status);
    form.append('inspectionNotes', notes.trim());
    form.append('receivedItems', JSON.stringify(lines.map((l) => ({ description: l.description, orderedQty: l.orderedQty, receivedQty: Number(l.receivedQty), ...(l.itemId ? { itemId: l.itemId } : {}) }))));
    form.append('file', file);
    try {
      await goodsReceiptService.inspectionStatus(receipt._id, form);
      onSaved(`Inspection ${status} recorded for ${receipt.grnNo}`);
    } catch (err) {
      setError(apiError(err, 'The inspection could not be recorded'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Update Inspection Status"
      subtitle={`${receipt.grnNo} • ${refName(receipt.poId, 'poNo')}`}
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton style={status === 'failed' ? { backgroundColor: '#DC2626' } : undefined} onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save Inspection'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Inspection status" required error={errors.status}>
          <Choice value={status} onChange={setStatus} options={INSPECTION_STATUSES.filter((s) => s.value !== 'pending')} />
        </Field>
        {status === 'failed' && <Note tone="red">{FAILED_INSPECTION_CONSEQUENCE}</Note>}
        {status === 'passed' && <Note tone="green">Accepted quantities are added to the stock of the inventory items linked to each line. A decision cannot be revised afterwards, so check the received quantities first.</Note>}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Description</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Ordered qty</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: 140 }}>Received qty</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px' }}>{line.description}{line.itemId ? '' : <span style={{ color: '#94A3B8' }}> (not stocked)</span>}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>{line.orderedQty}</td>
                  <td style={{ padding: '6px 14px' }}>
                    <Input value={line.receivedQty} inputMode="decimal" onChange={(e) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, receivedQty: e.target.value } : l)))} style={{ textAlign: 'center' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors.receivedItems && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.receivedItems}</span>}
        <Field label="Inspection notes" required error={errors.inspectionNotes}>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. All units intact, no visible damage" error={Boolean(errors.inspectionNotes)} />
        </Field>
        <Field label="Delivery document" required error={errors.file} help="PDF, DOCX, XLSX, DWG, PNG or JPG, up to 50MB.">
          {file ? <AttachField files={[file]} onChange={(f) => setFile(f[0] || null)} multiple={false} disabled={busy} /> : <DropZone onFiles={(f) => setFile(f[0])} multiple={false} disabled={busy} />}
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewReceiptModal({ id, refreshKey, canInspect, onInspect, onClose }) {
  const [tab, setTab] = useState('details');
  const { record, error, loading } = useRecord(goodsReceiptService, id, refreshKey);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="780px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading goods receipt…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader icon={<FiClipboard size={22} />} title={refName(record.vendorId, 'vendorName')} subtitle={`${record.grnNo} • ${refName(record.poId, 'poNo')}`}>
            {record.status === 'pending' && canInspect && <PrimaryButton onClick={() => onInspect(record)}>Update Inspection Status</PrimaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          {record.status === 'failed' && <Note tone="red">{FAILED_INSPECTION_CONSEQUENCE}</Note>}
          <TabBar tabs={[{ id: 'details', label: 'Receipt Details' }, { id: 'materials', label: 'Materials Received' }, { id: 'documents', label: 'Documents' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Delivery reference', (record.deliveryRefs || []).join(', ') || 'No delivery tracked'],
                  ['Purchase order no', refName(record.poId, 'poNo')],
                  ['Linked RFQ no', record.linkedRfqId ? refName(record.linkedRfqId, 'rfqId') : '—'],
                  ['Vendor', refName(record.vendorId, 'vendorName')],
                  ['Linked project', record.linkedProjectId ? refName(record.linkedProjectId, 'projectName') : 'None'],
                  ['Material', record.material],
                  ['Warehouse', refName(record.warehouseId, 'name')],
                  ['Receipt date', formatDate(record.receiptDate)],
                ]}
              />
              <Panel title="Inspection notes">{record.inspectionNotes || 'No inspection decision has been recorded yet.'}</Panel>
            </>
          )}
          {tab === 'materials' && (
            <SimpleTable
              rows={record.receivedItems || []}
              empty="No lines recorded."
              columns={[
                { key: 'description', label: 'Description', render: (l) => (
                  <span>{l.description}{l.itemId && typeof l.itemId === 'object' ? <span style={{ color: '#94A3B8' }}> ({l.itemId.itemCode})</span> : <span style={{ color: '#94A3B8' }}> (not stocked)</span>}</span>
                ) },
                { key: 'orderedQty', label: 'Ordered qty', align: 'center' },
                { key: 'receivedQty', label: 'Received qty', align: 'center', render: (l) => <strong style={{ color: '#16A34A' }}>{l.receivedQty}</strong> },
              ]}
            />
          )}
          {tab === 'documents' && <DocumentList key={record._id} api={goodsReceiptService} id={record._id} canUpload={false} title="Delivery documents and inspection evidence" />}
        </div>
      )}
    </Modal>
  );
}

export default function GoodsReceiptsTab({ list, selection, exporter, lookups, showToast, onChanged, refreshKey, onExport }) {
  const canCreate = usePermission('procurement.goodsreceipt.create');
  const canInspect = usePermission('procurement.goodsreceipt.update');
  const [logOpen, setLogOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [inspectFor, setInspectFor] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const columns = useMemo(() => [
    { key: 'grnNo', label: 'MRN NO', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'poId', label: 'PO NO', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'poNo')}</span> },
    { key: 'vendorId', label: 'VENDOR', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{refName(v, 'vendorName')}</span> },
    { key: 'material', label: 'MATERIAL', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'warehouseId', label: 'WAREHOUSE', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'receiptDate', label: 'RECEIPT DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'INSPECTION STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="icon-btn" title="View Goods Receipt Details" aria-label="View goods receipt" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
        </div>
      ),
    },
  ], []);

  const filterFields = [
    { key: 'status', label: 'Inspection status', options: INSPECTION_STATUSES },
    { key: 'warehouseId', label: 'Warehouse', options: toOptions((lookups.locations || []).filter((l) => ['warehouse', 'yard'].includes(l.type)), 'name') },
    { key: 'dateFrom', label: 'Received from', type: 'date' },
    { key: 'dateTo', label: 'Received to', type: 'date' },
  ];

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No goods receipts found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search GRN No, Vendor ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setLogOpen(true)}>Log Goods Receipt</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Goods Receipts" subtitle="Narrow the receipts." fields={filterFields} values={list.filters} onApply={list.applyFilters} />
      {logOpen && <LogReceiptModal lookups={lookups} onClose={() => setLogOpen(false)} onSaved={(message) => { setLogOpen(false); showToast(message, 'success'); onChanged(); }} />}
      {inspectFor && (
        <InspectionModal
          key={inspectFor._id}
          receipt={inspectFor}
          onClose={() => setInspectFor(null)}
          onSaved={(message) => { setInspectFor(null); showToast(message, 'success'); onChanged(); }}
        />
      )}
      {viewId && <ViewReceiptModal id={viewId} refreshKey={refreshKey} canInspect={canInspect} onInspect={setInspectFor} onClose={() => setViewId(null)} />}
    </>
  );
}
