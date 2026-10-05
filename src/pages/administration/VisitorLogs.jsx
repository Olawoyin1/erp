import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiUserCheck, FiClock, FiUsers, FiLogIn, FiLogOut,
  FiAlertTriangle, FiPrinter, FiEdit2,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockVisitors } from '../../data/mockAdmin';

const ITEMS_PER_PAGE = 8;

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
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '165px' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { item.action(); setOpen(false); }} className="menu-item-hover"
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color || '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {item.icon} {item.label}
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
      <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function VisitorDetailDrawer({ visitor, onClose, onCheckOut, onShowToast }) {
  if (!visitor) return null;
  const isOnPremises = visitor.status === 'On Premises';
  const isExpected = visitor.status === 'Expected';

  const footer = (isOnPremises || isExpected) ? (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('Badge printed', 'success')}>
        <FiPrinter size={14} /> Print Badge
      </button>
      {isOnPremises && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => { onCheckOut(visitor); }}>
          <FiLogOut size={14} /> Check Out
        </button>
      )}
      {isExpected && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => { onShowToast(`${visitor.name} checked in`, 'success'); }}>
          <FiLogIn size={14} /> Check In
        </button>
      )}
    </div>
  ) : null;

  const statusMap = { 'On Premises': { bg: '#DBEAFE', color: '#1E40AF' }, 'Checked Out': { bg: '#F1F5F9', color: '#475569' }, 'Expected': { bg: '#D1FAE5', color: '#065F46' } };
  const s = statusMap[visitor.status] || { bg: '#F1F5F9', color: '#475569' };

  return (
    <Drawer isOpen={!!visitor} onClose={onClose} title="Visitor Details" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Visitor Header */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{visitor.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>{visitor.company}</div>
            </div>
            <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              {visitor.status}
            </span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#1D4ED8', color: '#fff', padding: '5px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
            <FiUserCheck size={13} /> Badge: {visitor.badge}
          </div>
        </div>

        {/* Visit Details */}
        {[
          { label: 'Visit Purpose', value: visitor.purpose },
          { label: 'Host', value: visitor.host },
          { label: 'Host Department', value: visitor.hostDept },
          { label: 'Visit Date', value: visitor.date },
          { label: 'Check-In Time', value: visitor.checkIn || '—', icon: <FiLogIn size={13} /> },
          { label: 'Check-Out Time', value: visitor.checkOut || '—', icon: <FiLogOut size={13} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        {/* Duration */}
        {visitor.checkIn && visitor.checkOut && (
          <div style={{ backgroundColor: '#EEF2FF', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiClock size={16} color="#4F46E5" />
            <span style={{ fontSize: '0.85rem', color: '#3730A3', fontWeight: 600 }}>
              Visit Duration: ~{Math.round(
                (new Date(`2000/01/01 ${visitor.checkOut}`) - new Date(`2000/01/01 ${visitor.checkIn}`)) / 60000
              )} minutes
            </span>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function VisitorLogs() {
  const [data, setData] = useState(mockVisitors);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const TODAY = '2026-10-05';
  const statusFilters = ['All', 'On Premises', 'Expected', 'Checked Out'];

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.company.toLowerCase().includes(q) || item.host.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCheckOut = (visitor) => {
    setData(prev => prev.map(v => v.id === visitor.id ? { ...v, status: 'Checked Out', checkOut: '12:00 PM' } : v));
    setSelectedVisitor(null);
    showToast(`${visitor.name} checked out successfully`, 'success');
  };

  const statusStyle = status => {
    const map = {
      'On Premises': { bg: '#DBEAFE', color: '#1E40AF' },
      'Checked Out': { bg: '#F1F5F9', color: '#475569' },
      'Expected': { bg: '#D1FAE5', color: '#065F46' },
    };
    return map[status] || { bg: '#F1F5F9', color: '#475569' };
  };

  const columns = [
    { key: 'id', label: 'VISITOR ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    {
      key: 'name', label: 'VISITOR',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{row.company}</div>
        </div>
      )
    },
    { key: 'purpose', label: 'PURPOSE' },
    {
      key: 'host', label: 'HOST',
      render: (v, row) => (
        <div>
          <div style={{ color: '#0F172A', fontWeight: 500 }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{row.hostDept}</div>
        </div>
      )
    },
    { key: 'date', label: 'DATE' },
    {
      key: 'checkIn', label: 'CHECK IN',
      render: (v, row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FiLogIn size={13} style={{ color: '#16A34A' }} />
          {v || <span style={{ color: '#94A3B8' }}>—</span>}
        </span>
      )
    },
    {
      key: 'checkOut', label: 'CHECK OUT',
      render: v => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FiLogOut size={13} style={{ color: '#DC2626' }} />
          {v || <span style={{ color: '#94A3B8' }}>—</span>}
        </span>
      )
    },
    {
      key: 'badge', label: 'BADGE',
      render: v => <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{v}</span>
    },
    {
      key: 'status', label: 'STATUS',
      render: v => {
        const s = statusStyle(v);
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 9px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{v}</span>;
      }
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => setSelectedVisitor(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            ...(row.status === 'Expected' ? [{ label: 'Check In', icon: <FiLogIn size={13} />, color: '#16A34A', action: () => showToast(`${row.name} checked in`, 'success') }] : []),
            ...(row.status === 'On Premises' ? [{ label: 'Check Out', icon: <FiLogOut size={13} />, color: '#DC2626', action: () => handleCheckOut(row) }] : []),
            { label: 'Print Badge', icon: <FiPrinter size={13} />, action: () => showToast('Badge printed', 'success') },
            { label: 'Edit Record', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
          ]} />
        </div>
      )
    },
  ];

  const todayVisitors = data.filter(v => v.date === TODAY);
  const onPremises = data.filter(v => v.status === 'On Premises').length;
  const expected = data.filter(v => v.status === 'Expected').length;
  const checkedOut = data.filter(v => v.status === 'Checked Out').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <VisitorDetailDrawer visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} onCheckOut={handleCheckOut} onShowToast={showToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Visitor Logs</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Register visitors, track arrivals, manage access badges, and maintain visit records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)}
            className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Register Visitor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiUsers size={20} />} label="Today's Visitors" value={todayVisitors.length} sub="All visits today" accent="#1D4ED8" />
        <StatCard icon={<FiUserCheck size={20} />} label="On Premises" value={onPremises} sub="Currently inside" accent="#16A34A" />
        <StatCard icon={<FiClock size={20} />} label="Expected" value={expected} sub="Awaiting arrival" accent="#7C3AED" />
        <StatCard icon={<FiLogOut size={20} />} label="Checked Out" value={checkedOut} sub="All time exits today" accent="#64748B" />
      </div>

      {/* Live Visitors on Premises */}
      {onPremises > 0 && (
        <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🟢 Currently On Premises
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.filter(v => v.status === 'On Premises').map(v => (
              <div key={v.id} onClick={() => setSelectedVisitor(v)}
                style={{ backgroundColor: '#fff', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', transition: 'box-shadow 150ms ease' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(29,78,216,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#0F172A' }}>{v.name}</div>
                <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{v.company} · {v.checkIn}</div>
                <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginTop: '2px' }}>Hosting: {v.host}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>All Visitor Records</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {statusFilters.map(f => (
              <button key={f} onClick={() => { setFilterStatus(f); setPage(1); }}
                style={{
                  padding: '5px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
                  backgroundColor: filterStatus === f ? '#1D4ED8' : '#F1F5F9',
                  color: filterStatus === f ? '#fff' : '#64748B',
                  border: 'none',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-toolbar">
            <div className="table-toolbar-search" style={{ position: 'relative' }}>
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search visitor name, company, host..." style={{ paddingLeft: '36px', width: '100%' }} />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <div className="table-toolbar-actions">
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
                <FiFilter size={14} /> Filter
              </button>
            </div>
          </div>

          <DataTable
            columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No visitor records found."
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Register Visitor Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Register New Visitor" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Visitor Name"><Input placeholder="Full name" /></FormField>
            <FormField label="Company / Organisation"><Input placeholder="Company name" /></FormField>
          </div>
          <FormField label="Purpose of Visit">
            <Input placeholder="e.g. Contract Discussion, Project Meeting" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Host (Staff)"><Input placeholder="Staff member being visited" /></FormField>
            <FormField label="Host Department">
              <select className="form-input">
                {['Administration', 'Business Development', 'Finance', 'HR', 'HSE', 'Management', 'Procurement', 'Technical', 'Quality System', 'IT'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Visit Date"><Input type="date" defaultValue={TODAY} /></FormField>
            <FormField label="Expected Time"><Input type="time" /></FormField>
          </div>
          <FormField label="Additional Notes">
            <Textarea placeholder="Any additional visit details..." rows={2} />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary"
              onClick={() => { setAddModal(false); showToast('Visitor registered & badge assigned', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiUserCheck size={14} /> Register Visitor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
