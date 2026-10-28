import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiDownload, FiAlertTriangle, FiEdit, FiCheck, FiX, FiRefreshCw, FiAward } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { hseOffshoreSlice } from '../../store/hse/slices';
import { apiError } from '../../services/apiHelpers';
import { offshoreTravelService } from '../../services/hse.service';
import { countFilters, fieldErrorsOf, formatDate, statValue, statusLabel, ymd } from '../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField } from '../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from '../administration/shared/AdmUi';
import { FileList } from './shared/hseUi';
import { nameOf, idOf, openSignedDownload, toFileRows } from './shared/hseUtils';
import { useHseLookups } from './shared/useScreenLookups';

const DOCUMENT_TYPES = ['BOSIET', 'Offshore Safety Permit (OSP)', 'Offshore Safety Training Certificate'];
const STATUSES = [
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'valid', label: 'Valid' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'rejected', label: 'Rejected' },
];
const STATUS_TONE = { valid: 'green', expiring_soon: 'amber', expired: 'red', pending_verification: 'amber', rejected: 'red' };
const FORM_SECTIONS = ['employees', 'departments'];

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;

const EXPORT_COLUMNS = [
  { label: 'Employee', value: (r) => nameOf(r.employeeId) },
  { label: 'Department', value: (r) => nameOf(r.departmentId) },
  { label: 'Document Type', value: (r) => r.documentType },
  { label: 'Certificate No', value: (r) => r.certificateNo },
  { label: 'Issuing Body', value: (r) => r.issuingBody },
  { label: 'Issue Date', value: (r) => ymd(r.issueDate) },
  { label: 'Expiry Date', value: (r) => ymd(r.expiryDate) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function DocumentFormModal({ record, onClose, onSaved }) {
  const editing = Boolean(record);
  const { lookups, loading: lookupsLoading, error: lookupsError } = useHseLookups(FORM_SECTIONS);
  const [form, setForm] = useState(() => ({
    employeeId: record ? idOf(record.employeeId) : '',
    departmentId: record ? idOf(record.departmentId) : '',
    documentType: record?.documentType || '',
    certificateNo: record?.certificateNo || '',
    issuingBody: record?.issuingBody || '',
    issueDate: record ? ymd(record.issueDate) : '',
    expiryDate: record ? ymd(record.expiryDate) : '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const employees = lookups.employees || [];
  const pickEmployee = (id) => {
    const employee = employees.find((e) => e._id === id);
    setForm((f) => ({ ...f, employeeId: id, departmentId: employee?.departmentId && (lookups.departments || []).some((d) => d._id === employee.departmentId) ? employee.departmentId : f.departmentId }));
  };

  const save = async () => {
    setError('');
    const next = {};
    if (!form.employeeId) next.employeeId = 'Choose the employee';
    if (!form.departmentId) next.departmentId = 'Choose the department';
    if (!form.documentType) next.documentType = 'Choose the document type';
    if (!form.certificateNo.trim()) next.certificateNo = 'Enter the certificate number';
    if (!form.issuingBody.trim()) next.issuingBody = 'Enter the issuing body';
    if (!form.issueDate) next.issueDate = 'Choose the issue date';
    if (!form.expiryDate) next.expiryDate = 'Choose the expiry date';
    if (form.issueDate && form.expiryDate && form.issueDate > form.expiryDate) next.expiryDate = 'Expiry must be on or after the issue date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const fields = { ...form, certificateNo: form.certificateNo.trim(), issuingBody: form.issuingBody.trim() };
      if (editing) {
        await offshoreTravelService.update(record._id, fields, files[0]);
        onSaved('Travel document updated');
      } else {
        await offshoreTravelService.create(fields, files[0]);
        onSaved('Travel document submitted for verification');
      }
    } catch (err) {
      setError(apiError(err, 'The document could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Offshore Travel Document' : 'Add Offshore Travel Document'}
      subtitle="Upload and submit offshore travel document for HSE verification"
      width="660px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy || lookupsLoading}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Save Document'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <FormError message={lookupsError} />
        <TwoCol>
          <Field label="Employee" required error={errors.employeeId}>
            <Choice value={form.employeeId} onChange={pickEmployee} searchable placeholder={lookupsLoading ? 'Loading…' : 'Select employee'} options={employees.map((e) => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))} error={errors.employeeId} />
          </Field>
          <Field label="Department" required error={errors.departmentId}>
            <Choice value={form.departmentId} onChange={(v) => set('departmentId', v)} searchable placeholder="Select department" options={(lookups.departments || []).map((d) => ({ value: d._id, label: d.name }))} error={errors.departmentId} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Document type" required error={errors.documentType}>
            <Choice value={form.documentType} onChange={(v) => set('documentType', v)} placeholder="Select document type" options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} error={errors.documentType} />
          </Field>
          <Field label="Certificate no" required error={errors.certificateNo}>
            <Input value={form.certificateNo} onChange={(e) => set('certificateNo', e.target.value)} placeholder="e.g. OSP-2026-0842" error={Boolean(errors.certificateNo)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Issuing body" required error={errors.issuingBody}>
            <Input value={form.issuingBody} onChange={(e) => set('issuingBody', e.target.value)} placeholder="e.g. OPITO, NUPRC" error={Boolean(errors.issuingBody)} />
          </Field>
          <Field label="Issue date" required error={errors.issueDate}>
            <DatePicker value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} error={Boolean(errors.issueDate)} />
          </Field>
        </TwoCol>
        <div style={{ maxWidth: 320 }}>
          <Field label="Expiry date" required error={errors.expiryDate}>
            <DatePicker value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} error={Boolean(errors.expiryDate)} />
          </Field>
        </div>
        <Field label="Attach documents (optional)">
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function RenewModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({ certificateNo: record.certificateNo, issueDate: '', expiryDate: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.certificateNo.trim()) next.certificateNo = 'Enter the new certificate number';
    if (!form.issueDate) next.issueDate = 'Choose the issue date';
    if (!form.expiryDate) next.expiryDate = 'Choose the new expiry date';
    if (form.issueDate && form.expiryDate && form.issueDate > form.expiryDate) next.expiryDate = 'Expiry must be on or after the issue date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await offshoreTravelService.renew(record._id, { ...form, certificateNo: form.certificateNo.trim() }, files[0]);
      onSaved('Certificate renewed and sent for verification');
    } catch (err) {
      setError(apiError(err, 'The certificate could not be renewed'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Renew Certificate"
      subtitle="The renewed certificate goes back to HSE for verification"
      width="540px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy} icon={<FiRefreshCw size={14} />}>{busy ? 'Saving…' : 'Renew Certificate'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <RecordSummary rows={[['Employee', nameOf(record.employeeId)], ['Document', record.documentType], ['Current expiry', formatDate(record.expiryDate)]]} />
        <Field label="Certificate no" required error={errors.certificateNo}>
          <Input value={form.certificateNo} onChange={(e) => set('certificateNo', e.target.value)} error={Boolean(errors.certificateNo)} />
        </Field>
        <TwoCol>
          <Field label="Issue date" required error={errors.issueDate}>
            <DatePicker value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} error={Boolean(errors.issueDate)} />
          </Field>
          <Field label="Expiry date" required error={errors.expiryDate}>
            <DatePicker value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} error={Boolean(errors.expiryDate)} />
          </Field>
        </TwoCol>
        <Field label="Renewed certificate (optional)">
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewDocumentModal({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(offshoreTravelService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Drawer isOpen onClose={onClose} title="" width="660px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading document…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiAward size={22} />} title={record.documentType} subtitle={`${nameOf(record.employeeId)} • ${record.certificateNo}`} />
          <StatusLine status={<Status status={record.status} />}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{actions(record)}</div>
          </StatusLine>
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Employee', nameOf(record.employeeId)],
                  ['Document type', record.documentType],
                  ['Certificate number', record.certificateNo],
                  ['Department', nameOf(record.departmentId)],
                  ['Issuing body', record.issuingBody],
                  ['Issue date', formatDate(record.issueDate)],
                  ['Expiry date', formatDate(record.expiryDate)],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              {record.status === 'rejected' && <Panel title="Rejection reason" tone="red">{record.rejectionReason || 'No reason was recorded.'}</Panel>}
              {(record.status === 'expired') && (record.deployments || []).length > 0 && (
                <Panel title="Open deployments" tone="amber">
                  This employee must not be mobilised while the certificate is expired.{' '}
                  {record.deployments.map((d) => `${d.deploymentId} (${statusLabel(d.status)})`).join(', ')}
                </Panel>
              )}
              <FileList
                title="Certificate"
                files={toFileRows(record.files)}
                download={(file) => openSignedDownload(() => offshoreTravelService.downloadFile(record._id, file.id))}
                empty="No certificate file was attached."
              />
            </>
          )}
          {tab === 'history' && <HistoryTimeline key={`${record._id}-${refreshKey}`} load={offshoreTravelService.history} id={record._id} title="Document history" />}
        </div>
      )}
    </Drawer>
  );
}

export default function OffshoreTravelDocuments() {
  const { can } = usePermissions();
  const canCreate = can('hse.offshoretraveldocument.create');
  const canUpdate = can('hse.offshoretraveldocument.update');
  const canDecide = can('hse.offshoretraveldocument.decide');
  const canExport = can('hse.offshoretraveldocument.export');

  const list = useProcList(hseOffshoreSlice, { initialFilters: { status: '', documentType: '', dateFrom: '', dateTo: '' } });
  const run = useRunAction(hseOffshoreSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(offshoreTravelService, list, selection, EXPORT_COLUMNS, 'offshore-travel-documents.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [renewFor, setRenewFor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const expired = statValue(list.stats, 'expired');
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

  const open = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const downloadLatest = async (row) => {
    try {
      const detail = await offshoreTravelService.get(row._id);
      const file = (detail.data?.data?.files || [])[0];
      if (!file) { showToast('No certificate file was attached to this document', 'error'); return; }
      const problem = await openSignedDownload(() => offshoreTravelService.downloadFile(row._id, file.id));
      if (problem) showToast(problem, 'error');
    } catch (err) {
      showToast(apiError(err, 'Download failed'), 'error');
    }
  };

  const menuItems = (row) => {
    const items = [];
    if (row.status !== 'pending_verification') return items;
    if (canDecide) items.push({ label: 'Verify Document', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('verify', row) });
    if (canUpdate) items.push({ label: 'Edit Document', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (canDecide) items.push({ label: 'Reject Document', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => open('reject', row) });
    return items;
  };

  const rows = useMemo(() => ({ ...list, items: list.items.map((r, i) => ({ ...r, sn: (list.page - 1) * 10 + i + 1 })) }), [list]);

  const columns = [
    { key: 'sn', label: 'S/N', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'employeeId', label: 'EMPLOYEE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{nameOf(v)}</span> },
    { key: 'departmentId', label: 'DEPARTMENT', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'documentType', label: 'DOCUMENT TYPE', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'issuingBody', label: 'ISSUING BODY', render: (v) => <span style={{ color: '#3B82F6' }}>{v}</span> },
    { key: 'issueDate', label: 'ISSUE DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'expiryDate', label: 'EXPIRY', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        const hasFile = row.attachmentCount > 0 && row.status !== 'rejected';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Document" aria-label="View document" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {hasFile && <button type="button" className="icon-btn" title="Download certificate" aria-label="Download certificate" onClick={() => downloadLatest(row)} style={{ color: '#64748B', cursor: 'pointer' }}><FiDownload size={16} /></button>}
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
  ];

  const viewActions = (record) => (
    <>
      {canDecide && record.status === 'pending_verification' && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('verify', record)}>Verify</PrimaryButton>}
      {canDecide && record.status === 'pending_verification' && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => open('reject', record)}>Reject</SecondaryButton>}
      {canUpdate && record.status === 'pending_verification' && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
      {canUpdate && record.status !== 'pending_verification' && <PrimaryButton icon={<FiRefreshCw size={14} />} onClick={() => setRenewFor(record)}>Renew Certificate</PrimaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected documents exported` : 'Travel documents exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'documentType', label: 'Document type', options: DOCUMENT_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'dateFrom', label: 'Expires from', type: 'date' },
    { key: 'dateTo', label: 'Expires to', type: 'date' },
  ];

  const summary = (row) => <RecordSummary rows={[['Employee', nameOf(row.employeeId)], ['Document', `${row.documentType} (${row.certificateNo})`]]} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Off-Shore Travel Documents" subtitle="Manage and monitor personnel documents required for offshore travel and mobilisation" />

      {expired > 0 && (
        <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '4px solid #DC2626', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAlertTriangle size={16} color="#DC2626" />
            <span style={{ fontSize: '0.875rem', color: '#991B1B' }}>
              {expired} Off-Shore Travel certificate{expired === 1 ? ' has' : 's have'} expired. Affected staff must not be mobilised until certificates are renewed.
            </span>
          </div>
          <button type="button" onClick={() => list.applyFilters({ ...list.filters, status: 'expired' })} style={{ fontSize: '0.875rem', color: '#B91C1C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View Expired →
          </button>
        </div>
      )}

      <ListCard
        list={rows}
        columns={columns}
        emptyText="No travel documents found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Certificate No, Employee..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Add Travel Document</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Travel Documents" subtitle="Narrow the documents by status, type and expiry date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <DocumentFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {renewFor && (
        <RenewModal
          record={renewFor}
          onClose={() => setRenewFor(null)}
          onSaved={(message) => { setRenewFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewDocumentModal id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm?.type === 'verify' && (
        <ConfirmModal
          title="Verify Document?"
          message="Confirm that the certificate is genuine and in date. Its status will follow the expiry date."
          detail={summary(confirm.row)}
          confirmLabel="Verify Document"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('verify', [confirm.row._id], 'Document verified')}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Document?"
          message="Are you sure you want to reject this document? The document will be marked as rejected and the employee will be required to upload a valid replacement."
          detail={summary(confirm.row)}
          label="Reason"
          placeholder="Enter rejection reason..."
          confirmLabel="Reject Document"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('reject', [confirm.row._id, reason], 'Document rejected')}
        />
      )}
    </div>
  );
}
