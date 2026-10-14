import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Select } from '../../components/ui/FormField';
import { employeeService } from '../../services/hr.service';
import { apiError } from '../../services/apiHelpers';

/**
 * Searchable, department-filterable checklist of employees (`GET /employees`).
 * `selected` is a `{ [id]: employee }` map owned by the parent; `disabledIds` are shown ticked and locked.
 */
export default function MultiEmployeePicker({ selected, onChange, disabledIds = [], activeOnly = true, maxHeight = 260 }) {
  const [term, setTerm] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const timer = useRef(null);
  const [query, setQuery] = useState({ q: '', departmentId: '' });

  useEffect(() => {
    let cancelled = false;
    employeeService.lookups()
      .then((res) => { if (!cancelled) setDepartments(res.data?.data?.departments || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    employeeService.list({ limit: 100, ...(activeOnly ? { activeOnly: 'true' } : {}), ...(query.q ? { q: query.q } : {}), ...(query.departmentId ? { departmentId: query.departmentId } : {}) })
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Could not load employees') }); });
    return () => { cancelled = true; };
  }, [query, activeOnly]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onSearch = (value) => {
    setTerm(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setState((s) => ({ ...s, loading: true })); setQuery((q) => ({ ...q, q: value.trim() })); }, 300);
  };

  const onDepartment = (value) => {
    setDepartment(value);
    setState((s) => ({ ...s, loading: true }));
    setQuery((q) => ({ ...q, departmentId: value }));
  };

  const selectable = state.items.filter((e) => !disabledIds.includes(e._id));
  const toggle = (employee) => {
    const next = { ...selected };
    if (next[employee._id]) delete next[employee._id]; else next[employee._id] = employee;
    onChange(next);
  };
  const selectAll = () => {
    const next = { ...selected };
    selectable.forEach((e) => { next[e._id] = e; });
    onChange(next);
  };
  const count = Object.keys(selected).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={term} onChange={(e) => onSearch(e.target.value)} placeholder="Search employee name, id…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
        </div>
        <Select value={department} searchable placeholder="All Departments" onChange={(e) => onDepartment(e.target.value)}
          options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]} />
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: '0.8rem' }}>
        <button type="button" onClick={selectAll} style={{ background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0 }}>Select All</button>
        <button type="button" onClick={() => onChange({})} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>Clear</button>
        <span style={{ marginLeft: 'auto', color: '#64748B' }}>{count} selected</span>
      </div>
      <div style={{ border: '1px solid #F1F5F9', borderRadius: 8, maxHeight, overflowY: 'auto' }}>
        {state.loading && <div style={{ padding: 14, fontSize: '0.8rem', color: '#94A3B8' }}>Loading…</div>}
        {!state.loading && state.error && <div style={{ padding: 14, fontSize: '0.8rem', color: '#B91C1C' }}>{state.error}</div>}
        {!state.loading && !state.error && state.items.length === 0 && <div style={{ padding: 14, fontSize: '0.8rem', color: '#94A3B8' }}>No employees found.</div>}
        {!state.loading && state.items.map((e) => {
          const locked = disabledIds.includes(e._id);
          const checked = locked || !!selected[e._id];
          return (
            <div key={e._id} onClick={() => { if (!locked) toggle(e); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #F1F5F9', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.55 : 1 }}>
              <input type="checkbox" checked={checked} readOnly style={{ width: 15, height: 15, accentColor: '#1D4ED8' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{e.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{e.position} &bull; {e.employeeId}</div>
              </div>
              {e.departmentId?.name && <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 12, backgroundColor: '#F1F5F9', color: '#475569' }}>{e.departmentId.name}</span>}
              {locked && <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Enrolled</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
