import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockMaintenanceLog } from '../../data/mockAdmin';

export default function FacilityMaintenance() {
  const [data] = useState(mockMaintenanceLog);
  
  const columns = [
    { key: 'id', label: 'LOG ID' },
    { key: 'vehicle', label: 'ASSET/FACILITY' },
    { key: 'type', label: 'MAINTENANCE TYPE' },
    { key: 'date', label: 'DATE' },
    { key: 'cost', label: 'COST' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Facility Maintenance</h2>
        <button className="btn btn-primary"><FiPlus /> Log Maintenance</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
