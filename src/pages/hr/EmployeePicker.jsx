import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { employeeService } from '../../services/hr.service';
import { apiError } from '../../services/apiHelpers';

/**
 * Searchable employee select backed by `GET /employees?q=` (needs hr.employee.view).
 * `value` is the employee _id; `selected` is the employee object already known (so the label shows
 * without a fetch). `onChange(id, employee)` fires with ('', null) when cleared.
 */
export default function EmployeePicker({
  value,
  selected,
  onChange,
  placeholder = 'Search employee by name or ID…',
  disabled = false,
  error = false,
  params,
  excludeIds = [],
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [state, setState] = useState({ results: [], loading: false, error: '' });
  const wrapRef = useRef(null);
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, loading: true, error: '' }));
      employeeService
        .list({ limit: 20, ...(term.trim() ? { q: term.trim() } : {}), ...JSON.parse(paramsKey) })
        .then((res) => { if (!cancelled) setState({ results: res.data?.data || [], loading: false, error: '' }); })
        .catch((err) => { if (!cancelled) setState({ results: [], loading: false, error: apiError(err, 'Could not load employees') }); });
    }, term ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, term, paramsKey]);

  const label = selected ? `${selected.fullName}${selected.employeeId ? ` (${selected.employeeId})` : ''}` : '';
  const visible = state.results.filter((e) => !excludeIds.includes(e._id));

  const pick = (employee) => {
    onChange(employee._id, employee);
    setOpen(false);
    setTerm('');
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => { if (!disabled) setOpen(true); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
          border: error ? '1.5px solid #DC2626' : open ? '1.5px solid #1D4ED8' : '1px solid #E2E8F0',
          backgroundColor: disabled ? '#F1F5F9' : open ? '#fff' : '#F8FAFC', cursor: disabled ? 'not-allowed' : 'text',
          boxShadow: open ? '0 0 0 3px rgba(29, 78, 216, 0.12)' : 'none',
        }}
      >
        <FiSearch size={14} color="#94A3B8" />
        {open ? (
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={label || placeholder}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '0.85rem', fontFamily: 'var(--font)', minWidth: 0 }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '0.85rem', color: label ? '#0F172A' : '#94A3B8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label || placeholder}
          </span>
        )}
        {value && !disabled && (
          <button type="button" title="Clear" onClick={(e) => { e.stopPropagation(); onChange('', null); }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 0 }}>
            <FiX size={14} />
          </button>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1050, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)', maxHeight: 260, overflowY: 'auto' }}>
          {state.loading && <div style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#94A3B8' }}>Searching…</div>}
          {!state.loading && state.error && <div style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#B91C1C' }}>{state.error}</div>}
          {!state.loading && !state.error && visible.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#94A3B8' }}>No employees found.</div>
          )}
          {!state.loading && visible.map((employee) => (
            <div key={employee._id} onClick={() => pick(employee)} className="menu-item-hover"
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{employee.fullName}</span>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{employee.employeeId}{employee.position ? ` · ${employee.position}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
