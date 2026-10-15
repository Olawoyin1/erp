import { useCallback, useMemo, useState } from 'react';
import { FiEdit2, FiEye, FiList, FiPlus } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { siteInspectionService } from '../../../services/technical.service';
import { inspectionsSlice } from '../../../store/technical/slices';
import { Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, SecondaryButton, TwoCol, ViewHeader } from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel, { ImageThumbs } from '../shared/TechFiles';
import { DrawerTabs, Trail } from '../shared/TechUi';
import { useFetched, useMyEmployee, useRecord, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import { countFilters, fieldErrorsOf, formatDate, refId, refName, toOptions, today, uploadStagedFiles, ymd } from '../shared/techUtils';

const IMAGE_ACCEPT = '.png,.jpg,.jpeg';

const EXPORT_COLUMNS = [
  { label: 'Inspection ID', value: (r) => r.inspectionId },
  { label: 'Inspection Date', value: (r) => ymd(r.inspectionDate) },
  { label: 'Site Location', value: (r) => r.siteLocation },
  { label: 'Key Finding', value: (r) => r.keyFinding },
  { label: 'Inspected By', value: (r) => refName(r.inspectedBy, 'fullName') },
];

function InspectionFormModal({ projectId, record, onClose, onSaved }) {
  const editing = Boolean(record);
  const me = useMyEmployee();
  const { lookups } = useTechLookups(['employees']);
  const [form, setForm] = useState(() => ({
    inspectionDate: record ? ymd(record.inspectionDate) : today(),
    inspectedBy: refId(record?.inspectedBy) || me.id,
    siteLocation: record?.siteLocation || '',
    keyFinding: record?.keyFinding || '',
    fullFindings: record?.fullFindings || '',
    recommendations: record?.recommendations || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const employeeOptions = useMemo(() => {
    const options = toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`);
    const current = record?.inspectedBy;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.fullName });
    return options;
  }, [lookups.employees, record]);

  const save = async () => {
    setError('');
    const next = {};
    if (!form.inspectionDate) next.inspectionDate = 'Choose the inspection date';
    if (!form.inspectedBy) next.inspectedBy = 'Choose who inspected';
    if (!form.siteLocation.trim()) next.siteLocation = 'Enter the site location';
    if (!form.keyFinding.trim()) next.keyFinding = 'Summarise the key finding';
    if (!form.fullFindings.trim()) next.fullFindings = 'Enter the full findings';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      inspectionDate: form.inspectionDate,
      inspectedBy: form.inspectedBy,
      siteLocation: form.siteLocation.trim(),
      keyFinding: form.keyFinding.trim(),
      fullFindings: form.fullFindings.trim(),
      ...(form.recommendations.trim() ? { recommendations: form.recommendations.trim() } : {}),
    };
    try {
      let saved;
      if (editing) saved = (await siteInspectionService.update(record._id, body)).data?.data;
      else saved = (await siteInspectionService.create(projectId, body)).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(siteInspectionService, saved._id, files);
        if (failed.length) note = ` Images not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Inspection updated' : `Inspection ${saved?.inspectionId || ''} recorded`}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The inspection could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Inspection' : 'Add Inspection'}
      subtitle={editing ? undefined : 'Record site findings and observations for this project'}
      maxWidth="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Save Inspection'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Inspection ID"><Input value={editing ? record.inspectionId : 'Assigned on save'} disabled /></Field>
          <Field label="Inspection date" required error={errors.inspectionDate}><DatePicker value={form.inspectionDate} onChange={(e) => set('inspectionDate', e.target.value)} error={Boolean(errors.inspectionDate)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Inspected by" required error={errors.inspectedBy}>
            <Choice value={form.inspectedBy} onChange={(v) => set('inspectedBy', v)} searchable placeholder="Select a person" options={employeeOptions} error={errors.inspectedBy} />
          </Field>
          <Field label="Site location" required error={errors.siteLocation}><Input value={form.siteLocation} onChange={(e) => set('siteLocation', e.target.value)} placeholder="e.g. Bonny Offshore Facility, Rivers State" error={Boolean(errors.siteLocation)} /></Field>
        </TwoCol>
        <Field label="Key finding" required error={errors.keyFinding}><Textarea rows={2} value={form.keyFinding} onChange={(e) => set('keyFinding', e.target.value)} error={Boolean(errors.keyFinding)} /></Field>
        <Field label="Full findings" required error={errors.fullFindings}><Textarea rows={4} value={form.fullFindings} onChange={(e) => set('fullFindings', e.target.value)} error={Boolean(errors.fullFindings)} /></Field>
        <Field label="Recommendations (optional)" error={errors.recommendations}><Textarea rows={3} value={form.recommendations} onChange={(e) => set('recommendations', e.target.value)} /></Field>
        {editing
          ? <FilesPanel key={record._id} api={siteInspectionService} id={record._id} title="Images" canUpload canRemove />
          : <Field label="Upload image"><AttachField files={files} onChange={setFiles} accept={IMAGE_ACCEPT} hint="PNG, JPG, up to 50MB" disabled={busy} /></Field>}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewInspectionDrawer({ id, refreshKey, canUpdate, onEdit, onClose }) {
  const { record, error, loading } = useRecord(siteInspectionService, id, refreshKey);
  const trail = useFetched(() => siteInspectionService.history(id), id, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title="" width="600px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading inspection…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiList size={22} />} title="Site Inspection" subtitle={`${record.inspectionId} • ${formatDate(record.inspectionDate)}`}>
            {canUpdate && <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => onEdit(record)}>Edit</SecondaryButton>}
          </ViewHeader>
          <DrawerTabs tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]}>
            {(tab) => (tab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Inspection ID', record.inspectionId],
                    ['Inspection date', formatDate(record.inspectionDate)],
                    ['Inspected by', refName(record.inspectedBy, 'fullName')],
                    ['Site location', record.siteLocation],
                  ]}
                />
                <Panel title="Key finding">{record.keyFinding}</Panel>
                <Panel title="Full findings">{record.fullFindings}</Panel>
                <Panel title="Recommendations">{record.recommendations || 'None recorded.'}</Panel>
                <ImageThumbs key={`${record._id}:${refreshKey}`} api={siteInspectionService} id={record._id} refreshKey={refreshKey} />
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

export default function InspectionsTab({ project, refreshKey, showToast }) {
  const projectId = project._id;
  const canCreate = usePermission('technical.siteinspection.create');
  const canUpdate = usePermission('technical.siteinspection.update');
  const open = project.status !== 'completed';

  const fixed = useMemo(() => ({ projectId }), [projectId]);
  const list = useTechList(inspectionsSlice, { initialFilters: { dateFrom: '', dateTo: '' }, fixed, withStats: false });
  const selection = useSelection();
  const exportRequest = useCallback((params) => siteInspectionService.exportList(projectId, params), [projectId]);
  const exporter = useTechExport(exportRequest, list, selection, EXPORT_COLUMNS, 'site-inspections.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const refresh = () => { list.reload(); setLocalKey((k) => k + 1); };

  const columns = useMemo(() => [
    { key: 'inspectionId', label: 'INSPECTION ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'inspectionDate', label: 'INSPECTION DATE', render: (v) => formatDate(v) },
    { key: 'keyFinding', label: 'KEY FINDING', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'inspectedBy', label: 'INSPECTED BY', render: (v) => refName(v, 'fullName') },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button type="button" className="icon-btn" title="View" onClick={() => setViewId(row._id)}><FiEye size={14} /></button>
          {canUpdate && <button type="button" className="icon-btn" title="Edit" onClick={() => setFormFor(row)}><FiEdit2 size={14} /></button>}
        </div>
      ),
    },
  ], [canUpdate]);

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected inspections exported` : 'Inspections exported'), message ? 'error' : 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No inspections recorded yet."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Add Inspection</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Inspections"
        subtitle="Narrow the inspections by date."
        fields={[{ key: 'dateFrom', label: 'Inspected from', type: 'date' }, { key: 'dateTo', label: 'Inspected to', type: 'date' }]}
        values={list.filters}
        onApply={list.applyFilters}
      />

      {formFor && (
        <InspectionFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          projectId={projectId}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {viewId && (
        <ViewInspectionDrawer
          id={viewId}
          refreshKey={refreshKey + localKey}
          canUpdate={canUpdate}
          onEdit={(record) => { setViewId(null); setFormFor(record); }}
          onClose={() => setViewId(null)}
        />
      )}
    </div>
  );
}
