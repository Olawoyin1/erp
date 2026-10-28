import { useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiDownload, FiEdit2, FiList, FiPlus, FiSlash } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError } from '../../services/apiHelpers';
import { calibrationRecordService } from '../../services/technical.service';
import { calibrationSlice } from '../../store/technical/slices';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, Panel, PrimaryButton, ReasonModal, RecordSummary,
  SecondaryButton, SimpleTable, StatusLine, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField } from '../procurement/shared/ProcExtras';
import FilesPanel from './shared/TechFiles';
import { DrawerTabs, RowActions, TechBadge } from './shared/TechUi';
import { useFetched, useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from './shared/techHooks';
import {
  CALIBRATION_FREQUENCIES, INSTRUMENT_TYPES, countFilters, fieldErrorsOf, formatDate, refId, refName, statValue, statusLabel, toOptions, uploadStagedFiles, ymd,
  nextDueText, today,
} from './shared/techUtils';

const STATUS_OPTIONS = ['valid', 'due_soon', 'overdue', 'out_of_service'].map((value) => ({ value, label: value === 'overdue' ? 'Overdue' : statusLabel(value) }));

const EXPORT_COLUMNS = [
  { label: 'Instrument ID', value: (r) => r.instrumentId },
  { label: 'Name', value: (r) => r.instrumentName },
  { label: 'Type', value: (r) => r.type },
  { label: 'Location', value: (r) => refName(r.storageLocation, 'name') },
  { label: 'Custodian', value: (r) => refName(r.custodian, 'fullName') },
  { label: 'Frequency', value: (r) => r.frequency },
  { label: 'Last Calibrated', value: (r) => ymd(r.lastCalibrated) },
  { label: 'Next Due', value: (r) => ymd(r.nextDue) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

/** Schedule Calibration (new instrument) or Edit Calibration (existing record). */
function InstrumentFormModal({ record, onClose, onSaved }) {
  const editing = Boolean(record);
  const { lookups } = useTechLookups(['employees', 'locations']);
  const [form, setForm] = useState(() => ({
    serialNumber: record?.serialNumber || '',
    instrumentName: record?.instrumentName || '',
    type: record?.type || 'Pressure Gauge',
    manufacturerModel: record?.manufacturerModel || '',
    custodian: refId(record?.custodian),
    storageLocation: refId(record?.storageLocation),
    frequency: record?.frequency || 'Six-Monthly',
    description: record?.description || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const employeeOptions = useMemo(() => {
    const options = toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`);
    const current = record?.custodian;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.fullName });
    return options;
  }, [lookups.employees, record]);
  const locationOptions = useMemo(() => {
    const options = toOptions(lookups.locations, 'name');
    const current = record?.storageLocation;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.name });
    return options;
  }, [lookups.locations, record]);
  const frequencyOptions = CALIBRATION_FREQUENCIES.includes(form.frequency) ? CALIBRATION_FREQUENCIES : [form.frequency, ...CALIBRATION_FREQUENCIES];

  const validate = () => {
    const next = {};
    if (!form.serialNumber.trim()) next.serialNumber = 'Enter the serial number';
    if (!form.instrumentName.trim()) next.instrumentName = 'Enter the instrument name';
    if (!form.manufacturerModel.trim()) next.manufacturerModel = 'Enter the manufacturer and model';
    if (!form.custodian) next.custodian = 'Choose the custodian';
    if (!form.storageLocation) next.storageLocation = 'Choose the storage location';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    const body = {
      serialNumber: form.serialNumber.trim(),
      instrumentName: form.instrumentName.trim(),
      type: form.type,
      manufacturerModel: form.manufacturerModel.trim(),
      custodian: form.custodian,
      storageLocation: form.storageLocation,
      frequency: form.frequency,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };
    try {
      let saved;
      if (editing) saved = (await calibrationRecordService.update(record._id, body)).data?.data;
      else saved = (await calibrationRecordService.create(body)).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(calibrationRecordService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Instrument updated' : `Instrument ${saved?.instrumentId || ''} scheduled for calibration tracking`}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The instrument could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Calibration' : 'Schedule Calibration'}
      subtitle={editing ? undefined : 'Record calibration details for an instrument and upload its calibration certificate'}
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Schedule Calibration'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Instrument ID"><Input value={editing ? record.instrumentId : 'Assigned on save'} disabled /></Field>
          <Field label="Serial number" required error={errors.serialNumber}>
            <Input value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} placeholder="e.g. SN-WIKA-4492" error={Boolean(errors.serialNumber)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Instrument name" required error={errors.instrumentName}>
            <Input value={form.instrumentName} onChange={(e) => set('instrumentName', e.target.value)} placeholder="e.g. Pressure Gauge (0-100 bar)" error={Boolean(errors.instrumentName)} />
          </Field>
          <Field label="Type" required error={errors.type}>
            <Choice value={form.type} onChange={(v) => set('type', v)} options={INSTRUMENT_TYPES} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Manufacturer / model" required error={errors.manufacturerModel}>
            <Input value={form.manufacturerModel} onChange={(e) => set('manufacturerModel', e.target.value)} placeholder="e.g. WIKA Model 232.50" error={Boolean(errors.manufacturerModel)} />
          </Field>
          <Field label="Custodian" required error={errors.custodian}>
            <Choice value={form.custodian} onChange={(v) => set('custodian', v)} searchable placeholder="Select a custodian" options={employeeOptions} error={errors.custodian} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Storage location" required error={errors.storageLocation}>
            <Choice value={form.storageLocation} onChange={(v) => set('storageLocation', v)} searchable placeholder="Select a location" options={locationOptions} error={errors.storageLocation} />
          </Field>
          <Field label="Frequency" required error={errors.frequency}>
            <Choice value={form.frequency} onChange={(v) => set('frequency', v)} options={frequencyOptions} />
          </Field>
        </TwoCol>
        <Field label="Description (optional)" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        {editing ? (
          <FilesPanel key={record._id} api={calibrationRecordService} id={record._id} canUpload canRemove={(file) => file.subjectType === 'CalibrationRecord'} />
        ) : (
          <Field label="Attach document (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

/** Log Calibration: the next due date follows from the calibration date and the instrument's frequency. */
function LogCalibrationModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({ calibrationDate: today(), calibratedBy: '', certificateNumber: '', result: 'Pass', nextDue: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const computed = nextDueText(form.calibrationDate, record.frequency);
  const manual = !computed;

  const save = async () => {
    setError('');
    const next = {};
    if (!form.calibrationDate) next.calibrationDate = 'Choose the calibration date';
    if (!form.calibratedBy.trim()) next.calibratedBy = 'Enter who carried out the calibration';
    if (!form.certificateNumber.trim()) next.certificateNumber = 'Enter the certificate number';
    if (manual && !form.nextDue) next.nextDue = `Enter the next due date: "${record.frequency}" is not a standard interval`;
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const data = new FormData();
    data.append('calibrationDate', form.calibrationDate);
    data.append('calibratedBy', form.calibratedBy.trim());
    data.append('certificateNumber', form.certificateNumber.trim());
    data.append('calibrationResult', form.result);
    if (manual) data.append('nextDue', form.nextDue);
    if (files[0]) data.append('file', files[0]);
    try {
      await calibrationRecordService.log(record._id, data);
      onSaved('Calibration logged successfully');
    } catch (err) {
      setError(apiError(err, 'The calibration could not be logged'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={`Log Calibration — ${record.instrumentId} ${record.instrumentName}`}
      width="540px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Log Calibration'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Calibration date" required error={errors.calibrationDate}>
            <DatePicker value={form.calibrationDate} onChange={(e) => set('calibrationDate', e.target.value)} error={Boolean(errors.calibrationDate)} />
          </Field>
          <Field label="Next due" error={errors.nextDue} help={manual ? undefined : `Calibration date plus the ${record.frequency.toLowerCase()} interval.`}>
            {manual
              ? <DatePicker value={form.nextDue} onChange={(e) => set('nextDue', e.target.value)} error={Boolean(errors.nextDue)} />
              : <Input value={formatDate(computed)} disabled />}
          </Field>
        </TwoCol>
        <Field label="Calibrated by" required error={errors.calibratedBy}>
          <Input value={form.calibratedBy} onChange={(e) => set('calibratedBy', e.target.value)} placeholder="e.g. SGS Nigeria Calibration Lab" error={Boolean(errors.calibratedBy)} />
        </Field>
        <TwoCol>
          <Field label="Certificate number" required error={errors.certificateNumber}>
            <Input value={form.certificateNumber} onChange={(e) => set('certificateNumber', e.target.value)} error={Boolean(errors.certificateNumber)} />
          </Field>
          <Field label="Calibration result" required error={errors.calibrationResult}>
            <Choice value={form.result} onChange={(v) => set('result', v)} options={['Pass', 'Fail']} />
          </Field>
        </TwoCol>
        <Field label="Attach certificate (optional)"><AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} /></Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function HistoryTab({ record, refreshKey, canLog, onLog, onError }) {
  const history = useFetched(() => calibrationRecordService.calibrationHistory(record._id), record._id, refreshKey);
  const download = async (row) => {
    try {
      const res = await calibrationRecordService.certificate(record._id, row._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      onError(apiError(err, 'The certificate could not be downloaded'));
    }
  };
  if (history.error) return <FormError message={history.error} />;
  if (history.loading) return <div style={{ color: '#94A3B8', padding: 12 }}>Loading history…</div>;
  if (!history.data.length) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <strong style={{ color: '#0F172A' }}>No Calibration History</strong>
        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Full calibration history with certificates appears here.</span>
        {canLog && <PrimaryButton icon={<FiPlus size={14} />} onClick={onLog}>Log Calibration</PrimaryButton>}
      </div>
    );
  }
  return (
    <SimpleTable
      columns={[
        { key: 'calibrationDate', label: 'Date', render: (r) => formatDate(r.calibrationDate) },
        { key: 'calibratedBy', label: 'Calibrated by' },
        { key: 'calibrationResult', label: 'Result', render: (r) => <TechBadge status={r.calibrationResult} label={r.calibrationResult === 'Pass' ? 'Passed' : 'Failed'} /> },
        { key: 'certificateNumber', label: 'Certificate No.' },
        { key: 'loggedByName', label: 'Logged by', render: (r) => r.loggedByName || '—' },
        {
          key: 'file',
          label: '',
          render: (r) => (r.hasCertificate ? (
            <button type="button" className="icon-btn" title="Download certificate" onClick={() => download(r)}><FiDownload size={15} /></button>
          ) : null),
        },
      ]}
      rows={history.data}
    />
  );
}

function ViewInstrumentDrawer({ id, refreshKey, canUpdate, actions, onError, onLog, onClose }) {
  const { record, error, loading } = useRecord(calibrationRecordService, id, refreshKey);
  const latest = record?.latestCalibration;
  return (
    <Drawer isOpen onClose={onClose} title="" width="620px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading instrument…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiList size={22} />} title={record.instrumentName} subtitle={`${record.type} • ${record.instrumentId}`} />
          <StatusLine status={<TechBadge status={record.status} />}>
            <span style={{ flex: 1 }} />
            {actions(record)}
          </StatusLine>
          <DrawerTabs tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]}>
            {(tab) => (tab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Calibration date', latest ? formatDate(latest.calibrationDate) : 'Not yet calibrated'],
                    ['Next due', formatDate(record.nextDue)],
                    ['Calibrated by', latest?.calibratedBy],
                    ['Certificate number', latest?.certificateNumber],
                    ['Calibration result', latest?.calibrationResult],
                    ['Status', record.status === 'overdue' ? 'Overdue' : statusLabel(record.status)],
                  ]}
                />
                <DetailGrid
                  items={[
                    ['Instrument ID', record.instrumentId],
                    ['Serial number', record.serialNumber],
                    ['Instrument name', record.instrumentName],
                    ['Type', record.type],
                    ['Manufacturer / model', record.manufacturerModel],
                    ['Custodian', refName(record.custodian, 'fullName')],
                    ['Storage location', refName(record.storageLocation, 'name')],
                    ['Frequency', record.frequency],
                  ]}
                />
                <Panel title="Description">{record.description || 'No description entered.'}</Panel>
                {record.status === 'out_of_service' && <Panel title="Out of service reason" tone="red">{record.outOfServiceReason || 'No reason was recorded.'}</Panel>}
                <FilesPanel key={record._id} api={calibrationRecordService} id={record._id} canUpload={canUpdate} canRemove={false} />
              </div>
            ) : (
              <HistoryTab record={record} refreshKey={refreshKey} canLog={canUpdate && record.status !== 'out_of_service'} onLog={() => onLog(record)} onError={onError} />
            ))}
          </DrawerTabs>
        </div>
      )}
    </Drawer>
  );
}

export default function CalibrationRecords() {
  const canCreate = usePermission('technical.calibrationrecord.create');
  const canUpdate = usePermission('technical.calibrationrecord.update');
  const list = useTechList(calibrationSlice, { initialFilters: { status: '', type: '', dueFrom: '', dueTo: '' } });
  const run = useRunAction(calibrationSlice);
  const selection = useSelection();
  const exporter = useTechExport(calibrationRecordService.exportList, list, selection, EXPORT_COLUMNS, 'calibration-records.csv');
  const { toast, showToast, hideToast } = useToast();

  const [formFor, setFormFor] = useState(null);
  const [logFor, setLogFor] = useState(null);
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

  const menuItems = (row) => {
    if (!canUpdate) return [];
    const items = [{ label: 'Edit', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setFormFor(row) }];
    if (row.status === 'out_of_service') items.push({ label: 'Restore', icon: <FiCheck size={14} color="#16A34A" />, action: () => ask('restore', row) });
    else {
      items.push({ label: 'Log Calibration', icon: <FiCheck size={14} color="#16A34A" />, action: () => setLogFor(row) });
      items.push({ label: 'Out of service', icon: <FiSlash size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('outOfService', row) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'instrumentId', label: 'INSTRUMENT ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'instrumentName', label: 'NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'storageLocation', label: 'LOCATION', render: (v) => refName(v, 'name') },
    { key: 'custodian', label: 'CUSTODIAN', render: (v) => refName(v, 'fullName') },
    { key: 'lastCalibrated', label: 'LAST CALIBRATED', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'nextDue', label: 'NEXT DUE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} label={v === 'overdue' ? 'Overdue' : undefined} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate]);

  const viewActions = (record) => (
    <>
      {canUpdate && record.status !== 'out_of_service' && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => setLogFor(record)}>Log Calibration</PrimaryButton>}
      {canUpdate && record.status === 'out_of_service' && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => ask('restore', record)}>Restore</PrimaryButton>}
      {canUpdate && <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
      {canUpdate && record.status !== 'out_of_service' && <SecondaryButton danger icon={<FiSlash size={14} />} onClick={() => ask('outOfService', record)}>Out of service</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected instruments exported` : 'Calibration records exported'), message ? 'error' : 'success');
  };

  const overdue = statValue(list.stats, 'overdue');
  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'type', label: 'Instrument type', options: INSTRUMENT_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'dueFrom', label: 'Next due from', type: 'date' },
    { key: 'dueTo', label: 'Next due to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Calibration Records" subtitle="Register of measuring and test instruments with calibration status" />

      {overdue > 0 && (
        <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiAlertCircle color="#EF4444" size={18} />
          <span style={{ fontSize: '0.875rem', color: '#7F1D1D' }}>
            {overdue} instrument{overdue === 1 ? ' is' : 's are'} out of calibration. Remove from service immediately until recalibrated.{' '}
            <button type="button" onClick={() => list.applyFilters({ ...list.filters, status: 'overdue' })} style={{ background: 'none', border: 'none', fontWeight: 700, color: '#7F1D1D', cursor: 'pointer', padding: 0 }}>
              View Overdue &rarr;
            </button>
          </span>
        </div>
      )}

      <ListCard
        list={list}
        columns={columns}
        emptyText="No calibration records found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by Instrument ID, name, custodian..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Schedule Calibration</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Instruments" subtitle="Narrow the register by status, type and due date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <InstrumentFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {logFor && (
        <LogCalibrationModal
          key={logFor._id}
          record={logFor}
          onClose={() => setLogFor(null)}
          onSaved={(message) => { setLogFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewInstrumentDrawer
          id={viewId}
          refreshKey={refreshKey}
          canUpdate={canUpdate}
          actions={viewActions}
          onError={(message) => showToast(message, 'error')}
          onLog={(record) => setLogFor(record)}
          onClose={() => setViewId(null)}
        />
      )}

      {confirm?.type === 'outOfService' && (
        <ReasonModal
          title="Mark Instrument Out of Service?"
          message="It will no longer be considered available for active use or calibration."
          detail={<RecordSummary rows={[['Instrument', `${confirm.row.instrumentName} ${confirm.row.instrumentId}`]]} />}
          label="Reason"
          confirmLabel="Mark Out of Service"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('outOfService', [confirm.row._id, reason], 'Instrument marked out of service')}
        />
      )}
      {confirm?.type === 'restore' && (
        <ConfirmModal
          title="Restore Instrument to Service?"
          message="Its status is recalculated from its next due date."
          detail={<RecordSummary rows={[['Instrument', `${confirm.row.instrumentName} ${confirm.row.instrumentId}`]]} />}
          confirmLabel="Restore"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('restore', [confirm.row._id], 'Instrument restored to service')}
        />
      )}
    </div>
  );
}
