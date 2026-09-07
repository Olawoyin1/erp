import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';

const MANAGERS = [
  'Engr. Tunde Bello', 'Oluwatobi Ajeniya', 'Chidozie Godwin',
  'Saurusi Fareedah', 'Bamidele Olayiwola',
];

export default function AssignManagerModal({ employee, onClose, onAssign }) {
  const [manager, setManager] = useState(employee.manager || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(manager);
  };

  return (
    <Modal title="Assign Reporting Supervisor" onClose={onClose} maxWidth="420px">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Set direct operational reporting manager for {employee.name}
          </p>
          <div className="form-group">
            <label className="form-label">Reporting Manager <span className="required">*</span></label>
            <select
              className="form-select"
              value={manager}
              onChange={e => setManager(e.target.value)}
              required
            >
              <option value="">Select manager</option>
              {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Update Supervisor</button>
        </div>
      </form>
    </Modal>
  );
}
