import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiTrendingUp, FiDollarSign, FiTarget, FiAward, FiXCircle,
  FiEdit2, FiTrash2, FiUser, FiCalendar, FiBarChart2,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockPipeline, PIPELINE_STAGES } from '../../data/mockBizDev';

const ITEMS_PER_PAGE = 8;

const fmt = (n) => '₦' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1_000).toFixed(0) + 'K');
const fmtFull = (n) => '₦' + n.toLocaleString();

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '160px' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { item.action(); setOpen(false); }} className="menu-item-hover"
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color || '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {item.icon}{item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// Stage pill color map
const stageStyle = {
  'Prospect':      { bg: '#F1F5F9', color: '#475569' },
  'Qualified':     { bg: '#DBEAFE', color: '#1E40AF' },
  'Proposal Sent': { bg: '#FEF3C7', color: '#92400E' },
  'Negotiation':   { bg: '#EDE9FE', color: '#5B21B6' },
  'Won':           { bg: '#DCFCE7', color: '#14532D' },
  'Lost':          { bg: '#FEE2E2', color: '#991B1B' },
};

function StagePill({ stage }) {
  const s = stageStyle[stage] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{stage}</span>;
}

function ProbabilityBar({ value }) {
  const color = value >= 80 ? '#16A34A' : value >= 50 ? '#2563EB' : value >= 20 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: 30 }}>{value}%</span>
    </div>
  );
}

