import { useEffect, useState } from 'react';
import { FiEye, FiDownload, FiList, FiPlus, FiUpload, FiFileText } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import { DatePicker, Input } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { qmsCalibrationSlice } from '../../store/quality/slices';
import { apiError } from '../../services/apiHelpers';
import { qualityCalibrationService } from '../../services/quality.service';
import { countFilters, fieldErrorsOf, formatDate, statusLabel, useDebounced, ymd } from '../procurement/shared/procUtils';
import { useExport, useFetched, useProcList, useRecord, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, Panel,
  PrimaryButton, SecondaryButton, SimpleTable, Skeleton, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField } from '../procurement/shared/ProcExtras';
import { Pill } from '../administration/shared/AdmUi';
import { nameOf, openSignedDownload } from '../hse/shared/hseUtils';
import { useQualityLookups } from '../hse/shared/useScreenLookups';

const INSTRUMENT_TYPES = ['Pressure Gauge', 'Temperature Gauge', 'Ultrasonic Thickness Gauge', 'Torque Wrench', 'Multimeter', 'Coating Thickness Gauge', 'Gas Detector', 'Hardness Tester'];
const STATUSES = [
  { value: 'valid', label: 'Valid' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'out_of_service', label: 'Out of Service' },
];
const STATUS_TONE = { valid: 'green', due_soon: 'amber', overdue: 'red', out_of_service: 'slate' };
const RESULTS = [{ value: 'Pass', label: 'Passed' }, { value: 'Fail', label: 'Failed' }];
const FREQUENCY_SECTIONS = ['frequencies'];

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;

