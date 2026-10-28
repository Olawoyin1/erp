import { useState } from 'react';
import { FiEye, FiEdit2, FiHome, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import { Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { qmsInspectionsSlice } from '../../store/quality/slices';
import { apiError } from '../../services/apiHelpers';
import { qualityInspectionService } from '../../services/quality.service';
import { countFilters, fieldErrorsOf, formatDate, statusLabel, ymd } from '../procurement/shared/procUtils';
import { useExport, useFetched, useProcList, useRecord, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, Panel,
  PrimaryButton, RecordSummary, SecondaryButton, SimpleTable, Skeleton, StatusLine, TabBar, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField } from '../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from '../administration/shared/AdmUi';
import { FileList } from '../hse/shared/hseUi';
import { idOf, nameOf, openSignedDownload, toAttachmentRows } from '../hse/shared/hseUtils';

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
];
const STATUS_TONE = { passed: 'green', pending: 'amber', failed: 'red' };

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
const unitOf = (line) => (line.itemId && typeof line.itemId === 'object' ? line.itemId.unit || '—' : '—');

const EXPORT_COLUMNS = [
  { label: 'MRN No', value: (r) => r.grnNo },
  { label: 'PO No', value: (r) => nameOf(r.poId, 'poNo') },
  { label: 'Vendor', value: (r) => nameOf(r.vendorId, 'vendorName') },
  { label: 'Material', value: (r) => r.material },
  { label: 'Warehouse', value: (r) => nameOf(r.warehouseId) },
  { label: 'Receipt Date', value: (r) => ymd(r.receiptDate) },
  { label: 'Inspection Status', value: (r) => statusLabel(r.status) },
];

function UpdateInspectionModal({ receipt, onClose, onSaved }) {
  const { record, error: loadError, loading } = useRecord(qualityInspectionService, receipt._id);
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [received, setReceived] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const lines = record?.receivedItems || [];
  const qtyOf = (line, index) => (received[index] !== undefined ? received[index] : String(line.receivedQty));

  const save = async () => {
    setError('');
    const next = {};
    lines.forEach((line, index) => {
      const value = Number(qtyOf(line, index));
      if (!Number.isFinite(value) || value < 0) next[`receivedItems.${index}`] = 'Enter a quantity of zero or more';
    });
    if (!notes.trim()) next.inspectionNotes = 'Enter the inspection details';
    if (!files.length) next.file = 'Attach the delivery document';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = lines.map((line, index) => ({
        description: line.description,
        orderedQty: line.orderedQty,
        receivedQty: Number(qtyOf(line, index)),
        ...(idOf(line.itemId) ? { itemId: idOf(line.itemId) } : {}),
      }));
      await qualityInspectionService.inspectionStatus(receipt._id, {
        status,
        inspectionNotes: notes.trim(),
        receivedItems: payload.length ? JSON.stringify(payload) : '',
      }, files[0]);
      onSaved(`Inspection recorded for ${receipt.grnNo}`);
    } catch (err) {
      setError(apiError(err, 'The inspection could not be recorded'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Update Inspection Status"
      subtitle={`Current status: ${statusLabel(receipt.status)}`}
      width="660px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy || loading}>{busy ? 'Saving…' : 'Update Status'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <RecordSummary rows={[['Receipt', receipt.grnNo], ['Purchase order', nameOf(receipt.poId, 'poNo')], ['Vendor', nameOf(receipt.vendorId, 'vendorName')]]} />
        {loading && <Skeleton height={80} />}
        <FormError message={loadError} />
        {lines.length > 0 && (
          <SimpleTable
            columns={[
              { key: 'description', label: 'Description' },
              { key: 'orderedQty', label: 'Ordered Qty' },
              {
                key: 'received',
                label: 'Received Qty',
                render: (line) => {
                  const index = lines.indexOf(line);
                  return (
                    <Input
                      type="number"
                      min="0"
                      value={qtyOf(line, index)}
                      onChange={(e) => setReceived((r) => ({ ...r, [index]: e.target.value }))}
                      error={Boolean(errors[`receivedItems.${index}`])}
                      title={errors[`receivedItems.${index}`]}
                      style={{ width: 100 }}
                    />
                  );
                },
              },
              { key: 'unit', label: 'Unit', render: (line) => unitOf(line) },
            ]}
            rows={lines.map((l, i) => ({ ...l, key: i }))}
          />
        )}
        {Object.keys(errors).some((k) => k.startsWith('receivedItems.')) && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>Check the received quantities: each must be zero or more.</span>}
        <Field label="Inspection status" required error={errors.status}>
          <Choice value={status} onChange={setStatus} options={STATUSES} />
        </Field>
        {status === 'passed' && <span style={{ fontSize: '0.78rem', color: '#166534' }}>Passing the inspection books the received quantities into inventory.</span>}
        {status === 'failed' && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>A failed inspection puts the order's invoices on payment hold, flags the vendor and raises a follow-up task.</span>}
        <Field label="Inspection notes" required error={errors.inspectionNotes}>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter inspection details..." error={Boolean(errors.inspectionNotes)} />
        </Field>
        <Field label="Attach delivery document" required error={errors.file}>
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function DocumentsTab({ id, refreshKey }) {
  const { data, error, loading } = useFetched(() => qualityInspectionService.attachments(id), id, refreshKey);
  if (loading) return <Skeleton height={80} />;
  if (error) return <FormError message={error} />;
  return (
    <FileList
      files={toAttachmentRows(data)}
      download={(file) => openSignedDownload(() => qualityInspectionService.downloadAttachment(id, file.id))}
      empty="No delivery documents have been attached yet."
    />
  );
}

function ViewReceiptModal({ id, refreshKey, canUpdate, onUpdate, onClose }) {
  const { record, error, loading } = useRecord(qualityInspectionService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Drawer isOpen onClose={onClose} title="" width="660px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading goods receipt…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiHome size={22} />} title={nameOf(record.vendorId, 'vendorName')} subtitle={`${record.grnNo} • ${nameOf(record.poId, 'poNo')}`} />
          <StatusLine status={<Status status={record.status} />}>
            {canUpdate && record.status === 'pending' && (
              <div style={{ marginLeft: 'auto' }}>
                <PrimaryButton icon={<FiEdit2 size={14} />} onClick={() => onUpdate(record)}>Update Inspection Status</PrimaryButton>
              </div>
            )}
          </StatusLine>
          <TabBar
            tabs={[{ id: 'details', label: 'Receipt Details' }, { id: 'materials', label: 'Materials Received' }, { id: 'documents', label: 'Documents' }, { id: 'history', label: 'History' }]}
            active={tab}
            onChange={setTab}
          />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Delivery reference', (record.deliveryRefs || []).join(', ') || '—'],
                  ['Purchase order no', nameOf(record.poId, 'poNo')],
                  ['Linked RFQ no', nameOf(record.linkedRfqId, 'rfqId')],
                  ['Vendor', nameOf(record.vendorId, 'vendorName')],
                  ['Linked project', nameOf(record.linkedProjectId, 'projectName')],
                  ['Material', record.material],
                  ['Quantity', record.quantity],
                  ['Warehouse', nameOf(record.warehouseId)],
                  ['Receipt date', formatDate(record.receiptDate)],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              <Panel title="Inspection notes">{record.inspectionNotes || 'No inspection notes have been recorded yet.'}</Panel>
            </>
          )}
          {tab === 'materials' && (
            <SimpleTable
              columns={[
                { key: 'description', label: 'Description' },
                { key: 'orderedQty', label: 'Ordered Qty' },
                { key: 'receivedQty', label: 'Received Qty', render: (line) => <span style={{ color: line.receivedQty < line.orderedQty ? '#DC2626' : '#2563EB' }}>{line.receivedQty}</span> },
                { key: 'unit', label: 'Unit', render: (line) => unitOf(line) },
              ]}
              rows={(record.receivedItems || []).map((l, i) => ({ ...l, key: i }))}
              empty="No materials were recorded on this receipt."
            />
          )}
          {tab === 'documents' && <DocumentsTab key={`${record._id}-${refreshKey}`} id={record._id} refreshKey={refreshKey} />}
          {tab === 'history' && <HistoryTimeline key={`${record._id}-${refreshKey}`} load={qualityInspectionService.history} id={record._id} title="Receipt history" />}
        </div>
      )}
    </Drawer>
  );
}

function SortLabel({ label, order, active, onToggle }) {
  return (
    <button type="button" onClick={onToggle} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label}
      {active && order === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} style={{ opacity: active ? 1 : 0.45 }} />}
    </button>
  );
}

