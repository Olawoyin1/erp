import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiCheck, FiTrash2, FiCheckCircle, FiFileText, FiPercent } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { admDisposalsSlice } from '../../store/administration/slices';
import { apiError } from '../../services/apiHelpers';
import { disposalService } from '../../services/admin.service';
import {
  countFilters, fieldErrorsOf, formatDate, refId, refName, statusLabel, toOptions, today, uploadStagedFiles, ymd,
} from '../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, Panel,
  PrimaryButton, RecordSummary, SecondaryButton, StatTiles, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField, DocumentList } from '../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from './shared/AdmUi';
import { useAdminLookups } from './shared/admHooks';

const TYPES = ['IT Equipment', 'Paper & Cardboard', 'General Waste', 'Furniture', 'Electronic Waste', 'Organic Waste', 'Other'];
const UNITS = ['KG', 'Tons', 'Units', 'Litres', 'Bags', 'Pieces'];
const METHODS = ['Vendor Collection', 'Recycling', 'Landfill', 'Incineration', 'Donation', 'Return to Supplier'];
const STATUSES = [{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }];
const STATUS_TONE = { pending: 'amber', completed: 'green' };

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
const quantity = (r) => `${r.quantity} ${String(r.unit || '').toLowerCase()}`;

const EXPORT_COLUMNS = [
  { label: 'Disposal ID', value: (r) => r.disposalId },
  { label: 'Description', value: (r) => r.wasteDescription },
  { label: 'Type', value: (r) => r.type },
  { label: 'Quantity', value: (r) => r.quantity },
  { label: 'Unit', value: (r) => r.unit },
  { label: 'Method', value: (r) => r.disposalMethod },
  { label: 'Date', value: (r) => ymd(r.date) },
  { label: 'Disposed By', value: (r) => refName(r.disposedBy, 'fullName') },
  { label: 'Vendor / Contractor', value: (r) => r.vendorOrContractor || '' },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function DisposalFormModal({ record, lookups, me, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => ({
    wasteDescription: record?.wasteDescription || '',
    type: record?.type || 'IT Equipment',
    quantity: record ? String(record.quantity) : '',
    unit: record?.unit || 'KG',
    disposalMethod: record?.disposalMethod || 'Vendor Collection',
    date: record ? ymd(record.date) : today(),
    vendorOrContractor: record?.vendorOrContractor || '',
    disposedBy: record ? refId(record.disposedBy) : me?.employeeId || '',
    notes: record?.notes || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.wasteDescription.trim()) next.wasteDescription = 'Describe the waste';
    if (!(Number(form.quantity) > 0)) next.quantity = 'Enter a quantity above zero';
    if (!form.date) next.date = 'Choose the disposal date';
    if (!form.vendorOrContractor.trim()) next.vendorOrContractor = 'Enter the vendor or contractor';
    if (!form.disposedBy) next.disposedBy = 'Choose who disposed of it';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = {
        wasteDescription: form.wasteDescription.trim(),
        type: form.type,
        quantity: Number(form.quantity),
        unit: form.unit,
        disposalMethod: form.disposalMethod,
        date: form.date,
        vendorOrContractor: form.vendorOrContractor.trim(),
        disposedBy: form.disposedBy,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };
      let saved;
      if (editing) saved = (await disposalService.update(record._id, payload)).data?.data;
      else saved = (await disposalService.create(payload)).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(disposalService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Disposal log updated' : `Disposal ${saved?.disposalId || ''} logged`}.${note}`.replace('  ', ' '));
    } catch (err) {
      setError(apiError(err, 'The disposal could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Log' : 'Log Disposal'}
      subtitle={editing ? undefined : 'Record a waste disposal activity for tracking and compliance'}
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Log Disposal'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Waste description" required error={errors.wasteDescription}>
          <Input value={form.wasteDescription} onChange={(e) => set('wasteDescription', e.target.value)} placeholder="e.g. Old laptops — end of life (x4)" error={Boolean(errors.wasteDescription)} />
        </Field>
        <TwoCol>
          <Field label="Disposal ID" help={editing ? undefined : 'Assigned automatically.'}>
            <Input value={editing ? record.disposalId : 'Assigned on save'} disabled />
          </Field>
          <Field label="Type" required error={errors.type}>
            <Choice value={form.type} onChange={(v) => set('type', v)} options={TYPES} />
          </Field>
        </TwoCol>
        <TwoCol min={150}>
          <Field label="Quantity" required error={errors.quantity}>
            <Input type="number" min="0" step="any" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} error={Boolean(errors.quantity)} />
          </Field>
          <Field label="Unit" required error={errors.unit}>
            <Choice value={form.unit} onChange={(v) => set('unit', v)} options={UNITS} />
          </Field>
          <Field label="Disposal method" required error={errors.disposalMethod}>
            <Choice value={form.disposalMethod} onChange={(v) => set('disposalMethod', v)} options={METHODS} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Date" required error={errors.date}>
            <DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} error={Boolean(errors.date)} />
          </Field>
          <Field label="Vendor/contractor" required error={errors.vendorOrContractor}>
            <Input value={form.vendorOrContractor} onChange={(e) => set('vendorOrContractor', e.target.value)} placeholder="e.g. GreenIT Recyclers Ltd" error={Boolean(errors.vendorOrContractor)} />
          </Field>
        </TwoCol>
        <div style={{ maxWidth: 340 }}>
          <Field label="Disposed by" required error={errors.disposedBy}>
            <Choice value={form.disposedBy} onChange={(v) => set('disposedBy', v)} searchable placeholder="Select an employee" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.disposedBy} />
          </Field>
        </div>
        <Field label="Notes" error={errors.notes}>
          <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Add notes…" />
        </Field>
        {editing ? (
          <DocumentList key={record._id} api={disposalService} id={record._id} canUpload title="Attached documents" />
        ) : (
          <Field label="Attach documents (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewDisposalModal({ id, refreshKey, actions, canUpload, onClose }) {
  const { record, error, loading } = useRecord(disposalService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="720px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading disposal…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiTrash2 size={22} color="#DC2626" />} title={record.wasteDescription} subtitle={`${record.type} • ${record.disposalId}`}>{actions(record)}</ViewHeader>
          <StatusLine status={<Status status={record.status} />} />
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'custody', label: 'Chain of Custody' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Waste description', record.wasteDescription],
                  ['Disposal ID', record.disposalId],
                  ['Type', record.type],
                  ['Quantity', `${record.quantity} ${record.unit}`],
                  ['Disposal method', record.disposalMethod],
                  ['Date', formatDate(record.date)],
                  ['Vendor/contractor', record.vendorOrContractor],
                  ['Disposed by', refName(record.disposedBy, 'fullName')],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              <Panel title="Notes">{record.notes || 'No notes were entered.'}</Panel>
              <DocumentList key={record._id} api={disposalService} id={record._id} canUpload={canUpload(record)} />
            </>
          )}
          {tab === 'custody' && (
            <HistoryTimeline
              key={`${record._id}-${refreshKey}`}
              load={disposalService.chainOfCustody}
              id={record._id}
              title="Chain of custody"
              footer={<div style={{ marginTop: 16, background: '#FEF2F2', borderLeft: '3px solid #DC2626', padding: '10px 12px', fontSize: '0.8rem', color: '#7F1D1D' }}>This register covers office, IT, and general waste. Hazardous and site waste is managed in the HSE module.</div>}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

export default function WasteDisposal() {
  const { can } = usePermissions();
  const canCreate = can('administration.disposal.create');
  const canUpdate = can('administration.disposal.update');
  const canExport = can('administration.disposal.export');
  const { lookups } = useAdminLookups(['me', 'employees']);

  const list = useProcList(admDisposalsSlice, { initialFilters: { status: '', type: '', method: '', dateFrom: '', dateTo: '' } });
  const run = useRunAction(admDisposalsSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(disposalService, list, selection, EXPORT_COLUMNS, 'disposals.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const complete = async (row) => {
    setBusy(true);
    setActionError('');
    const res = await run('complete', row._id);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      showToast('Disposal marked as completed', 'success');
      refresh();
    } else {
      setActionError(res.error);
    }
  };

  const open = (row) => { setActionError(''); setConfirm(row); };

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'pending' && canUpdate) {
      items.push({ label: 'Edit Log', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
      items.push({ label: 'Mark as Completed', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open(row) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'disposalId', label: 'DISPOSAL ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'wasteDescription', label: 'DESCRIPTION', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'type', label: 'TYPE', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'quantity', label: 'QTY', render: (_, row) => <span style={{ color: '#334155' }}>{quantity(row)}</span> },
    { key: 'disposalMethod', label: 'METHOD', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'date', label: 'DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'disposedBy', label: 'DISPOSED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'vendorOrContractor', label: 'VENDOR', render: (v) => <span style={{ color: '#2563EB' }}>{v || '—'}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Disposal" aria-label="View disposal" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate]);

  const viewActions = (record) => (
    <>
      {record.status === 'pending' && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit Log</SecondaryButton>}
      {record.status === 'pending' && canUpdate && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open(record)}>Mark as Completed</PrimaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected records exported` : 'Disposals exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'type', label: 'Type', options: TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'method', label: 'Disposal method', options: METHODS.map((m) => ({ value: m, label: m })) },
    { key: 'dateFrom', label: 'Date from', type: 'date' },
    { key: 'dateTo', label: 'Date to', type: 'date' },
  ];

  const stat = (key) => (list.stats || []).find((s) => s.key === key);
  const tile = (key, label, icon, tone, fallbackCaption) => {
    const s = stat(key);
    return {
      label,
      value: s ? `${s.value}${s.unit === '%' ? '%' : ` ${s.unit || ''}`}`.trim() : '0',
      sub: s?.caption || fallbackCaption,
      subColor: s?.caption && s.caption.startsWith('+') ? '#16A34A' : undefined,
      icon,
      tone,
    };
  };
  const tiles = [
    tile('total_waste_generated', 'TOTAL WASTE GENERATED', <FiTrash2 size={17} />, 'green', ''),
    tile('waste_disposed', 'WASTE DISPOSED', <FiCheckCircle size={17} />, 'amber', ''),
    tile('awaiting_manifest_certs', 'AWAITING MANIFEST CERTS', <FiFileText size={17} />, 'red', ''),
    tile('compliance_rate', 'COMPLIANCE RATE', <FiPercent size={17} />, 'blue', ''),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Waste & Disposal" subtitle="Track office, IT and general waste disposal records and their compliance" />

      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No disposal records found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search disposals..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Log Disposal</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Disposals" subtitle="Narrow the records by status, type, method and date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <DisposalFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          me={lookups.me}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewDisposalModal id={viewId} refreshKey={refreshKey} actions={viewActions} canUpload={(r) => (canCreate || canUpdate) && r.status === 'pending'} onClose={() => setViewId(null)} />}

      {confirm && (
        <ConfirmModal
          title="Mark as Completed?"
          message="Confirm that this waste has been disposed of. A completed record can no longer be edited."
          detail={<RecordSummary rows={[['Disposal', confirm.disposalId], ['Description', confirm.wasteDescription]]} />}
          confirmLabel="Mark as Completed"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => complete(confirm)}
        />
      )}
    </div>
  );
}
