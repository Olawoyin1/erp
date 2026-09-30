import React from 'react';
import { FiDownload } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';

const mockReports = [
  { project: 'Chevron Wellhead Upgrade', client: 'Chevron Nigeria', physical: '80%', financial: '80%', flag: 'High', status: 'At Risk' },
  { project: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', physical: '80%', financial: '80%', flag: 'None', status: 'In Progress' },
  { project: 'TotalEnergies Earthing Installation', client: 'TotalEnergies', physical: '80%', financial: '80%', flag: 'Medium', status: 'On Hold' },
  { project: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', physical: '80%', financial: '80%', flag: 'Medium', status: 'Completed' },
  { project: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', physical: '80%', financial: '80%', flag: 'Medium', status: 'In Progress' },
];

function StatusPill({ status }) {
  const colors = {
    'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
    'At Risk': { bg: '#FEF3C7', color: '#D97706' },
    'On Hold': { bg: '#FEF3C7', color: '#D97706' },
    'Completed': { bg: '#D1FAE5', color: '#059669' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
}

export default function TechnicalReports() {
  const columns = [
    { key: 'project', label: 'PROJECT NAME', render: v => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'client', label: 'CLIENT', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'physical', label: '% PHYSICAL' },
    { key: 'financial', label: '% FINANCIAL' },
    { key: 'flag', label: 'DIVERGENCE FLAG', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports - Technical</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>review, and export technical and project performance reports across all projects</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'ACTIVE PROJECTS', value: '24', sub: '+3 this month', color: '#DBEAFE' },
          { label: 'BUDGET UTILIZATION', value: '#482M / ₦615M', sub: '78% utilized', color: '#F3E8FF' },
          { label: 'ACTIVE RESOURCES', value: '128', sub: 'Currently allocated', color: '#D1FAE5' },
          { label: 'OPEN TECHNICAL ISSSUES', value: '18', sub: 'Requiring attention', color: '#FEF3C7' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: s.color }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Physical Progress vs Planned Progress</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.8rem', color: '#64748B' }}>
            <span><span style={{ color: '#3B82F6' }}>●</span> Physical Progress (%) - 68%</span>
            <span><span style={{ color: '#EF4444' }}>●</span> Financial Progress (%) - 42%</span>
          </div>
          {/* Simple line chart mockup */}
          <div style={{ height: '200px', position: 'relative', borderLeft: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
            {['0%', '25%', '50%', '75%', '100%'].map((v, i) => (
              <div key={i} style={{ position: 'absolute', left: '0', right: '0', bottom: `${i * 25}%`, borderTop: '1px dashed #F1F5F9', fontSize: '0.65rem', color: '#CBD5E1', paddingLeft: '4px' }}>{v}</div>
            ))}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <polyline points="0,100 60,160 120,90 180,110 240,120 300,70" fill="none" stroke="#3B82F6" strokeWidth="2" />
              <polyline points="0,130 60,110 120,140 180,100 240,130 300,100" fill="none" stroke="#EF4444" strokeWidth="2" />
            </svg>
            <div style={{ position: 'absolute', bottom: '-20px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
              {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Budget vs Actual Cost</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: '#64748B' }}>Compare planned budget against actual project expenditure</p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.8rem' }}>
            <span><span style={{ color: '#EF4444' }}>■</span> Budget</span>
            <span><span style={{ color: '#1D4ED8' }}>■</span> Actual Cost</span>
          </div>
          <div style={{ height: '170px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            {[40, 80, 120, 170, 60, 140].map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                <div style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: '4px 4px 0 0', height: `${(v / 200) * 100}%` }} />
                <div style={{ flex: 1, backgroundColor: '#1D4ED8', borderRadius: '4px 4px 0 0', height: `${(v * 0.7 / 200) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <DataTable columns={columns} data={mockReports} keyField="project" emptyMessage="No reports found." />
      </div>
    </div>
  );
}
