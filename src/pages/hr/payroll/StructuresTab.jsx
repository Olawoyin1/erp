import { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiEdit2, FiCopy, FiX, FiCheck, FiDownload, FiUpload, FiFilter } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select } from '../../../components/ui/FormField';
import { payrollService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { useServerList } from '../useServerList';
import { fieldErrorsOf, blobErrorMessage } from '../hrUtils';
import ImportDialog from '../ImportDialog';
import { money, parseNaira, koboToInput, grossOf, allowancesOf, exportCsv, fetchAllPages, primaryBtn, ghostBtn } from './payrollUtils';
import { RowMenu, SearchBox, TableSkeleton, LoadError, FormBanner, StatusPill } from './payrollParts';

const MONEY_FIELDS = [
  ['basicSalary', 'Basic salary (₦)', true], ['housingAllowance', 'Housing allowance (₦)'],
  ['transportAllowance', 'Transport allowance (₦)'], ['utilityAllowance', 'Utility allowance (₦)'],
  ['communicationAllowance', 'Communication allowance (₦)'], ['otherAllowances', 'Other allowances (₦)'],
  ['pensionDeduction', 'Pension deduction (₦)'], ['otherDeductions', 'Other deductions (₦)'],
];

function StructureModal({ editItem, levels, onClose, onSaved, showToast }) {
  const editing = !!editItem?._id;
  const [form, setForm] = useState(() => ({
    jobTitle: editItem?.jobTitle || '',
    level: editItem?.level || '',
    ...Object.fromEntries(MONEY_FIELDS.map(([key]) => [key, editItem ? koboToInput(editItem[key]) : ''])),
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const submit = async () => {
    setFormError('');
    const next = {};
    if (!form.jobTitle.trim()) next.jobTitle = 'Enter the job title';
    if (!form.level.trim()) next.level = 'Enter the level';
    const body = { jobTitle: form.jobTitle.trim(), level: form.level.trim() };
    MONEY_FIELDS.forEach(([key, , required]) => {
      const kobo = parseNaira(form[key]);
      if (kobo === null) next[key] = 'Use a plain naira amount such as 450000 or 450000.50';
      else if (required && (form[key] === '' || kobo === 0)) next[key] = 'Enter the basic salary';
      else body[key] = kobo;
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      if (editing) await payrollService.updateStructure(editItem._id, body);
      else await payrollService.createStructure(body);
      showToast(editing ? 'Salary structure updated' : 'Salary structure created', 'success');
      onSaved();
    } catch (err) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(err) }));
      setFormError(apiError(err, 'The salary structure could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? 'Edit Salary Definition' : 'Create Salary Definition'} maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormBanner message={formError} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Job title" required error={errors.jobTitle}>
            <Input value={form.jobTitle} error={!!errors.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="e.g. Managing Director" />
          </FormField>
          <FormField label="Level" required error={errors.level} helpText="Employees with this grade are paid from this structure">
            <Input list="payroll-levels" value={form.level} error={!!errors.level} onChange={(e) => set('level', e.target.value)} placeholder="e.g. EXD-01" />
            <datalist id="payroll-levels">{levels.map((l) => <option key={l} value={l} />)}</datalist>
          </FormField>
          {MONEY_FIELDS.map(([key, label, required]) => (
            <FormField key={key} label={label} required={required} error={errors[key]}>
              <Input inputMode="decimal" value={form[key]} error={!!errors[key]} onChange={(e) => set(key, e.target.value)} placeholder="0" />
            </FormField>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Salary Structure'}</button>
        </div>
      </div>
    </Modal>
  );
}

function StructureDrawer({ item, onClose }) {
  const rows = [
    ['Basic salary', item.basicSalary], ['Housing allowance', item.housingAllowance], ['Transport allowance', item.transportAllowance],
    ['Utility allowance', item.utilityAllowance], ['Communication allowance', item.communicationAllowance], ['Other allowances', item.otherAllowances],
  ];
  return (
    <Drawer isOpen onClose={onClose} title={item.jobTitle} subtitle={`${item.structureId} • Level ${item.level}`} width="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Status: <StatusPill status={item.status} /></div>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < rows.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: '0.85rem' }}>
              <span style={{ color: '#475569' }}>{label}</span><span style={{ fontWeight: 500 }}>{money(value || 0)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem' }}>
            <span>Gross salary</span><span>{money(grossOf(item))}</span>
          </div>
        </div>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
          {[['Pension deduction', item.pensionDeduction], ['Other deductions', item.otherDeductions]].map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none', fontSize: '0.85rem' }}>
              <span style={{ color: '#475569' }}>{label}</span><span style={{ fontWeight: 500 }}>{money(value || 0)}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>PAYE, statutory pension and NHF are computed at payslip time from the tax definitions and the statutory configuration; the deductions above are structure-level amounts.</p>
      </div>
    </Drawer>
  );
}

export default function StructuresTab({ showToast }) {
  const canCreate = usePermission('hr.payroll.create');
  const canUpdate = usePermission('hr.payroll.update');
  const list = useServerList(payrollService.listStructures, { status: '' }, { limit: 10 });
  const [drawer, setDrawer] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [levels, setLevels] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    payrollService.listStructures({ limit: 100 })
      .then((res) => { if (!cancelled) setLevels([...new Set((res.data?.data || []).map((s) => s.level))]); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [list.items]);

  const setStatus = async (item, status) => {
    try {
      await payrollService.setStructureStatus(item._id, status);
      showToast(`${item.jobTitle} is now ${status}`, 'success');
      list.reload();
    } catch (err) {
      showToast(apiError(err, 'The status could not be changed'), 'error');
    }
  };

  const duplicate = async (item) => {
    try {
      const res = await payrollService.duplicateStructure(item._id);
      showToast(`Copy created as ${res.data?.data?.structureId} (inactive until you activate it)`, 'success');
      list.reload();
    } catch (err) {
      showToast(apiError(err, 'The structure could not be duplicated'), 'error');
    }
  };

  const exportAll = async () => {
    try {
      const rows = await fetchAllPages((p) => payrollService.listStructures({ ...p, ...(list.activeSearch ? { q: list.activeSearch } : {}), ...(list.filters.status ? { status: list.filters.status } : {}) }));
      exportCsv('salary-structures.csv', [
        { label: 'Structure ID', value: (r) => r.structureId }, { label: 'Title', value: (r) => r.jobTitle }, { label: 'Level', value: (r) => r.level },
        { label: 'Gross salary (NGN)', value: (r) => (grossOf(r) / 100).toFixed(2) }, { label: 'Allowances (NGN)', value: (r) => (allowancesOf(r) / 100).toFixed(2) },
        { label: 'Deductions (NGN)', value: (r) => (((r.pensionDeduction || 0) + (r.otherDeductions || 0)) / 100).toFixed(2) }, { label: 'Status', value: (r) => r.status },
      ], rows);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const columns = [
    { key: 'structureId', label: 'STRUCTURE ID', render: (v) => <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> },
    { key: 'jobTitle', label: 'TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'level', label: 'LEVEL' },
    { key: 'g', label: 'GROSS SALARY', render: (_, r) => <span style={{ fontWeight: 600 }}>{money(grossOf(r))}</span> },
    { key: 'a', label: 'ALLOWANCES', render: (_, r) => money(allowancesOf(r)) },
    { key: 'd', label: 'DEDUCTIONS', render: (_, r) => money((r.pensionDeduction || 0) + (r.otherDeductions || 0)) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View" onClick={() => setViewItem(row)}><FiEye size={15} /></button>
          <RowMenu options={[
            ...(canUpdate ? [{ label: 'Edit Salary Structure', icon: FiEdit2, onClick: () => setDrawer({ item: row }) }] : []),
            ...(canCreate ? [{ label: 'Duplicate Salary Structure', icon: FiCopy, onClick: () => duplicate(row) }] : []),
            ...(canUpdate && row.status === 'active' ? [{ label: 'Deactivate Salary Structure', icon: FiX, color: '#DC2626', onClick: () => setStatus(row, 'inactive') }] : []),
            ...(canUpdate && row.status === 'inactive' ? [{ label: 'Activate Salary Structure', icon: FiCheck, color: '#059669', onClick: () => setStatus(row, 'active') }] : []),
          ]} />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="table-toolbar">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search title, level, id…" />
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" style={ghostBtn} onClick={() => setFilterOpen(true)}><FiFilter size={14} /> Filter{list.filters.status ? ' (1)' : ''}</button>
          <button className="btn btn-secondary" style={ghostBtn} onClick={exportAll}>Export <FiDownload size={14} /></button>
          {canCreate && <button className="btn btn-secondary" style={ghostBtn} onClick={() => setImportOpen(true)}>Upload <FiUpload size={14} /></button>}
          {canCreate && <button style={primaryBtn} onClick={() => setDrawer({ item: null })}><FiPlus size={14} /> Create Salary Definition</button>}
        </div>
      </div>
      {list.error ? <LoadError message={list.error} onRetry={list.hardReload} /> : list.loading ? <TableSkeleton cols={8} /> : (
        <DataTable columns={columns} data={list.items} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onSelectAll={() => setSelectedIds(selectedIds.length === list.items.length ? [] : list.items.map((r) => r._id))}
          emptyMessage={list.activeSearch || list.filters.status ? 'No salary structures match your search or filter.' : 'No salary structures yet.'} />
      )}
      {list.meta?.totalPages > 1 && <Pagination currentPage={list.page} totalPages={list.meta.totalPages} onPageChange={list.setPage} />}
      {drawer && <StructureModal editItem={drawer.item} levels={levels} showToast={showToast} onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); list.reload(); }} />}
      {importOpen && (
        <ImportDialog entity="salary-structures" title="Upload salary structures" description="Create many salary definitions from a CSV or Excel file. Amounts are in naira."
          onClose={() => setImportOpen(false)}
          onImported={(report) => { showToast(`${report.created} salary structure(s) imported`, 'success'); list.reload(); }} />
      )}
      {viewItem && <StructureDrawer item={viewItem} onClose={() => setViewItem(null)} />}
      {filterOpen && (
        <Drawer isOpen onClose={() => setFilterOpen(false)} title="Filter salary structures" width="360px">
          <FormField label="Status">
            <Select value={list.filters.status} onChange={(e) => { list.setFilters({ ...list.filters, status: e.target.value }); setFilterOpen(false); }}
              options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </FormField>
        </Drawer>
      )}
    </>
  );
}
