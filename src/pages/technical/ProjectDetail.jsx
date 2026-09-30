import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiShare2, FiDownload, FiPlus, FiSearch, FiFilter, FiEye, FiMoreVertical, FiCheck, FiX, FiUpload } from 'react-icons/fi';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import Drawer from '../../components/ui/Drawer';
import FileUpload from '../../components/ui/FileUpload';
import {
  mockProjectDetail, mockWBSActivities, mockSiteInspections, mockProjectTasks,
  mockProgressLogs, mockResourceRequests, mockSiteDiary, mockTimesheets,
  mockProjectDocuments, mockSitePhotos
} from '../../data/mockTechnical';

const TABS = ['Overview', 'Site Inspection', 'WBS', 'Gantt Chart', 'Tasks', 'Progress Tracking', 'Resource Allocation', 'Site Diary', 'Timesheets', 'Documents'];

function StatusPill({ status, size = 'sm' }) {
  const colors = {
    'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
    'On Hold': { bg: '#FED7AA', color: '#EA580C' },
    'Completed': { bg: '#D1FAE5', color: '#059669' },
    'At Risk': { bg: '#FEF3C7', color: '#D97706' },
    'Delayed': { bg: '#FEE2E2', color: '#DC2626' },
    'Pending': { bg: '#F1F5F9', color: '#64748B' },
    'Not Started': { bg: '#F1F5F9', color: '#64748B' },
    'Submitted': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Approved': { bg: '#D1FAE5', color: '#059669' },
    'Rejected': { bg: '#FEE2E2', color: '#DC2626' },
    'Signed Off': { bg: '#D1FAE5', color: '#059669' },
    'Monitoring': { bg: '#FEF3C7', color: '#D97706' },
    'Resolved': { bg: '#D1FAE5', color: '#059669' },
    'Mitigated': { bg: '#D1FAE5', color: '#059669' },
    'Open': { bg: '#FEF3C7', color: '#D97706' },
    'Issued': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Technical Reviewing': { bg: '#EDE9FE', color: '#7C3AED' },
    'Technical Approved': { bg: '#D1FAE5', color: '#059669' },
    'Store Reviewing': { bg: '#FEF9C3', color: '#92400E' },
    'Returned': { bg: '#FEE2E2', color: '#DC2626' },
    'Unavailable': { bg: '#F1F5F9', color: '#64748B' },
    'Cancelled': { bg: '#F1F5F9', color: '#64748B' },
    'Rejected by Technical': { bg: '#FEE2E2', color: '#DC2626' },
    'Under Review': { bg: '#FEF3C7', color: '#92400E' },
    'Checked': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Sent to Client': { bg: '#EDE9FE', color: '#7C3AED' },
    'On Track': { bg: '#D1FAE5', color: '#059669' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: size === 'lg' ? '4px 12px' : '3px 10px', borderRadius: '12px', fontSize: size === 'lg' ? '0.85rem' : '0.75rem', fontWeight: 600 }}>{status}</span>;
}

