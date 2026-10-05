import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiGrid, FiList } from 'react-icons/fi';
import { mockAdminTasks, mockAdminTaskStats } from '../../data/mockAdmin';

const priorityStyle = {
  'High':   { bg: '#FEE2E2', color: '#DC2626' },
  'Medium': { bg: '#FEF3C7', color: '#B45309' },
  'Low':    { bg: '#F0FDF4', color: '#15803D' },
  'Hot':    { bg: '#FEE2E2', color: '#7C2D12' },
};

const statusStyle = {
  'To Do':      { bg: '#F1F5F9', color: '#475569' },
  'In Progress':{ bg: '#FEF9C3', color: '#854D0E' },
  'Done':       { bg: '#DCFCE7', color: '#15803D' },
  'Overdue':    { bg: '#FEE2E2', color: '#DC2626' },
};

export default function AdminTasks() {
  const [search, setSearch] = useState('');
  const filtered = mockAdminTasks.filter(t =>
    t.task.toLowerCase().includes(search.toLowerCase()) ||
    t.assignedTo.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'TOTAL TASKS', value: mockAdminTaskStats.total, sub: 'All assigned activities', icon: '📄' },
    { label: 'IN PROGRESS', value: mockAdminTaskStats.inProgress, sub: 'Currently being worked on', icon: '📋' },
    { label: 'DUE THIS WEEK', value: mockAdminTaskStats.dueThisWeek, sub: 'Upcoming deadlines', icon: '📅' },
    { label: 'OVERDUE TASKS', value: mockAdminTaskStats.overdue, sub: 'Past due date', icon: '⚠️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks — Administration</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Operational tasks across admin functions</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> Task
          </button>
          <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <button style={{ padding: '8px 12px', background: '#F8FAFC', border: 'none', cursor: 'pointer', color: '#64748B' }}><FiGrid size={15} /></button>
            <button style={{ padding: '8px 12px', background: '#1E3A5F', border: 'none', cursor: 'pointer', color: '#fff' }}><FiList size={15} /></button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ width: 36, padding: '12px 16px' }}><input type="checkbox" /></th>
              {['TASK ID', 'TASK', 'ASSIGNED TO', 'RELATED TO', 'PRIORITY', 'DUE DATE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '13px 16px' }}><input type="checkbox" /></td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#3B82F6', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.id}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#0F172A', maxWidth: 260 }}>{r.task}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#64748B' }}>{r.assignedTo}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#64748B' }}>{r.relatedTo}</td>
                <td style={{ padding: '13px 12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: priorityStyle[r.priority]?.bg || '#F1F5F9', color: priorityStyle[r.priority]?.color || '#64748B' }}>{r.priority}</span>
                </td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#64748B' }}>{r.dueDate}</td>
                <td style={{ padding: '13px 12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: statusStyle[r.status]?.bg || '#F1F5F9', color: statusStyle[r.status]?.color || '#64748B' }}>{r.status}</span>
                </td>
                <td style={{ padding: '13px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiEye size={16} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiMoreVertical size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Page 1 of 8</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1,2,3,4,5,6].map(p => (
              <button key={p} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #E2E8F0', background: p === 1 ? '#1E3A5F' : '#fff', color: p === 1 ? '#fff' : '#374151', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
