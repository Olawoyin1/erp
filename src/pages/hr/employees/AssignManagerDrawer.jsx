import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Drawer from '../../../components/ui/Drawer';
import { fetchEmployees, selectEmployees, selectEmployeesLoading } from '../../../store/hr/employeesSlice';

export default function AssignManagerDrawer({ isOpen, employee, onClose, onAssign }) {
  const dispatch = useDispatch();
  const allEmployees = useSelector(selectEmployees);
  const loading      = useSelector(selectEmployeesLoading);

  const [selectedId, setSelectedId] = useState('');

  // Load employees for the manager picker when drawer opens
  useEffect(() => {
    if (isOpen && allEmployees.length === 0) {
      dispatch(fetchEmployees({ page: 1, limit: 100 }));
    }
  }, [isOpen, dispatch, allEmployees.length]);

  // Pre-select the current manager
  useEffect(() => {
    if (employee) {
      const currentManagerId =
        typeof employee.reportingManagerId === 'object'
          ? employee.reportingManagerId?._id
          : employee.reportingManagerId;
      setSelectedId(currentManagerId || '');
    }
  }, [employee]);

  const handleSubmit = () => {
    if (!selectedId) return;
    onAssign(selectedId);
  };

  // Filter out the employee themselves from the picker
  const options = allEmployees.filter((e) => e._id !== employee?._id);

  const footer = (
    <>
      <button type="button" className="btn btn-secondary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
        onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
        disabled={!selectedId}
        onClick={handleSubmit}>
        Update Supervisor
      </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose}
      title="Assign Reporting Supervisor"
      subtitle={`Set direct reporting manager for ${employee?.fullName || 'employee'}`}
      width="420px" footer={footer}>
      <div className="form-group">
        <label className="form-label"
          style={{ marginBottom: '8px', display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>
          Reporting Manager <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={loading}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}>
          <option value="">Select manager…</option>
          {options.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.fullName} — {emp.position ?? ''}
            </option>
          ))}
        </select>
        {loading && (
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 6 }}>Loading employees…</p>
        )}
      </div>
    </Drawer>
  );
}