// ─── OVERVIEW TAB ───────────────────────────────────────────────────────────────
function OverviewTab({ project }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {[
            { label: 'PHYSICAL PROGRESS', value: `${project.physicalProgress}%`, sub: 'Overall project completion', color: '#10B981' },
            { label: 'BUDGET UTILIZATION', value: `${project.budgetUtilization}%`, sub: `₦85M of ₦100M used`, color: '#3B82F6' },
            { label: 'OPEN WORK ORDERS', value: project.openWorkOrders, sub: 'Pending execution', color: '#F59E0B' },
            { label: 'OPEN RISKS', value: project.openRisks, sub: 'Require attention', color: '#EF4444' },
            { label: 'NEXT MILESTONE', value: project.nextMilestone, sub: 'Client Inspection', color: '#6366F1' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 }}>{s.label}</span>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Project Info */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>Project Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              ['PROJECT ID', project.id], ['PROJECT NAME', project.name], ['CLIENT', project.client],
              ['CLIENT EMAIL', project.clientEmail], ['PROJECT TYPE', project.projectType], ['CONTRACT TYPE', project.contractType],
              ['LOCATION', project.location], ['PROJECT MANAGER', project.manager], ['TECHNICAL LEAD', project.technicalLead],
              ['START DATE', project.startDate], ['PLANNED COMPLETION', project.plannedCompletion], ['STATUS', project.status],
            ].map(([label, val], i) => (
              <div key={i}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{val}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>BUDGET</div>
              <div style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: 500 }}>{project.budget}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>PROJECT DESCRIPTION & SCOPE</div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>{project.description}</p>
        </div>

        {/* Key Engineering Milestones */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Key Engineering Milestones</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>5 deliverables</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {project.milestones.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{m.date}</div>
                  </div>
                  <StatusPill status={m.status} />
                </div>
                <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.progress}%`, backgroundColor: m.status === 'Completed' ? '#10B981' : m.status === 'In Progress' ? '#3B82F6' : '#E2E8F0', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Financial Budget Summary */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Financial Budget Summary</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: '#64748B' }}>Track approved budgets and spending</p>
          <div style={{ backgroundColor: '#1D4ED8', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '8px' }}>TOTAL APPROVED CAPE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{project.totalApprovedCAPEX}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Authorised Budget: {project.id}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>TOTAL DISBURSED</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{project.totalDisbursed}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>LIQUID RESERVE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{project.liquidReserve}</div>
            </div>
          </div>
          <div style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>FINANCIAL STATUS</span>
              <StatusPill status={project.financialStatus} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Calculated from physical progress (60%) versus financial burn rate (62%)</div>
          </div>
        </div>

        {/* Assigned Team */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Assigned Team</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: '#64748B' }}>Key personnel responsible for project delivery</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.team.map((member, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: `hsl(${i * 50}, 60%, 85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, color: `hsl(${i * 50}, 60%, 35%)`, flexShrink: 0 }}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{member.department}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WBS TAB ─────────────────────────────────────────────────────────────────
function WBSTab() {
  const [data] = useState(mockWBSActivities);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = data.filter(d => !search || d.activity.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="table-toolbar">
        <div className="table-toolbar-search">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..." style={{ paddingLeft: '36px', width: '100%' }} />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
        </div>
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Add Activity</button>
        </div>
      </div>

      <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, width: '32px' }}><input type="checkbox" /></th>
              {['WBS CODE', 'ACTIVITY', 'PHASE', 'ASSIGNED TO', 'PROGRESS', 'START DATE', 'END DATE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px' }}><input type="checkbox" /></td>
                <td style={{ padding: '12px 16px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {row.isCritical && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />}
                  {row.isMilestone && !row.isCritical && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }} />}
                  {row.wbsCode}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: row.type === 'parent' ? 600 : 400, color: '#0F172A', paddingLeft: row.type === 'grandchild' ? '48px' : row.type === 'child' ? '32px' : '16px' }}>{row.activity}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{row.phase}</td>
                <td style={{ padding: '12px 16px', color: '#334155' }}>{row.assignedTo}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px' }}>
                      <div style={{ width: `${row.progress}%`, height: '100%', backgroundColor: row.status === 'Completed' ? '#10B981' : '#3B82F6', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{row.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{row.startDate}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{row.endDate}</td>
                <td style={{ padding: '12px 16px' }}><StatusPill status={row.status} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="icon-btn"><FiEye size={14} /></button>
                    <button className="icon-btn"><FiMoreVertical size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748B' }}>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', marginRight: '4px' }} />Milestone Marker</span>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginRight: '4px' }} />Critical Path</span>
        </div>
      </div>

      <Drawer isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Activity" width="480px">
        <p style={{ margin: '-10px 0 16px 0', fontSize: '0.85rem', color: '#64748B' }}>Create a new work package, activity, or milestone for this project</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="ACTIVITY NAME" required><Input placeholder="Project Kick-off" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="ACTIVITY PHASE" required><Select><option>Planning</option><option>Engineering</option><option>Procurement</option><option>Construction</option><option>Commissioning</option></Select></FormField>
            <FormField label="ASSIGNED TO" required><Select><option>Chidi Okafor</option><option>Zainab Mohammed</option></Select></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="PRIORITY" required><Select><option>High</option><option>Medium</option><option>Low</option></Select></FormField>
            <FormField label="START DATE" required><Input type="date" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="END DATE" required><Input type="date" /></FormField>
            <FormField label="DURATION" required><Input placeholder="4 Days" /></FormField>
          </div>
          <FormField label="DESCRIPTION" required><textarea rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Add project description..." /></FormField>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>ACTIVITY CONFIGURATION</div>
            {[['Critical Path Marker', 'Activities on the critical path directly affect project completion'], ['Milestone', 'Represents a key project checkpoint']].map(([label, desc], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div><div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{label}</div><div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{desc}</div></div>
                <input type="checkbox" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setAddOpen(false)} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>Save Activity</button>
        </div>
      </Drawer>
    </div>
  );
}

