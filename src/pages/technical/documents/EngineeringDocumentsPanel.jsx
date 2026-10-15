import { useMemo, useState } from 'react';
import { FiCheck, FiCheckCircle, FiClock, FiDownload, FiEye, FiFile, FiFileText, FiPlus, FiRefreshCw, FiSend, FiX } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { engineeringDocumentService } from '../../../services/technical.service';
import { engineeringDocumentsSlice } from '../../../store/technical/slices';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, ReasonModal, RecordSummary,
  SecondaryButton, StatTiles, StatusLine, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from '../shared/TechFiles';
import { DrawerTabs, RowActions, TechBadge, Trail } from '../shared/TechUi';
import { useFetched, useMyEmployee, useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import {
  DOCUMENT_CATEGORIES, blobErrorMessage, countFilters, downloadFile, fieldErrorsOf, formatDate, refId, refName, statValue, statusLabel, toOptions, ymd,
} from '../shared/techUtils';

const STATUS_OPTIONS = ['pending', 'under_review', 'checked', 'approved', 'returned', 'rejected', 'sent_to_client'].map((value) => ({ value, label: statusLabel(value) }));
const YES_NO = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
const MID_REVIEW = ['under_review', 'checked'];

const EXPORT_COLUMNS = [
  { label: 'Document ID', value: (r) => r.documentId },
  { label: 'Project', value: (r) => refName(r.projectId, 'projectName') },
  { label: 'Document Title', value: (r) => r.documentTitle },
  { label: 'Category', value: (r) => r.documentCategory },
  { label: 'Prepared By', value: (r) => refName(r.preparedBy, 'fullName') },
  { label: 'Client-Facing', value: (r) => (r.clientFacing ? 'Yes' : 'No') },
  { label: 'Version', value: (r) => r.version },
  { label: 'Last Updated', value: (r) => ymd(r.updatedAt) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function TemplateRow({ category, onError }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    const message = await downloadFile(() => engineeringDocumentService.template(category), `${category.replace(/\s+/g, '_')}_Template_v1.0.pdf`);
    setBusy(false);
    if (message) onError(message);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', background: '#F8FAFC' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#334155' }}><FiFile size={14} color="#64748B" />{category} template</span>
      <button type="button" onClick={download} disabled={busy} style={{ background: 'none', border: 'none', color: '#1D4ED8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <FiDownload size={14} /> {busy ? 'Preparing…' : 'Download Template'}
      </button>
    </div>
  );
}

/** Upload Engineering Document (new) or Replace Document (a new version of `record`). */
function DocumentFormModal({ record, fixedProjectId, onClose, onSaved }) {
  const replacing = Boolean(record);
  const me = useMyEmployee();
  const { lookups } = useTechLookups(['projects']);
  const [form, setForm] = useState(() => ({
    projectId: replacing ? refId(record.projectId) : fixedProjectId || '',
    title: record?.documentTitle || '',
    category: record?.documentCategory || 'Method Statement',
    clientFacing: record?.clientFacing ? 'true' : 'false',
    description: record?.description || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!replacing && !form.projectId) next.projectId = 'Choose the project';
    if (!form.title.trim()) next.documentTitle = 'Enter the document title';
    if (!files.length) next.file = replacing ? 'Choose the new version of the document' : 'Upload the completed document';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    const data = new FormData();
    if (!replacing) data.append('projectId', form.projectId);
    data.append('documentTitle', form.title.trim());
    data.append('documentCategory', form.category);
    data.append('clientFacing', form.clientFacing);
    if (form.description.trim()) data.append('description', form.description.trim());
    data.append('file', files[0]);
    try {
      if (replacing) await engineeringDocumentService.replace(record._id, data);
      else await engineeringDocumentService.create(data);
      onSaved(replacing ? 'New version uploaded' : 'Document uploaded for review');
    } catch (err) {
      setError(apiError(err, 'The document could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={replacing ? 'Replace Document' : 'Upload Engineering Document'}
      subtitle={replacing ? 'Upload a new version of this document' : 'Create or upload a project document'}
      maxWidth="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Uploading…' : replacing ? 'Replace Document' : 'Create & Submit for Review'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        {!fixedProjectId && (
          <Field label="Project" required error={errors.projectId}>
            <Choice
              value={form.projectId}
              onChange={(v) => set('projectId', v)}
              searchable
              disabled={replacing}
              placeholder="Select a project"
              options={[
                ...toOptions(lookups.projects, (p) => `${p.projectId}: ${p.projectName}`),
                ...(record && typeof record.projectId === 'object' && !(lookups.projects || []).some((p) => p._id === record.projectId._id)
                  ? [{ value: record.projectId._id, label: record.projectId.projectName }]
                  : []),
              ]}
              error={errors.projectId}
            />
          </Field>
        )}
        <Field label="Document title" required error={errors.documentTitle}>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Method Statement — Pipe Welding" error={Boolean(errors.documentTitle)} />
        </Field>
        <TwoCol>
          <Field label="Document ID"><Input value={replacing ? record.documentId : 'Assigned on save'} disabled /></Field>
          <Field label="Prepared by"><Input value={replacing ? refName(record.preparedBy, 'fullName') : me.name || '—'} disabled /></Field>
        </TwoCol>
        <Field label="Document category" required error={errors.documentCategory}>
          <Choice value={form.category} onChange={(v) => set('category', v)} options={DOCUMENT_CATEGORIES} />
        </Field>
        <TemplateRow category={form.category} onError={setError} />
        <Field label="Client-facing" required error={errors.clientFacing}>
          <div style={{ maxWidth: 200 }}><Choice value={form.clientFacing} onChange={(v) => set('clientFacing', v)} options={YES_NO} /></div>
        </Field>
        <Field label="Description (optional)" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add notes..." />
        </Field>
        <Field label="Upload completed document" required error={errors.file}>
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewDocumentDrawer({ id, refreshKey, showProject, actions, onClose }) {
  const { record, error, loading } = useRecord(engineeringDocumentService, id, refreshKey);
  const trail = useFetched(() => engineeringDocumentService.history(id), id, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title="" width="600px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading document…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiFileText size={22} />} title={record.documentTitle} subtitle={`${record.documentId} • ${refName(record.preparedBy, 'fullName')}`} />
          <StatusLine status={<TechBadge status={record.status} />}>
            <span style={{ flex: 1 }} />
            {actions(record)}
          </StatusLine>
          <DrawerTabs tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]}>
            {(tab) => (tab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Document name', record.documentTitle],
                    ['Document ID', record.documentId],
                    showProject && ['Project', refName(record.projectId, 'projectName')],
                    ['Document category', record.documentCategory],
                    ['Prepared by', refName(record.preparedBy, 'fullName')],
                    ['Client-facing', record.clientFacing ? 'Yes' : 'No'],
                    ['Version', record.version],
                    ['Last updated', formatDate(record.updatedAt)],
                  ]}
                />
                <Panel title="Description">{record.description || 'No description entered.'}</Panel>
                {record.rejectionReason && <Panel title={record.status === 'rejected' ? 'Rejection reason' : 'Returned for corrections'} tone="red">{record.rejectionReason}</Panel>}
                <FilesPanel key={record._id} api={engineeringDocumentService} id={record._id} />
              </div>
            ) : (
              <>
                {trail.error && <FormError message={trail.error} />}
                <Trail events={trail.data} empty={trail.loading ? 'Loading…' : 'No activity recorded.'} />
              </>
            ))}
          </DrawerTabs>
        </div>
      )}
    </Drawer>
  );
}

/**
 * Engineering documents for one project (`projectId`) or across all projects: tiles, search, filters, export, the
 * Reviewer -> Checker -> Approver chain, Replace Document, client hand-over and file download.
 */
export default function EngineeringDocumentsPanel({ projectId, showToast }) {
  const canCreate = usePermission('technical.engineeringdocument.create');
  const canUpdate = usePermission('technical.engineeringdocument.update');
  const canDecide = usePermission('technical.engineeringdocument.decide');
  const canCheck = usePermission('technical.engineeringdocument.decide-check');
  const canApprove = usePermission('technical.engineeringdocument.decide-approve');
  const me = useMyEmployee();
  const own = (row) => Boolean(me.id) && refId(row.preparedBy) === me.id;

  const fixed = useMemo(() => (projectId ? { projectId } : undefined), [projectId]);
  const list = useTechList(engineeringDocumentsSlice, { initialFilters: { status: '', category: '', clientFacing: '', dateFrom: '', dateTo: '' }, fixed });
  const run = useRunAction(engineeringDocumentsSlice);
  const selection = useSelection();
  const exporter = useTechExport(engineeringDocumentService.exportList, list, selection, EXPORT_COLUMNS, 'engineering-documents.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };
  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

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
    }
  };

  const downloadFileOf = async (row) => {
    try {
      const files = await engineeringDocumentService.attachments(row._id);
      const latest = (files.data?.data || [])[0];
      if (!latest) { showToast('This document has no file attached', 'error'); return; }
      const link = await engineeringDocumentService.downloadAttachment(row._id, latest._id);
      window.open(link.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'The file could not be downloaded'), 'error');
    }
  };

  const menuItems = (row) => {
    const items = [];
    const act = (label, icon, type, color) => items.push({ label, icon, ...(color ? { color } : {}), action: () => ask(type, row) });
    if (row.status === 'pending' && canDecide) {
      act('Approve & Move to Check', <FiCheck size={14} color="#16A34A" />, 'reviewApprove', '#16A34A');
      act('Return for Corrections', <FiX size={14} color="#DC2626" />, 'reviewReturn', '#DC2626');
    }
    if (row.status === 'under_review') {
      if (canCheck) act('Approve & Move to Approval', <FiCheck size={14} color="#16A34A" />, 'checkApprove', '#16A34A');
      if (canDecide) act('Send Back for Corrections', <FiX size={14} color="#DC2626" />, 'checkReturn', '#DC2626');
    }
    if (row.status === 'checked') {
      if (canApprove && !own(row)) act('Approve', <FiCheck size={14} color="#16A34A" />, 'approve', '#16A34A');
      if (canDecide) act('Reject', <FiX size={14} color="#DC2626" />, 'reject', '#DC2626');
    }
    if (row.status === 'approved' && row.clientFacing && canDecide) act('Mark as Sent to Client', <FiSend size={14} color="#16A34A" />, 'sent', '#16A34A');
    if (canUpdate && !MID_REVIEW.includes(row.status)) items.push({ label: 'Replace Document', icon: <FiRefreshCw size={14} color="#64748B" />, action: () => setFormFor(row) });
    items.push({ label: 'Download File', icon: <FiDownload size={14} color="#64748B" />, action: () => downloadFileOf(row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'documentId', label: 'DOCUMENT ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    ...(projectId ? [] : [{ key: 'projectId', label: 'PROJECT', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'projectName')}</span> }]),
    { key: 'documentTitle', label: 'DOCUMENT TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'documentCategory', label: 'CATEGORY', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'preparedBy', label: 'PREPARED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    ...(projectId ? [{ key: 'clientFacing', label: 'CLIENT-FACING', render: (v) => (v ? 'Yes' : 'No') }] : []),
    { key: 'version', label: 'VERSION' },
    { key: 'updatedAt', label: 'LAST UPDATED', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [projectId, canUpdate, canDecide, canCheck, canApprove, me.id]);

  const viewActions = (record) => (
    <>
      {record.status === 'pending' && canDecide && (
        <>
          <PrimaryButton icon={<FiCheck size={14} />} onClick={() => ask('reviewApprove', record)}>Approve & Move to Check</PrimaryButton>
          <SecondaryButton danger icon={<FiX size={14} />} onClick={() => ask('reviewReturn', record)}>Send Back</SecondaryButton>
        </>
      )}
      {record.status === 'under_review' && (
        <>
          {canCheck && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => ask('checkApprove', record)}>Approve & Move to Approval</PrimaryButton>}
          {canDecide && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => ask('checkReturn', record)}>Send Back</SecondaryButton>}
        </>
      )}
      {record.status === 'checked' && (
        <>
          {canApprove && !own(record) && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => ask('approve', record)}>Approve</PrimaryButton>}
          {canDecide && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => ask('reject', record)}>Reject</SecondaryButton>}
        </>
      )}
      {record.status === 'approved' && record.clientFacing && canDecide && <PrimaryButton icon={<FiSend size={14} />} onClick={() => ask('sent', record)}>Mark as Sent to Client</PrimaryButton>}
      {canUpdate && !MID_REVIEW.includes(record.status) && <SecondaryButton icon={<FiRefreshCw size={14} />} onClick={() => setFormFor(record)}>Replace</SecondaryButton>}
      <SecondaryButton icon={<FiEye size={14} />} onClick={() => downloadFileOf(record)}>Download File</SecondaryButton>
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected documents exported` : 'Documents exported'), message ? 'error' : 'success');
  };

  const tiles = [
    { label: 'Total Documents', value: statValue(list.stats, 'total_documents'), sub: projectId ? 'On this project' : 'Across all projects', icon: <FiFileText size={16} />, tone: 'blue' },
    { label: 'Approved Documents', value: statValue(list.stats, 'approved'), sub: 'Ready for use', icon: <FiCheckCircle size={16} />, tone: 'green' },
    { label: 'Under Review', value: statValue(list.stats, 'under_review'), sub: 'Awaiting review', icon: <FiClock size={16} />, tone: 'purple' },
    { label: 'Pending Documents', value: statValue(list.stats, 'pending_documents'), sub: 'Awaiting approval', icon: <FiFile size={16} />, tone: 'amber' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'category', label: 'Category', options: DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'clientFacing', label: 'Client-facing', options: YES_NO },
    { key: 'dateFrom', label: 'Updated from', type: 'date' },
    { key: 'dateTo', label: 'Updated to', type: 'date' },
  ];

  const summaryRows = (row) => [['Document', row.documentTitle], ['Document ID', row.documentId]];
  const confirmCopy = {
    reviewApprove: { title: 'Approve and Move to Check?', message: 'The document goes to the Checker.', label: 'Approve & Move to Check', method: 'reviewApprove', done: 'Approved and moved to Check' },
    checkApprove: { title: 'Approve and Move to Approval?', message: 'The document goes to the Approver.', label: 'Approve & Move to Approval', method: 'checkApprove', done: 'Approved and moved to Approval' },
    approve: { title: 'Approve Document?', message: 'You cannot approve a document you prepared yourself.', label: 'Approve', method: 'approve', done: 'Document approved' },
    sent: { title: 'Mark as Sent to Client?', message: 'Record that this approved, client-facing document has been sent to the client.', label: 'Mark as Sent', method: 'markSentToClient', done: 'Marked as sent to client' },
  };
  const reasonCopy = {
    reviewReturn: { title: 'Return for Corrections?', label: 'Corrections needed', button: 'Return for Corrections', method: 'reviewReturn', done: 'Returned for corrections' },
    checkReturn: { title: 'Send Back for Corrections?', label: 'Corrections needed', button: 'Send Back', method: 'checkReturn', done: 'Sent back for corrections' },
    reject: { title: 'Reject Document?', label: 'Reason for rejection', button: 'Reject Document', method: 'reject', done: 'Document rejected' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No documents found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by Doc title, Category..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>New Document</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Documents" subtitle="Narrow the documents by status, category and date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <DocumentFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          fixedProjectId={projectId}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewDocumentDrawer id={viewId} refreshKey={refreshKey} showProject={!projectId} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm && confirmCopy[confirm.type] && (
        <ConfirmModal
          title={confirmCopy[confirm.type].title}
          message={confirmCopy[confirm.type].message}
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          confirmLabel={confirmCopy[confirm.type].label}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction(confirmCopy[confirm.type].method, [confirm.row._id], confirmCopy[confirm.type].done)}
        />
      )}
      {confirm && reasonCopy[confirm.type] && (
        <ReasonModal
          title={reasonCopy[confirm.type].title}
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          label={reasonCopy[confirm.type].label}
          confirmLabel={reasonCopy[confirm.type].button}
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction(reasonCopy[confirm.type].method, [confirm.row._id, reason], reasonCopy[confirm.type].done)}
        />
      )}
    </div>
  );
}