const EXPORT_COLUMNS = [
  { label: 'Instrument ID', value: (r) => r.instrumentId },
  { label: 'Name', value: (r) => r.instrumentName },
  { label: 'Type', value: (r) => r.type },
  { label: 'Location', value: (r) => nameOf(r.storageLocation) },
  { label: 'Custodian', value: (r) => nameOf(r.custodian) },
  { label: 'Last Calibrated', value: (r) => ymd(r.lastCalibrated) },
  { label: 'Next Due', value: (r) => ymd(r.nextDue) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

/** `YYYY-MM-DD` plus whole calendar months, clamped to the end of the month. */
function addMonths(dateText, months) {
  const [year, month, day] = dateText.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function LogCalibrationModal({ instrument, onClose, onSaved }) {
  const { lookups } = useQualityLookups(FREQUENCY_SECTIONS);
  const [term, setTerm] = useState('');
  const search = useDebounced(term.trim(), 300);
  const [pick, setPick] = useState({ rows: [], loading: !instrument, error: '' });
  const [chosen, setChosen] = useState(instrument || null);
  const [form, setForm] = useState({ calibrationDate: '', calibratedBy: '', nextDue: '', certificateNumber: '', calibrationResult: 'Pass' });
  const [dueTouched, setDueTouched] = useState(false);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (instrument) return undefined;
    let cancelled = false;
    qualityCalibrationService.list({ page: 1, limit: 25, ...(search ? { search } : {}) })
      .then((res) => { if (!cancelled) setPick({ rows: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setPick({ rows: [], loading: false, error: apiError(err, 'Could not load instruments') }); });
    return () => { cancelled = true; };
  }, [instrument, search]);

  const suggestDue = (date, record) => {
    const months = (lookups.frequencies || []).find((f) => f.label.toLowerCase() === String(record?.frequency || '').toLowerCase())?.months;
    return date && months ? addMonths(date, months) : '';
  };

  const onDate = (date) => {
    setForm((f) => ({ ...f, calibrationDate: date, nextDue: dueTouched ? f.nextDue : suggestDue(date, chosen) || f.nextDue }));
  };

  const save = async () => {
    setError('');
    const next = {};
    if (!chosen) next.instrument = 'Choose the instrument that was calibrated';
    if (!form.calibrationDate) next.calibrationDate = 'Choose the calibration date';
    if (!form.calibratedBy.trim()) next.calibratedBy = 'Enter who carried out the calibration';
    if (!form.nextDue) next.nextDue = 'Choose the next due date';
    if (form.calibrationDate && form.nextDue && form.nextDue <= form.calibrationDate) next.nextDue = 'Next due must be after the calibration date';
    if (!form.certificateNumber.trim()) next.certificateNumber = 'Enter the certificate number';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await qualityCalibrationService.log(chosen._id, { ...form, calibratedBy: form.calibratedBy.trim(), certificateNumber: form.certificateNumber.trim() }, files[0]);
      onSaved(`Calibration logged for ${chosen.instrumentId}`);
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
      title="Schedule Calibration"
      subtitle="Record a completed calibration with its certificate"
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy} icon={<FiUpload size={14} />}>{busy ? 'Saving…' : 'Save Calibration'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        {instrument ? (
          <Field label="Instrument"><Input value={`${instrument.instrumentId} — ${instrument.instrumentName}`} disabled /></Field>
        ) : (
          <Field label="Instrument" required error={errors.instrument || pick.error}>
            <input
              className="form-input"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search instrument ID or name…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.85rem', marginBottom: 6 }}
            />
            <Choice
              value={chosen?._id || ''}
              onChange={(id) => {
                const row = pick.rows.find((r) => r._id === id) || null;
                setChosen(row);
                if (row && form.calibrationDate && !dueTouched) setForm((f) => ({ ...f, nextDue: suggestDue(f.calibrationDate, row) || f.nextDue }));
              }}
              placeholder={pick.loading ? 'Loading…' : 'Select an instrument'}
              options={pick.rows.map((r) => ({ value: r._id, label: `${r.instrumentId} — ${r.instrumentName}` }))}
              error={errors.instrument}
            />
          </Field>
        )}
        <TwoCol>
          <Field label="Calibration date" required error={errors.calibrationDate}>
            <DatePicker value={form.calibrationDate} onChange={(e) => onDate(e.target.value)} error={Boolean(errors.calibrationDate)} />
          </Field>
          <Field label="Next due" required error={errors.nextDue} help={chosen?.frequency ? `Suggested from the ${chosen.frequency.toLowerCase()} interval.` : undefined}>
            <DatePicker value={form.nextDue} onChange={(e) => { setDueTouched(true); set('nextDue', e.target.value); }} error={Boolean(errors.nextDue)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Calibrated by" required error={errors.calibratedBy}>
            <Input value={form.calibratedBy} onChange={(e) => set('calibratedBy', e.target.value)} placeholder="e.g. SGS Nigeria Calibration Lab" error={Boolean(errors.calibratedBy)} />
          </Field>
          <Field label="Certificate no" required error={errors.certificateNumber}>
            <Input value={form.certificateNumber} onChange={(e) => set('certificateNumber', e.target.value)} placeholder="e.g. MC-2026-4582" error={Boolean(errors.certificateNumber)} />
          </Field>
        </TwoCol>
        <div style={{ maxWidth: 280 }}>
          <Field label="Result" required error={errors.calibrationResult}>
            <Choice value={form.calibrationResult} onChange={(v) => set('calibrationResult', v)} options={RESULTS} />
          </Field>
        </div>
        <Field label="Calibration certificate (optional)">
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function HistoryTab({ record, refreshKey, canLog, onLog }) {
  const { data, error, loading } = useFetched(() => qualityCalibrationService.history(record._id), record._id, refreshKey);
  const [message, setMessage] = useState('');

  const download = async (row) => {
    setMessage('');
    const problem = await openSignedDownload(() => qualityCalibrationService.certificate(record._id, row._id));
    if (problem) setMessage(problem);
  };

  if (loading) return <Skeleton height={80} />;
  if (error) return <FormError message={error} />;
  if (!data.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '36px 0', textAlign: 'center' }}>
        <FiFileText size={24} color="#64748B" />
        <div style={{ fontWeight: 700, color: '#0F172A' }}>No Calibration History</div>
        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Full calibration history with certificates appears here.</div>
        {canLog && <PrimaryButton icon={<FiPlus size={14} />} onClick={onLog}>Schedule Calibration</PrimaryButton>}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SimpleTable
        columns={[
          { key: 'calibrationDate', label: 'Date', render: (r) => formatDate(r.calibrationDate) },
          { key: 'calibratedBy', label: 'Calibrated by' },
          { key: 'calibrationResult', label: 'Result', render: (r) => (r.calibrationResult === 'Pass' ? 'Passed' : 'Failed') },
          { key: 'certificateNumber', label: 'Certificate No.', render: (r) => <span style={{ color: '#2563EB' }}>{r.certificateNumber}</span> },
          { key: 'loggedByName', label: 'Logged By', render: (r) => r.loggedByName || '—' },
          {
            key: 'file',
            label: '',
            align: 'right',
            render: (r) => (r.hasCertificate ? (
              <button type="button" className="icon-btn" title="Download certificate" aria-label="Download certificate" onClick={() => download(r)} style={{ cursor: 'pointer', color: '#64748B' }}><FiDownload size={15} /></button>
            ) : <span style={{ color: '#CBD5E1' }}>—</span>),
          },
        ]}
        rows={data}
      />
      {message && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>{message}</span>}
      {canLog && <div><SecondaryButton icon={<FiPlus size={14} />} onClick={onLog}>Log another calibration</SecondaryButton></div>}
    </div>
  );
}

function ViewInstrumentModal({ id, refreshKey, canLog, onLog, onClose }) {
  const { record, error, loading } = useRecord(qualityCalibrationService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Drawer isOpen onClose={onClose} title="" width="660px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading instrument…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiList size={22} />} title={record.instrumentName} subtitle={`${record.type} • ${record.instrumentId}`} />
          <StatusLine status={<Status status={record.status} />} />
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Instrument ID', record.instrumentId],
                  ['Serial number', record.serialNumber],
                  ['Instrument name', record.instrumentName],
                  ['Type', record.type],
                  ['Manufacturer / model', record.manufacturerModel || '—'],
                  ['Storage location', nameOf(record.storageLocation)],
                  ['Custodian', nameOf(record.custodian)],
                  ['Calibration frequency', record.frequency],
                  ['Last calibrated', formatDate(record.lastCalibrated)],
                  ['Next due', formatDate(record.nextDue)],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              {record.description && <Panel title="Description">{record.description}</Panel>}
              {record.status === 'out_of_service' && <Panel title="Out of service" tone="red">{record.outOfServiceReason || 'No reason was recorded.'}</Panel>}
            </>
          )}
          {tab === 'history' && <HistoryTab key={`${record._id}-${refreshKey}`} record={record} refreshKey={refreshKey} canLog={canLog} onLog={() => onLog(record)} />}
        </div>
      )}
    </Drawer>
  );
}

