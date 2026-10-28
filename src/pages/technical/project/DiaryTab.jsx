import { useCallback, useMemo, useState } from 'react';
import { FiCheck, FiClipboard, FiEdit2, FiPlus, FiRotateCcw, FiSend, FiTrash2 } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { siteDiaryService } from '../../../services/technical.service';
import { siteDiarySlice } from '../../../store/technical/slices';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, Panel, PrimaryButton, ReasonModal, RecordSummary,
  SecondaryButton, StatusLine, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from '../shared/TechFiles';
import { DrawerTabs, RowActions, TechBadge, Trail } from '../shared/TechUi';
import { useFetched, useMyEmployee, useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import { WEATHER, countFilters, fieldErrorsOf, formatDate, refId, refName, statusLabel, toOptions, today, uploadStagedFiles, ymd } from '../shared/techUtils';

const STATUS_OPTIONS = ['draft', 'submitted', 'signed_off'].map((value) => ({ value, label: statusLabel(value) }));
const YES_NO = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];

const EXPORT_COLUMNS = [
  { label: 'Entry ID', value: (r) => r.entryId },
  { label: 'Date', value: (r) => ymd(r.reportDate) },
  { label: 'Site Location', value: (r) => refName(r.siteLocation, 'name') },
  { label: 'Logged By', value: (r) => refName(r.loggedBy, 'fullName') },
  { label: 'Summary of Work', value: (r) => r.workSummary },
  { label: 'Workforce', value: (r) => r.workforce },
  { label: 'Incident', value: (r) => (r.incident ? 'Yes' : 'No') },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function EntryFormModal({ projectId, record, onClose, onSaved }) {
  const editing = Boolean(record);
  const me = useMyEmployee();
  const { lookups } = useTechLookups(['locations']);
  const [form, setForm] = useState(() => ({
    reportDate: record ? ymd(record.reportDate) : today(),
    siteLocation: refId(record?.siteLocation),
    weather: record?.weatherCondition || '',
    workforce: record ? String(record.workforce) : '',
    incident: record?.incident ? 'true' : 'false',
    workSummary: record?.workSummary || '',
    machinery: record?.machineryEquipmentUtilised || '',
    issues: record?.siteIssuesObservation || '',
    remarks: record?.additionalRemarks || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const locationOptions = useMemo(() => {
    const options = toOptions(lookups.locations, 'name');
    const current = record?.siteLocation;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.name });
    return options;
  }, [lookups.locations, record]);

  const save = async () => {
    setError('');
    const next = {};
    if (!form.reportDate) next.reportDate = 'Choose the report date';
    if (!form.siteLocation) next.siteLocation = 'Choose the site location';
    if (!form.weather) next.weatherCondition = 'Choose the weather condition';
    const workforce = Number(form.workforce);
    if (form.workforce === '' || !Number.isInteger(workforce) || workforce < 0) next.workforce = 'Enter the workforce as a whole number';
    if (!form.workSummary.trim()) next.workSummary = 'Summarise the work done';
    if (!form.machinery.trim()) next.machineryEquipmentUtilised = 'List the machinery and equipment used';
    if (!form.issues.trim()) next.siteIssuesObservation = 'Record site issues or observations (write "None" if there were none)';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      reportDate: form.reportDate,
      siteLocation: form.siteLocation,
      weatherCondition: form.weather,
      workforce,
      incident: form.incident === 'true',
      workSummary: form.workSummary.trim(),
      machineryEquipmentUtilised: form.machinery.trim(),
      siteIssuesObservation: form.issues.trim(),
      ...(form.remarks.trim() ? { additionalRemarks: form.remarks.trim() } : {}),
    };
    try {
      let saved;
      if (editing) saved = (await siteDiaryService.update(record._id, body)).data?.data;
      else saved = (await siteDiaryService.create(projectId, body)).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(siteDiaryService, saved._id, files);
        if (failed.length) note = ` Files not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Entry updated' : 'Site diary entry saved as a draft; submit it when it is final'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The entry could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Entry' : 'New Site Diary Entry'}
      subtitle={editing ? undefined : 'Log daily site activities and project updates'}
      width="660px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Save Entry'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Report date" required error={errors.reportDate}><DatePicker value={form.reportDate} onChange={(e) => set('reportDate', e.target.value)} error={Boolean(errors.reportDate)} /></Field>
          <Field label="Site location" required error={errors.siteLocation}>
            <Choice value={form.siteLocation} onChange={(v) => set('siteLocation', v)} searchable placeholder="Select a location" options={locationOptions} error={errors.siteLocation} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Weather condition" required error={errors.weatherCondition}><Choice value={form.weather} onChange={(v) => set('weather', v)} placeholder="Select" options={WEATHER} error={errors.weatherCondition} /></Field>
          <Field label="Logged by" help="Taken from your account."><Input value={editing ? refName(record.loggedBy, 'fullName') : me.name || '—'} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Workforce" required error={errors.workforce}><Input value={form.workforce} inputMode="numeric" onChange={(e) => set('workforce', e.target.value.replace(/\D/g, ''))} error={Boolean(errors.workforce)} /></Field>
          <Field label="Incident" required error={errors.incident}><Choice value={form.incident} onChange={(v) => set('incident', v)} options={YES_NO} /></Field>
        </TwoCol>
        <Field label="Work summary" required error={errors.workSummary}><Textarea rows={3} value={form.workSummary} onChange={(e) => set('workSummary', e.target.value)} error={Boolean(errors.workSummary)} /></Field>
        <Field label="Machinery & equipment utilised" required error={errors.machineryEquipmentUtilised}><Textarea rows={2} value={form.machinery} onChange={(e) => set('machinery', e.target.value)} error={Boolean(errors.machineryEquipmentUtilised)} /></Field>
        <Field label="Site issues / observation" required error={errors.siteIssuesObservation}><Textarea rows={3} value={form.issues} onChange={(e) => set('issues', e.target.value)} error={Boolean(errors.siteIssuesObservation)} /></Field>
        <Field label="Additional remarks" error={errors.additionalRemarks}><Textarea rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} /></Field>
        {editing
          ? <FilesPanel key={record._id} api={siteDiaryService} id={record._id} title="Files" canUpload canRemove />
          : <Field label="File upload (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <Note tone="amber"><strong>COMPLIANCE DIRECTIVE.</strong> Once submitted, a site diary entry is validated and locked. False reporting is a violation of HSE field compliance.</Note>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewEntryDrawer({ id, refreshKey, actions, canUpdate, onClose }) {
  const { record, error, loading } = useRecord(siteDiaryService, id, refreshKey);
  const trail = useFetched(() => siteDiaryService.history(id), id, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title="" width="600px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading entry…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiClipboard size={22} />} title={record.entryId} subtitle={`${formatDate(record.reportDate)} • ${refName(record.siteLocation, 'name')}`} />
          <StatusLine status={<TechBadge status={record.status} />}>
            <span style={{ flex: 1 }} />
            {actions(record)}
          </StatusLine>
          <DrawerTabs tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]}>
            {(tab) => (tab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Report date', formatDate(record.reportDate)],
                    ['Entry ID', record.entryId],
                    ['Site location', refName(record.siteLocation, 'name')],
                    ['Weather condition', record.weatherCondition],
                    ['Logged by', refName(record.loggedBy, 'fullName')],
                    ['Workforce', record.workforce],
                    ['Incident', record.incident ? 'Yes' : 'No'],
                  ]}
                />
                <Panel title="Work summary">{record.workSummary}</Panel>
                <Panel title="Machinery & equipment utilised">{record.machineryEquipmentUtilised || '—'}</Panel>
                <Panel title="Site issues / observation">{record.siteIssuesObservation || '—'}</Panel>
                <Panel title="Additional remarks">{record.additionalRemarks || '—'}</Panel>
                <FilesPanel key={record._id} api={siteDiaryService} id={record._id} title="Files uploaded" canUpload={canUpdate && record.status === 'draft'} canRemove={canUpdate && record.status === 'draft'} />
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

export default function DiaryTab({ project, refreshKey, showToast }) {
  const projectId = project._id;
  const canCreate = usePermission('technical.sitediary.create');
  const canUpdate = usePermission('technical.sitediary.update');
  const canDecide = usePermission('technical.sitediary.decide');
  const open = project.status !== 'completed';

  const fixed = useMemo(() => ({ projectId }), [projectId]);
  const list = useTechList(siteDiarySlice, { initialFilters: { status: '', incident: '', dateFrom: '', dateTo: '' }, fixed, withStats: false });
  const run = useRunAction(siteDiarySlice);
  const selection = useSelection();
  const exportRequest = useCallback((params) => siteDiaryService.exportList(projectId, params), [projectId]);
  const exporter = useTechExport(exportRequest, list, selection, EXPORT_COLUMNS, 'site-diary.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setLocalKey((k) => k + 1); };
  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const doAction = async (method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await run(method, ...args);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      if (method === 'remove') setViewId(null);
      showToast(success, 'success');
      refresh();
    } else {
      setActionError(res.error);
    }
  };

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'draft' && canUpdate) {
      items.push({ label: 'Edit Entry', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setFormFor(row) });
      items.push({ label: 'Submit Entry', icon: <FiSend size={14} color="#2563EB" />, action: () => ask('submit', row) });
      items.push({ label: 'Delete Entry', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('delete', row) });
    }
    if (row.status === 'submitted' && canDecide) {
      items.push({ label: 'Sign-off', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('signOff', row) });
      items.push({ label: 'Return for Revision', icon: <FiRotateCcw size={14} color="#64748B" />, action: () => ask('return', row) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'entryId', label: 'ENTRY ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'reportDate', label: 'DATE', render: (v) => formatDate(v) },
    { key: 'siteLocation', label: 'SITE LOCATION', render: (v) => <span style={{ color: '#2563EB' }}>{refName(v, 'name')}</span> },
    { key: 'loggedBy', label: 'LOGGED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'workSummary', label: 'SUMMARY OF WORK', render: (v) => <span title={v}>{String(v).length > 48 ? `${String(v).slice(0, 48)}…` : v}</span> },
    { key: 'workforce', label: 'WORKFORCE' },
    { key: 'incident', label: 'INCIDENT', render: (v) => (v ? 'Yes' : 'No') },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDecide]);

  const viewActions = (record) => (
    <>
      {record.status === 'draft' && canUpdate && (
        <>
          <PrimaryButton icon={<FiSend size={14} />} onClick={() => ask('submit', record)}>Submit Entry</PrimaryButton>
          <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => { setViewId(null); setFormFor(record); }}>Edit</SecondaryButton>
          <SecondaryButton danger icon={<FiTrash2 size={14} />} onClick={() => ask('delete', record)}>Delete</SecondaryButton>
        </>
      )}
      {record.status === 'submitted' && canDecide && (
        <>
          <PrimaryButton icon={<FiCheck size={14} />} onClick={() => ask('signOff', record)}>Sign-Off</PrimaryButton>
          <SecondaryButton icon={<FiRotateCcw size={14} />} onClick={() => ask('return', record)}>Return for Revision</SecondaryButton>
        </>
      )}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected entries exported` : 'Site diary exported'), message ? 'error' : 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'incident', label: 'Incident', options: YES_NO },
    { key: 'dateFrom', label: 'Report date from', type: 'date' },
    { key: 'dateTo', label: 'Report date to', type: 'date' },
  ];
  const summaryRows = (row) => [['Entry', row.entryId], ['Date', formatDate(row.reportDate)]];
  const confirmCopy = {
    submit: { title: 'Submit Site Diary Entry?', message: 'Once submitted the entry is locked for compliance and can no longer be edited or deleted.', label: 'Submit Entry', method: 'submit', done: 'Site diary entry submitted' },
    signOff: { title: 'Sign Off Entry?', message: 'Confirm the entry is accurate and complete.', label: 'Sign-Off', method: 'signOff', done: 'Site diary entry signed off' },
    delete: { title: 'Delete Entry?', message: 'This permanently removes the draft and its files.', label: 'Delete Entry', method: 'remove', done: 'Entry deleted', danger: true },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No diary entries yet."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search entry ID, location, logger..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>New Diary Entry</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Diary Entries" subtitle="Narrow the diary by status, incident and date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <EntryFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          projectId={projectId}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {viewId && <ViewEntryDrawer id={viewId} refreshKey={refreshKey + localKey} actions={viewActions} canUpdate={canUpdate} onClose={() => setViewId(null)} />}

      {confirm && confirmCopy[confirm.type] && (
        <ConfirmModal
          title={confirmCopy[confirm.type].title}
          message={confirmCopy[confirm.type].message}
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          confirmLabel={confirmCopy[confirm.type].label}
          danger={confirmCopy[confirm.type].danger}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction(confirmCopy[confirm.type].method, [confirm.row._id], confirmCopy[confirm.type].done)}
        />
      )}
      {confirm?.type === 'return' && (
        <ReasonModal
          title="Return Entry for Revision?"
          message="The entry goes back to draft so the logger can correct it."
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          label="Notes for the logger (optional)"
          required={false}
          confirmLabel="Return for Revision"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(notes) => doAction('returnForRevision', [confirm.row._id, notes], 'Returned for revision')}
        />
      )}
    </div>
  );
}
