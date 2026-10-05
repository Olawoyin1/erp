import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import { mockAdminDocuments } from '../../data/mockAdmin';

export default function Documents() {
  const [data] = useState(mockAdminDocuments);
  
  const columns = [
    { key: 'id', label: 'DOC ID' },
    { key: 'name', label: 'DOCUMENT NAME' },
    { key: 'type', label: 'TYPE' },
    { key: 'size', label: 'SIZE' },
    { key: 'date', label: 'DATE UPLOADED' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Documents</h2>
        <button className="btn btn-primary"><FiPlus /> Upload Document</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
