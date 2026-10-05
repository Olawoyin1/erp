import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { mockAdminTasks } from '../../data/mockAdmin';

export default function AdminTasks() {
  const [data] = useState(mockAdminTasks);
  
  const columns = [
    { key: 'id', label: 'TASK ID' },
    { key: 'title', label: 'TASK TITLE' },
    { key: 'assignee', label: 'ASSIGNEE' },
    { key: 'dueDate', label: 'DUE DATE' },
    { key: 'priority', label: 'PRIORITY' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Administration Tasks</h2>
        <button className="btn btn-primary"><FiPlus /> Create Task</button>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <DataTable columns={columns} data={data} keyField="id" />
      </div>
    </div>
  );
}
