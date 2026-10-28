import { useMemo, useState } from 'react';
import { FiBox, FiCheck, FiCheckCircle, FiClock, FiEdit2, FiList, FiPlus, FiRotateCcw, FiTruck, FiX } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { resourceRequestService } from '../../../services/technical.service';
import { resourceRequestsSlice } from '../../../store/technical/slices';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, ReasonModal, RecordSummary,
  SecondaryButton, StatTiles, StatusLine, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from '../shared/TechFiles';
import { DrawerTabs, RowActions, TechBadge, Trail } from '../shared/TechUi';
import { useFetched, useMyEmployee, useProjectActivities, useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import {
  RESOURCE_CATEGORIES, RESOURCE_UNITS, countFilters, fieldErrorsOf, formatDate, refId, refName, statValue, statusLabel, today, toOptions, uploadStagedFiles, ymd,
} from '../shared/techUtils';

const STATUS_OPTIONS = [
  'technical_reviewing', 'store_reviewing', 'issued', 'returned', 'unavailable', 'cancelled', 'rejected_by_technical',
].map((value) => ({ value, label: statusLabel(value) }));

const EXPORT_COLUMNS = [
  { label: 'Request ID', value: (r) => r.requestId },
  { label: 'Request', value: (r) => r.request },
  { label: 'Category', value: (r) => r.requestCategory },
  { label: 'Project', value: (r) => refName(r.projectId, 'projectName') },
  { label: 'Quantity', value: (r) => `${r.quantity} ${r.unit}` },
  { label: 'Requested By', value: (r) => refName(r.requestedBy, 'fullName') },
  { label: 'Request Date', value: (r) => ymd(r.requestDate) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

const activityText = (a) => (a && typeof a === 'object' ? `${a.activityName}${a.wbsCode ? ` (WBS ${a.wbsCode})` : ''}` : '—');

function RequestFormModal({ record, fixedProjectId, onClose, onSaved }) {
  const editing = Boolean(record);
  const me = useMyEmployee();
  const { lookups } = useTechLookups(['projects']);
  const [form, setForm] = useState(() => ({
    projectId: record ? refId(record.projectId) : fixedProjectId || '',
    request: record?.request || '',
    category: record?.requestCategory || 'Equipment',
    quantity: record ? String(record.quantity) : '',
    unit: record?.unit || 'Units',
    activityId: record ? refId(record.linkedWbsActivityId) : '',
    requiredDate: ymd(record?.requiredDate),
    purpose: record?.purpose || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const activities = useProjectActivities(form.projectId);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const projectLocked = editing || Boolean(fixedProjectId);

  const validate = () => {
    const next = {};
    if (!form.projectId) next.projectId = 'Choose the project';
    if (!form.request.trim()) next.request = 'Describe what you are requesting';
    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty < 1) next.quantity = 'Enter a whole quantity of at least 1';
    if (!form.activityId) next.linkedWbsActivityId = 'Choose the linked activity';
    if (!form.requiredDate) next.requiredDate = 'Choose the required date';
    if (!form.purpose.trim()) next.purpose = 'State the purpose of the request';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    const body = {
      request: form.request.trim(),
      requestCategory: form.category,
      quantity: Number(form.quantity),
      unit: form.unit,
      linkedWbsActivityId: form.activityId,
      requiredDate: form.requiredDate,
      purpose: form.purpose.trim(),
    };
    try {
      let saved;
      if (editing) saved = (await resourceRequestService.update(record._id, body)).data?.data;
      else saved = (await resourceRequestService.create(form.projectId, body)).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(resourceRequestService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Request updated' : 'Resource request submitted'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The request could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Request' : 'Request Resource'}
      subtitle={editing ? undefined : 'Request equipment, tools or materials from the store for this project'}
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Submit Request'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        {!fixedProjectId && (
          <Field label="Project" required error={errors.projectId}>
            <Choice
              value={form.projectId}
              onChange={(v) => setForm((f) => ({ ...f, projectId: v, activityId: '' }))}
              searchable
              disabled={projectLocked}
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
        <Field label="Request" required error={errors.request}>
          <Input value={form.request} onChange={(e) => set('request', e.target.value)} placeholder="e.g. Crane CR-05" error={Boolean(errors.request)} />
        </Field>
        <TwoCol min={160}>
          <Field label="Request category" required error={errors.requestCategory}>
            <Choice value={form.category} onChange={(v) => set('category', v)} options={RESOURCE_CATEGORIES} />
          </Field>
          <Field label="Quantity" required error={errors.quantity}>
            <Input value={form.quantity} inputMode="numeric" onChange={(e) => set('quantity', e.target.value.replace(/\D/g, ''))} placeholder="0" error={Boolean(errors.quantity)} />
          </Field>
          <Field label="Unit" required error={errors.unit}>
            <Choice value={form.unit} onChange={(v) => set('unit', v)} options={RESOURCE_UNITS} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Linked WBS activity" required error={errors.linkedWbsActivityId}>
            <Choice
              value={form.activityId}
              onChange={(v) => set('activityId', v)}
              searchable
              disabled={!form.projectId}
              placeholder={form.projectId ? (activities.loading ? 'Loading…' : 'Select an activity') : 'Choose a project first'}
              options={activities.options}
              error={errors.linkedWbsActivityId || activities.error}
            />
          </Field>
          <Field label="Requested by" help="Taken from your account.">
            <Input value={editing ? refName(record.requestedBy, 'fullName') : me.name || '—'} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Request date"><Input value={editing ? formatDate(record.requestDate) : formatDate(today())} disabled /></Field>
          <Field label="Required date" required error={errors.requiredDate}>
            <DatePicker value={form.requiredDate} onChange={(e) => set('requiredDate', e.target.value)} error={Boolean(errors.requiredDate)} />
          </Field>
        </TwoCol>
        <Field label="Purpose" required error={errors.purpose}>
          <Textarea rows={3} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="What is it needed for?" error={Boolean(errors.purpose)} />
        </Field>
        {editing ? (
          <FilesPanel key={record._id} api={resourceRequestService} id={record._id} canUpload canRemove />
        ) : (
          <Field label="Attach document (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewRequestDrawer({ id, refreshKey, showProject, actions, canUpdate, onClose }) {
  const { record, error, loading } = useRecord(resourceRequestService, id, refreshKey);
  const trail = useFetched(() => resourceRequestService.history(id), id, refreshKey);
  const editable = record && ['technical_reviewing', 'store_reviewing'].includes(record.status);
  return (
    <Drawer isOpen onClose={onClose} title="" width="600px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading request…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiBox size={22} />} title={record.request} subtitle={`${refName(record.requestedBy, 'fullName')} • ${record.requestId}`} />
          <StatusLine status={<TechBadge status={record.status} />}>
            <span style={{ flex: 1 }} />
            {actions(record)}
          </StatusLine>
          <DrawerTabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'log', label: 'Approval Log' }]}>
            {(tab) => (tab === 'overview' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Request', record.request],
                    ['Request ID', record.requestId],
                    showProject && ['Project', refName(record.projectId, 'projectName')],
                    ['Category', record.requestCategory],
                    ['Quantity', `${record.quantity} ${record.unit}`],
                    ['Linked WBS activity', activityText(record.linkedWbsActivityId)],
                    ['Requested by', refName(record.requestedBy, 'fullName')],
                    ['Request date', formatDate(record.requestDate)],
                    ['Required date', formatDate(record.requiredDate)],
                    ['Status', statusLabel(record.status)],
                  ]}
                />
                <Panel title="Purpose">{record.purpose || 'No purpose entered.'}</Panel>
                {record.decisionReason && <Panel title="Reason" tone="red">{record.decisionReason}</Panel>}
                <FilesPanel key={record._id} api={resourceRequestService} id={record._id} canUpload={canUpdate && editable} canRemove={canUpdate && editable} />
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
 * Resource requests for one project (`projectId`) or across all projects: stat tiles, search, filters, export, the
 * request form, the approval actions of the Technical -> Store chain, and the request drawer with its approval log.
 */
export default function ResourceRequestsPanel({ projectId, showToast }) {
  const canCreate = usePermission('technical.resourcerequest.create');
  const canUpdate = usePermission('technical.resourcerequest.update');
  const canDecide = usePermission('technical.resourcerequest.decide');
  const canDecideStore = usePermission('technical.resourcerequest.decide-store');

  const fixed = useMemo(() => (projectId ? { projectId } : undefined), [projectId]);
  const list = useTechList(resourceRequestsSlice, { initialFilters: { status: '', category: '', dateFrom: '', dateTo: '' }, fixed });
  const run = useRunAction(resourceRequestsSlice);
  const selection = useSelection();
  const exporter = useTechExport(resourceRequestService.exportList, list, selection, EXPORT_COLUMNS, 'resource-requests.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

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
    return res.ok;
  };
  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const menuItems = (row) => {
    const items = [];
    const pending = row.status === 'technical_reviewing' || row.status === 'store_reviewing';
    if (row.status === 'technical_reviewing') {
      if (canUpdate) items.push({ label: 'Edit Request', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setFormFor(row) });
      if (canDecide) {
        items.push({ label: 'Approve Request', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('technicalApprove', row) });
        items.push({ label: 'Reject Request', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('technicalReject', row) });
      }
    }
    if (row.status === 'store_reviewing' && canDecideStore) {
      items.push({ label: 'Approve for Issue', icon: <FiTruck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('storeApprove', row) });
      items.push({ label: 'Mark Unavailable', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('storeReject', row) });
    }
    if (row.status === 'issued' && canUpdate) items.push({ label: 'Mark Returned', icon: <FiRotateCcw size={14} color="#7C3AED" />, action: () => ask('return', row) });
    if (pending && canUpdate) items.push({ label: 'Cancel Request', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('cancel', row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'requestId', label: 'REQUEST ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'request', label: 'REQUEST', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    projectId
      ? { key: 'requestCategory', label: 'CATEGORY', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> }
      : { key: 'projectId', label: 'PROJECT', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'projectName')}</span> },
    { key: 'quantity', label: 'QTY', render: (v, row) => `${v} ${row.unit}` },
    { key: 'requestedBy', label: 'REQUESTED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'requestDate', label: 'REQUEST DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [projectId, canUpdate, canDecide, canDecideStore]);

  const viewActions = (record) => (
    <>
      {record.status === 'technical_reviewing' && canDecide && (
        <>
          <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => ask('technicalApprove', record)}>Approve</PrimaryButton>
          <SecondaryButton danger icon={<FiX size={14} />} onClick={() => ask('technicalReject', record)}>Reject</SecondaryButton>
        </>
      )}
      {record.status === 'store_reviewing' && canDecideStore && (
        <>
          <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiTruck size={14} />} onClick={() => ask('storeApprove', record)}>Approve for Issue</PrimaryButton>
          <SecondaryButton danger icon={<FiX size={14} />} onClick={() => ask('storeReject', record)}>Mark Unavailable</SecondaryButton>
        </>
      )}
      {record.status === 'issued' && canUpdate && <SecondaryButton icon={<FiRotateCcw size={14} />} onClick={() => ask('return', record)}>Mark Returned</SecondaryButton>}
      {record.status === 'technical_reviewing' && canUpdate && <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => setFormFor(record)}>Edit Request</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected requests exported` : 'Resource requests exported'), message ? 'error' : 'success');
  };

  const tiles = [
    { label: 'Total Requests', value: statValue(list.stats, 'total_requests'), sub: projectId ? 'Resources requested for this project' : 'Resources requested across all projects', icon: <FiList size={16} />, tone: 'blue' },
    { label: 'Approved', value: statValue(list.stats, 'approved'), sub: 'Approved and ready for issue', icon: <FiCheckCircle size={16} />, tone: 'green' },
    { label: 'Issued', value: statValue(list.stats, 'issued'), sub: 'Currently allocated to site', icon: <FiTruck size={16} />, tone: 'purple' },
    { label: 'Pending Approval', value: statValue(list.stats, 'pending_approval'), sub: 'Awaiting technical or store review', icon: <FiClock size={16} />, tone: 'amber' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'category', label: 'Category', options: RESOURCE_CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'dateFrom', label: 'Requested from', type: 'date' },
    { key: 'dateTo', label: 'Requested to', type: 'date' },
  ];

  const confirmCopy = {
    technicalApprove: { title: 'Approve Request?', message: 'The request moves on to store review.', label: 'Approve Request', method: 'technicalApprove', done: 'Technical approval granted' },
    storeApprove: { title: 'Approve for Issue?', message: 'The resource is issued to the project.', label: 'Approve for Issue', method: 'storeApprove', done: 'Resource approved for issue and issued' },
    return: { title: 'Mark Resource as Returned?', message: 'Confirm the issued resource has been returned to the store.', label: 'Mark Returned', method: 'returnResource', done: 'Resource marked as returned' },
  };
  const reasonCopy = {
    technicalReject: { title: 'Reject Request?', message: 'The request ends here and the requester is told.', label: 'Reason for rejection', button: 'Reject Request', method: 'technicalReject', done: 'Request rejected', required: true },
    storeReject: { title: 'Mark Resource Unavailable?', message: 'The request ends here and the requester is told.', label: 'Reason', button: 'Mark Unavailable', method: 'storeReject', done: 'Resource marked unavailable', required: true },
    cancel: { title: 'Cancel Request?', message: 'A cancelled request cannot be reopened.', label: 'Reason (optional)', button: 'Cancel Request', method: 'cancel', done: 'Request cancelled', required: false },
  };
  const summaryRows = (row) => [['Request', row.request], ['Request ID', row.requestId]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No resource requests found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder={projectId ? 'Search request, requester...' : 'Search Project ID, Project name...'}
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Request Resource</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Requests" subtitle="Narrow the requests by status, category and date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <RequestFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          fixedProjectId={projectId}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewRequestDrawer id={viewId} refreshKey={refreshKey} showProject={!projectId} actions={viewActions} canUpdate={canUpdate} onClose={() => setViewId(null)} />}

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
          message={reasonCopy[confirm.type].message}
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          label={reasonCopy[confirm.type].label}
          confirmLabel={reasonCopy[confirm.type].button}
          required={reasonCopy[confirm.type].required}
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
