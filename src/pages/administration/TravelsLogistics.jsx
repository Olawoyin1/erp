import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockFleet } from '../../data/mockAdmin';

export default function TravelsLogistics() {
  const [data] = useState(mockFleet);
  
  const columns = [
    { key: 'id', label: 'FLEET ID' },
    { key: 'plateNo', label: 'PLATE NO' },
    { key: 'model', label: 'VEHICLE MODEL' },
    { key: 'driver', label: 'DRIVER' },
    { key: 'mileage', label: 'MILEAGE' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Travels & Logistics</h2>
        <button className="btn btn-primary"><FiPlus /> Request Vehicle</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
