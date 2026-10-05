import React, { useState } from 'react';
import { FiFolderPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import { mockEDMS } from '../../data/mockAdmin';

export default function EDMS() {
  const [data] = useState(mockEDMS);
  
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'filename', label: 'FILE NAME' },
    { key: 'category', label: 'CATEGORY' },
    { key: 'accessLevel', label: 'ACCESS LEVEL' },
    { key: 'date', label: 'DATE' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>EDMS</h2>
        <button className="btn btn-primary"><FiFolderPlus /> Upload to EDMS</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
