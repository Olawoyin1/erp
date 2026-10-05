import React, { useState } from 'react';
import { FiPlus, FiFilter, FiDownload, FiCheckCircle } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockAdminRequests } from '../../data/mockAdmin';

export default function AdministrativeRequests() {
  const [data] = useState(mockAdminRequests);
  
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'REQUEST TITLE' },
    { key: 'requester', label: 'REQUESTER' },
    { key: 'dept', label: 'DEPARTMENT' },
    { key: 'date', label: 'DATE' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Administrative Requests</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary"><FiPlus /> New Request</button>
        </div>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