export default function MaterialsInspection() {
  const { can } = usePermissions();
  const canUpdate = can('quality.goodsreceipt.update');
  const canExport = can('quality.goodsreceipt.export');

  const list = useProcList(qmsInspectionsSlice, { initialFilters: { status: '', dateFrom: '', dateTo: '', sort: '', order: '' }, withStats: false });
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(qualityInspectionService, list, selection, EXPORT_COLUMNS, 'materials-inspection.csv');

  const [viewId, setViewId] = useState(null);
  const [updateFor, setUpdateFor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };
  const toggleSort = () => list.applyFilters({ ...list.filters, sort: 'receiptDate', order: list.filters.sort === 'receiptDate' && list.filters.order === 'asc' ? 'desc' : 'asc' });

  const columns = [
    { key: 'grnNo', label: 'MRN NO', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'poId', label: 'PO NO', render: (v) => <span style={{ color: '#64748B' }}>{nameOf(v, 'poNo')}</span> },
    { key: 'vendorId', label: 'VENDOR', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{nameOf(v, 'vendorName')}</span> },
    { key: 'material', label: 'MATERIAL', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'warehouseId', label: 'WAREHOUSE', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'receiptDate', label: <SortLabel label="RECEIPT DATE" order={list.filters.order} active={list.filters.sort === 'receiptDate'} onToggle={toggleSort} />, render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'INSPECTION STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="icon-btn" title="View Goods Receipt" aria-label="View goods receipt" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
          {canUpdate && row.status === 'pending' ? (
            <button type="button" className="icon-btn" title="Update Inspection Status" aria-label="Update inspection status" onClick={() => setUpdateFor(row)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEdit2 size={15} /></button>
          ) : <span style={{ width: 24 }} />}
        </div>
      ),
    },
  ];

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected receipts exported` : 'Goods receipts exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Inspection status', options: STATUSES },
    { key: 'dateFrom', label: 'Received from', type: 'date' },
    { key: 'dateTo', label: 'Received to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Materials Inspection" subtitle="Inspect received materials and verify their quantity and quality before acceptance" />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No goods receipts found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search MRN No, Vendor..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters({ ...list.filters, sort: '', order: '' })}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          />
        )}
      />

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Goods Receipts"
        subtitle="Narrow the receipts by inspection status and receipt date."
        fields={filterFields}
        values={list.filters}
        onApply={(next) => list.applyFilters({ ...next, sort: list.filters.sort, order: list.filters.order })}
      />

      {viewId && <ViewReceiptModal id={viewId} refreshKey={refreshKey} canUpdate={canUpdate} onUpdate={(record) => setUpdateFor(record)} onClose={() => setViewId(null)} />}
      {updateFor && (
        <UpdateInspectionModal
          key={updateFor._id}
          receipt={updateFor}
          onClose={() => setUpdateFor(null)}
          onSaved={(message) => { setUpdateFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
    </div>
  );
}
