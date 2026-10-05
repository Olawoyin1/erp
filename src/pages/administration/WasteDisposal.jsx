import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockWasteDisposal } from '../../data/mockAdmin';

export default function WasteDisposal() {
  const [data] = useState(mockWasteDisposal);
  
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'WASTE TYPE' },
    { key: 'quantity', label: 'QUANTITY' },
    { key: 'contractor', label: 'CONTRACTOR' },
    { key: 'pickupDate', label: 'PICKUP DATE' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Waste & Disposal</h2>
        <button className="btn btn-primary"><FiPlus /> Schedule Disposal</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
