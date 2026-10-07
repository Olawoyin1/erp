import React, { useState, useEffect } from 'react';
import Drawer from '../../../components/ui/Drawer';

const MANAGERS = [
  'Engr. Tunde Bello', 'Oluwatobi Ajeniya', 'Chidozie Godwin',
  'Saurusi Fareedah', 'Bamidele Olayiwola',
];

export default function AssignManagerDrawer({ isOpen, employee, onClose, onAssign }) {
  const [manager, setManager] = useState('');

  // Update local state when employee changes
  useEffect(() => {
    if (employee) {
      setManager(employee.manager || employee.reportingManager || '');
    }
  }, [employee]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onAssign(manager);
  };

  const footer = (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
        onClick={handleSubmit}
      >
        Update Supervisor
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Reporting Supervisor"
      subtitle={`Set direct operational reporting manager for ${employee?.name || 'Employee'}`}
      width="420px"
      footer={footer}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-group">
          <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>
            Reporting Manager <span className="required" style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            className="form-select"
            value={manager}
            onChange={e => setManager(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #E2E8F0',
              fontSize: '0.875rem',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              outline: 'none'
            }}
          >
            <option value="">Select manager</option>
            {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </form>
    </Drawer>
  );
}
