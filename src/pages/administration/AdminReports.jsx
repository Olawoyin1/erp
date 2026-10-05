import React from 'react';
import { FiDownload } from 'react-icons/fi';

export default function AdminReports() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Administration Reports</h2>
        <button className="btn btn-secondary"><FiDownload /> Export Summary</button>
      </div>
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <h3>Reports Module</h3>
        <p>Analytics and reporting charts for Administration will be displayed here.</p>
      </div>
    </div>
  );
}