export default function CalibrationRecords() {
  const { can } = usePermissions();
  const canLog = can('quality.calibrationrecord.update');
  const canExport = can('quality.calibrationrecord.export');

  const list = useProcList(qmsCalibrationSlice, { initialFilters: { status: '', type: '', dueFrom: '', dueTo: '' }, withStats: false });
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(qualityCalibrationService, list, selection, EXPORT_COLUMNS, 'calibration-records.csv');

  const [viewId, setViewId] = useState(null);
  const [logFor, setLogFor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const columns = [
    { key: 'instrumentId', label: 'INSTRUMENT ID', render: (v) => <span style={{ color: '#2563EB', fontWeight: 500 }}>{v}</span> },
    { key: 'instrumentName', label: 'NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'storageLocation', label: 'LOCATION', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'custodian', label: 'CUSTODIAN', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'lastCalibrated', label: 'LAST CALIBRATED', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'nextDue', label: 'NEXT DUE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <button type="button" className="icon-btn" title="View Instrument" aria-label="View instrument" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
      ),
    },
  ];

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected instruments exported` : 'Calibration records exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'type', label: 'Instrument type', options: INSTRUMENT_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'dueFrom', label: 'Next due from', type: 'date' },
    { key: 'dueTo', label: 'Next due to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Calibration Records" subtitle="Register of measuring and test instruments with calibration status">
        {canLog && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setLogFor('pick')}>Upload</SecondaryButton>}
      </PageHeader>

      <ListCard
        list={list}
        columns={columns}
        emptyText="No instruments found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by Instrument ID ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          />
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Instruments" subtitle="Narrow the register by status, type and next due date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {viewId && <ViewInstrumentModal id={viewId} refreshKey={refreshKey} canLog={canLog} onLog={(record) => setLogFor(record)} onClose={() => setViewId(null)} />}
      {logFor && (
        <LogCalibrationModal
          key={logFor === 'pick' ? 'pick' : logFor._id}
          instrument={logFor === 'pick' ? null : logFor}
          onClose={() => setLogFor(null)}
          onSaved={(message) => { setLogFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
    </div>
  );
}
