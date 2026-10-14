import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiX, FiCheck, FiDownload, FiFilter, FiTrash2 } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, DatePicker } from '../../../components/ui/FormField';
import { payrollService } from '../../../services/hr.service';
import { apiError, formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf } from '../hrUtils';
import { money, parseNaira, koboToInput, exportCsv, primaryBtn, ghostBtn } from './payrollUtils';
import { RowMenu, SearchBox, TableSkeleton, LoadError, FormBanner, StatusPill } from './payrollParts';

const rateText = (def) => (def.isProgressive ? 'Progressive' : `${def.flatPercentage ?? 0}%`);

function TaxDrawer({ editItem, onClose, onSaved, showToast }) {
  const editing = !!editItem?._id;
  const [form, setForm] = useState(() => ({
    taxType: editItem?.taxType || '',
    isProgressive: editItem?.isProgressive ?? false,
    flatPercentage: editItem?.flatPercentage != null ? String(editItem.flatPercentage) : '',
    effectiveDate: editItem?.effectiveDate ? String(editItem.effectiveDate).slice(0, 10) : '',
  }));
  const [brackets, setBrackets] = useState(() => (editItem?.brackets?.length
    ? editItem.brackets.map((b) => ({ upTo: b.upToAmount == null ? '' : koboToInput(b.upToAmount), rate: String(b.ratePercent) }))
    : [{ upTo: '', rate: '' }]));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const setBracket = (i, k, v) => { setBrackets((b) => b.map((row, idx) => (idx === i ? { ...row, [k]: v } : row))); setErrors((e) => ({ ...e, brackets: undefined })); };

  const submit = async () => {
    setFormError('');
    const next = {};
    if (!form.taxType.trim()) next.taxType = 'Enter the tax type';
    if (!form.effectiveDate) next.effectiveDate = 'Choose the effective date';
    const body = { taxType: form.taxType.trim(), isProgressive: form.isProgressive, effectiveDate: form.effectiveDate };
    if (form.isProgressive) {
      const parsed = brackets.map((b, i) => ({ upTo: b.upTo === '' ? null : parseNaira(b.upTo), rate: b.rate === '' ? NaN : Number(b.rate), last: i === brackets.length - 1 }));
      if (parsed.some((b) => b.upTo === undefined || (b.upTo !== null && b.upTo <= 0) || Number.isNaN(b.rate) || b.rate < 0)) next.brackets = 'Every bracket needs a rate, and each ceiling must be a plain naira amount';
      else if (parsed.slice(0, -1).some((b) => b.upTo === null)) next.brackets = 'Only the last bracket can have no ceiling';
      else if (parsed[parsed.length - 1].upTo !== null) next.brackets = 'Leave the ceiling of the last bracket empty (it applies to everything above)';
      else if (parsed.slice(0, -1).some((b, i, all) => i > 0 && b.upTo <= all[i - 1].upTo)) next.brackets = 'Ceilings must increase from one bracket to the next';
      body.brackets = parsed.map((b) => ({ upToAmount: b.upTo, ratePercent: b.rate }));
    } else {
      const pct = Number(form.flatPercentage);
      if (form.flatPercentage === '' || Number.isNaN(pct) || pct < 0) next.flatPercentage = 'Enter the percentage';
      body.flatPercentage = pct;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      if (editing) await payrollService.updateTaxDef(editItem._id, body);
      else await payrollService.createTaxDef(body);
      showToast(editing ? 'Tax definition updated' : 'Tax definition created', 'success');
      onSaved();
    } catch (err) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(err) }));
      setFormError(apiError(err, 'The tax definition could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title={editing ? 'Edit Tax Definition' : 'Create Tax Definition'} width="560px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save Tax Definition'}</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormBanner message={formError} />
        <FormField label="Tax type" required error={errors.taxType}>
          <Input value={form.taxType} error={!!errors.taxType} onChange={(e) => set('taxType', e.target.value)} placeholder="e.g. PAYE" />
        </FormField>
        <FormField label="Calculation">
          <Select value={form.isProgressive ? 'progressive' : 'flat'} onChange={(e) => set('isProgressive', e.target.value === 'progressive')}
            options={[{ value: 'flat', label: 'Flat percentage' }, { value: 'progressive', label: 'Progressive brackets' }]} />
        </FormField>
        {form.isProgressive ? (
          <FormField label="Brackets" required error={errors.brackets} helpText="Each ceiling is the cumulative amount (₦) up to which the rate applies; the last bracket covers everything above">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {brackets.map((b, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 32px', gap: 8, alignItems: 'center' }}>
                  <Input inputMode="decimal" value={b.upTo} onChange={(e) => setBracket(i, 'upTo', e.target.value)}
                    placeholder={i === brackets.length - 1 ? 'Everything above (leave empty)' : 'Up to (₦)'} />
                  <Input inputMode="decimal" value={b.rate} onChange={(e) => setBracket(i, 'rate', e.target.value)} placeholder="Rate %" />
                  <button type="button" className="icon-btn" disabled={brackets.length === 1} onClick={() => setBrackets((rows) => rows.filter((_, idx) => idx !== i))}><FiTrash2 size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setBrackets((rows) => [...rows, { upTo: '', rate: '' }])}><FiPlus size={13} /> Add bracket</button>
            </div>
          </FormField>
        ) : (
          <FormField label="Percentage value (%)" required error={errors.flatPercentage}>
            <Input inputMode="decimal" value={form.flatPercentage} error={!!errors.flatPercentage} onChange={(e) => set('flatPercentage', e.target.value)} placeholder="e.g. 2.5" />
          </FormField>
        )}
        <FormField label="Effective date" required error={errors.effectiveDate}>
          <DatePicker value={form.effectiveDate} error={!!errors.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} />
        </FormField>
      </div>
    </Drawer>
  );
}

export default function TaxDefsTab({ showToast }) {
  const canCreate = usePermission('hr.payroll.create');
  const canUpdate = usePermission('hr.payroll.update');
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    payrollService.listTaxDefs()
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Failed to load tax definitions') }); });
    return () => { cancelled = true; };
  }, [attempt]);

  const reload = () => setAttempt((n) => n + 1);

  const toggle = async (def, next) => {
    try {
      await payrollService.updateTaxDef(def._id, { status: next });
      showToast(`${def.taxType} marked ${next}`, 'success');
      reload();
    } catch (err) {
      showToast(apiError(err, 'The status could not be changed'), 'error');
    }
  };

  const q = search.trim().toLowerCase();
  const rows = state.items.filter((d) => (!q || d.taxType.toLowerCase().includes(q)) && (!status || d.status === status));

  const columns = [
    { key: 'taxType', label: 'TAX TYPE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'v', label: 'PERCENTAGE VALUE', render: (_, r) => rateText(r) },
    { key: 'effectiveDate', label: 'EFFECTIVE DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          {canUpdate && <button className="icon-btn" title="Edit" onClick={() => setDrawer({ item: row })}><FiEdit2 size={15} /></button>}
          <RowMenu options={canUpdate ? [row.status === 'active'
            ? { label: 'Mark as Inactive', icon: FiX, color: '#DC2626', onClick: () => toggle(row, 'inactive') }
            : { label: 'Mark as Active', icon: FiCheck, color: '#059669', onClick: () => toggle(row, 'active') }] : []} />
        </div>
      ),
    },
  ];

  const exportAll = () => exportCsv('tax-definitions.csv', [
    { label: 'Tax type', value: (r) => r.taxType }, { label: 'Value', value: (r) => rateText(r) },
    { label: 'Brackets', value: (r) => (r.brackets || []).map((b) => `${b.upToAmount == null ? 'above' : `up to ${money(b.upToAmount)}`} at ${b.ratePercent}%`).join('; ') },
    { label: 'Effective date', value: (r) => formatDate(r.effectiveDate) }, { label: 'Status', value: (r) => r.status },
  ], rows);

  return (
    <>
      <div className="table-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search tax type…" />
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" style={ghostBtn} onClick={() => setFilterOpen(true)}><FiFilter size={14} /> Filter{status ? ' (1)' : ''}</button>
          <button className="btn btn-secondary" style={ghostBtn} onClick={exportAll}>Export <FiDownload size={14} /></button>
          {canCreate && <button style={primaryBtn} onClick={() => setDrawer({ item: null })}><FiPlus size={14} /> Create Tax Definition</button>}
        </div>
      </div>
      {state.error ? <LoadError message={state.error} onRetry={() => { setState((s) => ({ ...s, loading: true, error: '' })); reload(); }} /> : state.loading ? <TableSkeleton cols={5} /> : (
        <DataTable columns={columns} data={rows} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onSelectAll={() => setSelectedIds(selectedIds.length === rows.length ? [] : rows.map((r) => r._id))}
          emptyMessage={q || status ? 'No tax definitions match your search or filter.' : 'No tax definitions yet. Payroll cannot be generated without an active PAYE definition.'} />
      )}
      {drawer && <TaxDrawer editItem={drawer.item} showToast={showToast} onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); reload(); }} />}
      {filterOpen && (
        <Drawer isOpen onClose={() => setFilterOpen(false)} title="Filter tax definitions" width="360px">
          <FormField label="Status">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setFilterOpen(false); }}
              options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </FormField>
        </Drawer>
      )}
    </>
  );
}