function OpportunityDrawer({ opp, onClose, onShowToast }) {
  if (!opp) return null;
  const s = stageStyle[opp.stage] || { bg: '#F1F5F9', color: '#64748B' };
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600 }}
        onClick={() => onShowToast('Stage updated', 'success')}>Move Stage</button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
        onClick={() => onShowToast('Activity logged', 'success')}>Log Activity</button>
    </div>
  );
  return (
    <Drawer isOpen={!!opp} onClose={onClose} title="Opportunity Details" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{opp.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{opp.client}</div>
            </div>
            <StagePill stage={opp.stage} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8' }}>{fmtFull(opp.value)}</div>
        </div>

        {[
          { label: 'Opportunity ID', value: opp.id },
          { label: 'Sector', value: opp.sector },
          { label: 'Owner', value: opp.owner, icon: <FiUser size={13} /> },
          { label: 'Close Date', value: opp.dueDate, icon: <FiCalendar size={13} /> },
          { label: 'Last Activity', value: opp.lastActivity },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Win Probability</div>
          <ProbabilityBar value={opp.probability} />
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Stage</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {PIPELINE_STAGES.map(stage => {
              const active = stage === opp.stage;
              const ss = stageStyle[stage] || {};
              return (
                <span key={stage} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 600,
                  backgroundColor: active ? ss.bg : '#F1F5F9', color: active ? ss.color : '#94A3B8',
                  border: active ? `1.5px solid ${ss.color}40` : '1.5px solid transparent' }}>
                  {stage}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function ClientPipeline() {
  const [view, setView] = useState('list'); // 'list' | 'kanban'
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const stageFilters = ['All', ...PIPELINE_STAGES];

  const filtered = mockPipeline.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.title.toLowerCase().includes(q) || o.client.toLowerCase().includes(q) || o.owner.toLowerCase().includes(q);
    const matchS = stageFilter === 'All' || o.stage === stageFilter;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalValue = mockPipeline.reduce((s, o) => s + o.value, 0);
  const wonValue = mockPipeline.filter(o => o.stage === 'Won').reduce((s, o) => s + o.value, 0);
  const activeOpps = mockPipeline.filter(o => !['Won', 'Lost'].includes(o.stage)).length;
  const winRate = Math.round((mockPipeline.filter(o => o.stage === 'Won').length / mockPipeline.filter(o => ['Won', 'Lost'].includes(o.stage)).length) * 100);

  const columns = [
    { key: 'id', label: 'OPP ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    {
      key: 'title', label: 'OPPORTUNITY',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: 260 }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{row.client}</div>
        </div>
      )
    },
    { key: 'sector', label: 'SECTOR' },
    { key: 'value', label: 'VALUE', render: v => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fmt(v)}</span> },
    { key: 'stage', label: 'STAGE', render: v => <StagePill stage={v} /> },
    { key: 'probability', label: 'PROBABILITY', render: v => <ProbabilityBar value={v} /> },
    { key: 'owner', label: 'OWNER', render: v => <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FiUser size={13} style={{ color: '#94A3B8' }} />{v}</span> },
    { key: 'dueDate', label: 'CLOSE DATE' },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => setSelectedOpp(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit Opportunity', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
            { label: 'Move Stage', icon: <FiTrendingUp size={13} />, action: () => showToast('Stage updated', 'success') },
            { label: 'Mark as Lost', icon: <FiXCircle size={13} />, color: '#DC2626', action: () => showToast('Marked as lost', 'success') },
          ]} />
        </div>
      )
    },
  ];

  // Kanban view
  const KanbanBoard = () => (
    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
      {PIPELINE_STAGES.map(stage => {
        const cards = mockPipeline.filter(o => o.stage === stage);
        const s = stageStyle[stage] || { bg: '#F1F5F9', color: '#64748B' };
        const stageTotal = cards.reduce((sum, o) => sum + o.value, 0);
        return (
          <div key={stage} style={{ minWidth: 240, flex: '0 0 240px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: s.bg, borderRadius: '8px 8px 0 0', borderBottom: `2px solid ${s.color}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stage}</span>
                <span style={{ backgroundColor: s.color + '20', color: s.color, borderRadius: '10px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>{cards.length}</span>
              </div>
              {stageTotal > 0 && <div style={{ fontSize: '0.73rem', color: s.color + 'cc', marginTop: '2px', fontWeight: 600 }}>{fmt(stageTotal)}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '0 0 8px 8px', minHeight: 80 }}>
              {cards.map(card => (
                <div key={card.id} onClick={() => setSelectedOpp(card)} style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'box-shadow 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px', lineHeight: 1.35 }}>{card.title}</div>
                  <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginBottom: '8px' }}>{card.client}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1D4ED8' }}>{fmt(card.value)}</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{card.probability}%</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiUser size={11} />{card.owner}
                  </div>
                </div>
              ))}
              {cards.length === 0 && <div style={{ fontSize: '0.78rem', color: '#CBD5E1', textAlign: 'center', paddingTop: '20px' }}>No opportunities</div>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <OpportunityDrawer opp={selectedOpp} onClose={() => setSelectedOpp(null)} onShowToast={showToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Client Pipeline</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track opportunities, manage deal stages, and monitor your sales pipeline value
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {[{ key: 'list', icon: <FiBarChart2 size={14} />, label: 'List' }, { key: 'kanban', icon: <FiTrendingUp size={14} />, label: 'Kanban' }].map(v => (
              <button key={v.key} onClick={() => setView(v.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                  backgroundColor: view === v.key ? '#fff' : 'transparent', color: view === v.key ? '#0F172A' : '#64748B',
                  boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {v.icon}{v.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> New Opportunity
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiTrendingUp size={20} />} label="Pipeline Value" value={fmt(totalValue)} sub="Total weighted value" accent="#1D4ED8" />
        <StatCard icon={<FiTarget size={20} />} label="Active Deals" value={activeOpps} sub="In progress" accent="#7C3AED" />
        <StatCard icon={<FiAward size={20} />} label="Won Value" value={fmt(wonValue)} sub="Closed & won" accent="#16A34A" />
        <StatCard icon={<FiBarChart2 size={20} />} label="Win Rate" value={`${winRate}%`} sub="Won vs Lost" accent="#0891B2" />
      </div>

      {/* Content Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Stage filter pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {stageFilters.map(f => (
              <button key={f} onClick={() => { setStageFilter(f); setPage(1); }}
                style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  backgroundColor: stageFilter === f ? '#1D4ED8' : '#F1F5F9', color: stageFilter === f ? '#fff' : '#64748B' }}>
                {f}
              </button>
            ))}
          </div>
          {view === 'list' && (
            <div style={{ position: 'relative' }}>
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search opportunities..." style={{ paddingLeft: '34px', width: '240px' }} />
              <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            </div>
          )}
        </div>

        <div style={{ padding: view === 'kanban' ? '20px' : '0 24px 16px' }}>
          {view === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
              <DataTable columns={columns} data={paginated} emptyMessage="No opportunities found." />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Add Opportunity Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="New Opportunity" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Opportunity Title">
            <Input placeholder="e.g. FPSO Maintenance Contract – Q1 2027" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Client / Company"><Input placeholder="Company name" /></FormField>
            <FormField label="Sector">
              <select className="form-input">{['Oil & Gas', 'Petrochemical', 'Chemical', 'Power', 'Government', 'Other'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Estimated Value (₦)"><Input type="number" placeholder="0" /></FormField>
            <FormField label="Stage">
              <select className="form-input">{PIPELINE_STAGES.map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Win Probability (%)"><Input type="number" placeholder="50" /></FormField>
            <FormField label="Expected Close Date"><Input type="date" /></FormField>
          </div>
          <FormField label="Owner / BD Manager"><Input placeholder="Staff member responsible" /></FormField>
          <FormField label="Notes"><Textarea placeholder="Opportunity notes, context..." rows={2} /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Opportunity added to pipeline', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
              Add Opportunity
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
