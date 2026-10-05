import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockCorrespondence } from '../../data/mockAdmin';

export default function Memos() {
  const [data] = useState(mockCorrespondence);
  
  const columns = [
    { key: 'id', label: 'MEMO ID' },
    { key: 'subject', label: 'SUBJECT' },
    { key: 'from', label: 'FROM' },
    { key: 'to', label: 'TO' },
    { key: 'date', label: 'DATE' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Memos & Correspondence</h2>
        <button className="btn btn-primary"><FiPlus /> Compose Memo</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
