import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockAssets } from '../../data/mockAdmin';

export default function AssetSupplies() {
  const [data] = useState(mockAssets);
  
  const columns = [
    { key: 'id', label: 'ASSET ID' },
    { key: 'name', label: 'ASSET NAME' },
    { key: 'category', label: 'CATEGORY' },
    { key: 'location', label: 'LOCATION' },
    { key: 'condition', label: 'CONDITION' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Assets & Supplies</h2>
        <button className="btn btn-primary"><FiPlus /> Add Asset</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