// ─── SIMPLE TABLE TAB HELPER ────────────────────────────────────────────────
function SimpleTable({ columns, data, btnLabel, onAdd }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 10;
  const paginated = data.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);
  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="table-toolbar">
        <div className="table-toolbar-search">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ paddingLeft: '36px', width: '100%' }} />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
        </div>
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
          {btnLabel && <button className="btn btn-primary" onClick={onAdd} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> {btnLabel}</button>}
        </div>
      </div>
      <DataTable columns={columns} data={paginated} keyField={columns[0].key} emptyMessage="No records found." />
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

// ─── PROGRESS TRACKING TAB ──────────────────────────────────────────────────
function ProgressTrackingTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'PHYSICAL PROGRESS', value: '68%', sub: 'Against project scope', color: '#3B82F6' },
          { label: 'FINANCIAL BUDGET', value: '₦248.5M / ₦360M', sub: 'Budget utilized', color: '#8B5CF6' },
          { label: 'PROJECT HEALTH', value: 'On Track', sub: 'Overall delivery', color: '#10B981' },
          { label: 'OPEN PROJECT LOGS', value: '7', sub: 'Risks, issues & changes', color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Physical Progress vs Financial Progress</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.8rem', color: '#64748B' }}>
            <span><span style={{ color: '#3B82F6' }}>●</span> Physical Progress (%) — 68%</span>
            <span><span style={{ color: '#EF4444' }}>●</span> Financial Progress (%) — 42%</span>
          </div>
          {/* Simple line chart mockup */}
          <div style={{ height: '160px', position: 'relative', borderLeft: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
            {['0%', '25%', '50%', '75%', '100%'].map((v, i) => (
              <div key={i} style={{ position: 'absolute', left: '0', right: '0', bottom: `${i * 25}%`, borderTop: '1px dashed #F1F5F9', fontSize: '0.65rem', color: '#CBD5E1', paddingLeft: '4px' }}>{v}</div>
            ))}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <polyline points="0,130 60,100 120,80 180,70 240,60 300,55" fill="none" stroke="#3B82F6" strokeWidth="2" />
              <polyline points="0,140 60,120 120,110 180,100 240,90 300,85" fill="none" stroke="#EF4444" strokeWidth="2" />
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
          <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            {[40, 80, 120, 170, 60, 100, 90, 140].map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%' }}>
                <div style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: '2px 2px 0 0', height: `${(v / 200) * 100}%` }} />
                <div style={{ flex: 1, backgroundColor: '#1D4ED8', borderRadius: '2px 2px 0 0', height: `${(v * 0.7 / 200) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Log Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="table-toolbar" style={{ marginBottom: '16px' }}>
          <div className="table-toolbar-search">
            <Input placeholder="Search Log ID, Type..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Log Entry</button>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'id', label: 'LOG ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
            { key: 'type', label: 'TYPE', render: v => <span style={{ color: '#334155', fontWeight: 500 }}>{v}</span> },
            { key: 'title', label: 'TITLE' },
            { key: 'relatedWBS', label: 'RELATED WBS' },
            { key: 'raisedBy', label: 'RAISED BY' },
            { key: 'dateRaised', label: 'DATE RAISED' },
            {
              key: 'priority', label: 'PRIORITY',
              render: v => {
                const c = v === 'High' ? '#DC2626' : v === 'Medium' ? '#EA580C' : '#64748B';
                return <span style={{ color: c, fontWeight: 500 }}>{v}</span>;
              }
            },
            { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
            { key: 'actions', label: 'ACTIONS', align: 'right', render: () => <button className="icon-btn"><FiEye size={14} /></button> },
          ]}
          data={mockProgressLogs} keyField="title" emptyMessage="No logs found."
        />
      </div>
    </div>
  );
}

// ─── RESOURCE ALLOCATION TAB ─────────────────────────────────────────────────
function ResourceAllocationTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'TOTAL REQUESTS', value: '18', sub: 'Resources requested for this project', color: '#DBEAFE' },
          { label: 'APPROVED', value: '15', sub: 'Approved and ready for issue', color: '#D1FAE5' },
          { label: 'ISSUED', value: '12', sub: 'Currently allocated to site', color: '#EDE9FE' },
          { label: 'PENDING APPROVAL', value: '3', sub: 'Awaiting store review', color: '#FEF3C7' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', lineHeight: 1.3 }}>{s.label}</span>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: s.color }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '16px' }}>
        <DataTable
          columns={[
            { key: 'id', label: 'REQUEST ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
            { key: 'request', label: 'REQUEST', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
            { key: 'category', label: 'CATEGORY' },
            { key: 'qty', label: 'QTY' },
            { key: 'requestedBy', label: 'REQUESTED BY' },
            { key: 'requestDate', label: 'REQUEST DATE' },
            { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
            { key: 'actions', label: 'ACTIONS', align: 'right', render: () => <button className="icon-btn"><FiEye size={14} /></button> },
          ]}
          data={mockResourceRequests} keyField="request" emptyMessage="No resource requests found."
        />
      </div>
    </div>
  );
}

// ─── TIMESHEETS TAB ──────────────────────────────────────────────────────────
function TimesheetsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'PROJECT WORKFORCE', value: '24', sub: 'Personnel assigned to this project', color: '#DBEAFE' },
          { label: 'HOURS LOGGED', value: '4,286 hrs', sub: 'Total hours logged on this project to date', color: '#D1FAE5' },
          { label: 'OVERTIME', value: '312 hrs', sub: 'Total overtime logged on this project to date', color: '#FED7AA' },
          { label: 'PROJECT ATTENDANCE', value: '94%', sub: 'Average attendance rate for this project', color: '#EDE9FE' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', lineHeight: 1.3 }}>{s.label}</span>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: s.color }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Site Timesheets · 22/06/2026</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="table-toolbar-search" style={{ width: '220px' }}>
            <Input placeholder="Search employee, location..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Log Timesheet</button>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'empId', label: 'EMPLOYEE ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
          { key: 'employee', label: 'EMPLOYEE', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
          { key: 'role', label: 'ROLE', render: v => <span style={{ color: '#3B82F6', fontSize: '0.8rem' }}>{v}</span> },
          { key: 'activity', label: 'ACTIVITY' },
          { key: 'hoursWorked', label: 'HOURS WORKED' },
          { key: 'overtime', label: 'OVERTIME' },
          { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
          { key: 'actions', label: 'ACTIONS', align: 'right', render: () => <button className="icon-btn"><FiEye size={14} /></button> },
        ]}
        data={mockTimesheets} keyField="employee" emptyMessage="No timesheets found."
      />
    </div>
  );
}

// ─── DOCUMENTS TAB ───────────────────────────────────────────────────────────
function DocumentsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="table-toolbar-search" style={{ width: '260px' }}>
          <Input placeholder="Search by Doc title, Category..." style={{ paddingLeft: '36px', width: '100%' }} />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> New Document</button>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'id', label: 'DOCUMENT ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
          { key: 'title', label: 'DOCUMENT TITLE', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
          { key: 'category', label: 'CATEGORY', render: v => <span style={{ color: '#3B82F6', fontSize: '0.8rem' }}>{v}</span> },
          { key: 'preparedBy', label: 'PREPARED BY' },
          { key: 'clientFacing', label: 'CLIENT-FACING' },
          { key: 'version', label: 'VERSION' },
          { key: 'lastUpdated', label: 'LAST UPDATED' },
          { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
          { key: 'actions', label: 'ACTIONS', align: 'right', render: () => (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="icon-btn"><FiEye size={14} /></button>
              <button className="icon-btn"><FiMoreVertical size={14} /></button>
            </div>
          )},
        ]}
        data={mockProjectDocuments} keyField="title" emptyMessage="No documents found."
      />
    </div>
  );
}

// ─── SITE DIARY TAB ──────────────────────────────────────────────────────────
function SiteDiaryTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
        <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> New Diary Entry</button>
      </div>
      <DataTable
        columns={[
          { key: 'id', label: 'ENTRY ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
          { key: 'date', label: 'DATE' },
          { key: 'location', label: 'SITE LOCATION', render: v => <span style={{ color: '#3B82F6' }}>{v}</span> },
          { key: 'loggedBy', label: 'LOGGED BY' },
          { key: 'summaryOfWork', label: 'SUMMARY OF WORK' },
          { key: 'workforce', label: 'WORKFORCE' },
          { key: 'incident', label: 'INCIDENT' },
          { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
          { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="icon-btn"><FiEye size={14} /></button>
              {row.status === 'Submitted' && <button className="icon-btn"><FiMoreVertical size={14} /></button>}
            </div>
          )},
        ]}
        data={mockSiteDiary} keyField="date" emptyMessage="No diary entries found."
      />
    </div>
  );
}

// ─── SITE INSPECTION TAB ────────────────────────────────────────────────────
function SiteInspectionTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
        <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Add Inspection</button>
      </div>
      <DataTable
        columns={[
          { key: 'id', label: 'INSPECTION ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
          { key: 'date', label: 'INSPECTION DATE' },
          { key: 'keyFinding', label: 'KEY FINDING', render: v => <span style={{ color: '#334155' }}>{v}</span> },
          { key: 'inspectedBy', label: 'INSPECTED BY' },
          { key: 'actions', label: 'ACTIONS', align: 'right', render: () => (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="icon-btn"><FiEye size={14} /></button>
              <button className="icon-btn"><FiEdit2 size={14} /></button>
            </div>
          )},
        ]}
        data={mockSiteInspections} keyField="id" emptyMessage="No inspections found."
      />
    </div>
  );
}

// ─── GANTT CHART TAB ─────────────────────────────────────────────────────────
function GanttChartTab() {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const activities = mockWBSActivities.slice(0, 8);
  return (
    <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontWeight: 600, color: '#0F172A' }}>Gantt Chart</h3>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
      </div>
      <div style={{ minWidth: '800px' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>ACTIVITY</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
            {months.map(m => <div key={m} style={{ padding: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>{m}</div>)}
          </div>
        </div>
        {activities.map((act, i) => {
          const start = Math.floor(Math.random() * 3);
          const dur = Math.ceil(Math.random() * 4) + 1;
          const barColor = act.status === 'Completed' ? '#10B981' : act.status === 'In Progress' ? '#3B82F6' : act.status === 'Delayed' ? '#EF4444' : '#94A3B8';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
              <div style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#334155', fontWeight: act.type === 'parent' ? 600 : 400, paddingLeft: act.type === 'grandchild' ? '36px' : act.type === 'child' ? '24px' : '16px' }}>{act.activity}</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, alignItems: 'center' }}>
                {months.map((m, mi) => (
                  <div key={m} style={{ borderLeft: '1px solid #F1F5F9', height: '100%', display: 'flex', alignItems: 'center', padding: '6px 2px' }}>
                    {mi >= start && mi < start + dur && (
                      <div style={{ width: '100%', height: '16px', backgroundColor: barColor, borderRadius: mi === start ? '4px 0 0 4px' : mi === start + dur - 1 ? '0 4px 4px 0' : '0', opacity: 0.85 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── IMAGES TAB ─────────────────────────────────────────────────────────────
function ImagesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="table-toolbar-search" style={{ width: '240px' }}>
          <Input placeholder="Search field snapshots..." style={{ paddingLeft: '36px', width: '100%' }} />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiUpload size={14} /> Upload Photo</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {mockSitePhotos.map((photo) => (
          <div key={photo.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ height: '140px', background: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🏗️</div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{photo.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px', lineHeight: 1.4 }}>{photo.caption}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>👤 {photo.uploadedBy}</span>
                <span>{photo.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TASKS TAB ───────────────────────────────────────────────────────────────
function TasksTab() {
  return (
    <DataTable
      columns={[
        { key: 'id', label: 'TASK ID', render: v => <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{v}</span> },
        { key: 'task', label: 'TASK', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
        { key: 'assignedTo', label: 'ASSIGNED TO' },
        { key: 'priority', label: 'PRIORITY', render: v => <span style={{ color: v === 'High' ? '#DC2626' : v === 'Medium' ? '#EA580C' : '#64748B', fontWeight: 500 }}>{v}</span> },
        { key: 'dueDate', label: 'DUE DATE' },
        { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
        { key: 'actions', label: 'ACTIONS', align: 'right', render: () => <button className="icon-btn"><FiEye size={14} /></button> },
      ]}
      data={mockProjectTasks} keyField="id" emptyMessage="No tasks found."
    />
  );
}

// ─── MAIN PROJECT DETAIL PAGE ────────────────────────────────────────────────
export default function ProjectDetail() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const project = mockProjectDetail;

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab project={project} />;
      case 'Site Inspection': return <SiteInspectionTab />;
      case 'WBS': return <WBSTab />;
      case 'Gantt Chart': return <GanttChartTab />;
      case 'Tasks': return <TasksTab />;
      case 'Progress Tracking': return <ProgressTrackingTab />;
      case 'Resource Allocation': return <ResourceAllocationTab />;
      case 'Site Diary': return <SiteDiaryTab />;
      case 'Timesheets': return <TimesheetsTab />;
      case 'Documents': return <DocumentsTab />;
      default: return <ImagesTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Projects</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Portfolio of all company projects — execution, progress, cost, resources</p>
      </div>

      {/* Project Header Card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <button className="icon-btn" onClick={() => navigate('/technical/projects')} style={{ marginTop: '2px' }}>
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>{project.name}</h2>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '10px' }}>
                <span>{project.id}</span> <span style={{ color: '#CBD5E1' }}>•</span> <span style={{ color: '#3B82F6' }}>{project.client}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '6px' }}>{project.type}</span>
                <StatusPill status={project.status} size="sm" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiEdit2 size={14} /> Edit Project</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiShare2 size={14} /> Share Progress</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export Report <FiDownload size={14} /></button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
        {[...TABS, 'Images'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 16px', background: 'none', border: 'none', whiteSpace: 'nowrap',
            borderBottom: activeTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
            color: activeTab === tab ? '#1D4ED8' : '#64748B',
            fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem'
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}
