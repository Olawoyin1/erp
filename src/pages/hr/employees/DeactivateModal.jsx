import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';

export default function DeactivateModal({ employee, onClose, onDeactivate }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeactivate(reason);
  };

  return (
    <Modal title="Deactivate Employee?" onClose={onClose} maxWidth="440px">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            This employee will lose access to the system and will no longer appear as an active employee.
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
              <strong>Employee:</strong> {employee.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              <strong>Employee ID:</strong> EMP-{employee.id.replace('PGSL-', '')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Deactivation</label>
            <textarea
              className="form-textarea"
              placeholder="Enter commentary..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-danger">
            ✕ Deactivate Employee
          </button>
        </div>
      </form>
    </Modal>
  );
}
