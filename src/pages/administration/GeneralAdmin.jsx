import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiBell, FiMail, FiCalendar, FiClock, FiUsers, FiFileText,
  FiMessageSquare, FiAlertCircle, FiEdit2, FiTrash2, FiSend,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockNotices, mockCorrespondence, mockMeetings } from '../../data/mockAdmin';

const ITEMS_PER_PAGE = 8;

// ─── Row Menu ────────────────────────────────────────────────────────────────
function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '160px' }}>
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

export default function GeneralAdmin() {
  const [activeTab, setActiveTab] = useState('notices');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [noticeModal, setNoticeModal] = useState(false);
  const [meetingModal, setMeetingModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    { key: 'notices', label: 'Notices & Circulars', icon: <FiBell size={15} /> },
    { key: 'correspondence', label: 'Correspondence', icon: <FiMail size={15} /> },
    { key: 'meetings', label: 'Meeting Schedule', icon: <FiCalendar size={15} /> },
  ];

  const data = activeTab === 'notices' ? mockNotices
    : activeTab === 'correspondence' ? mockCorrespondence
    : mockMeetings;

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    if (!q) return true;
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const noticeColumns = [
    { key: 'id', label: 'REF NO', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    { key: 'title', label: 'TITLE', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY' },
    { key: 'issuedBy', label: 'ISSUED BY' },
    { key: 'date', label: 'DATE' },
    {
      key: 'priority', label: 'PRIORITY',
      render: v => {
        const colors = { High: '#DC2626', Medium: '#D97706', Low: '#16A34A' };
        return <span style={{ color: colors[v] || '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>{v}</span>;
      }
    },
    { key: 'status', label: 'STATUS', render: v => <Badge status={v === 'Active' ? 'Active' : 'Archived'} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View"><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit', icon: <FiEdit2 size={13} />, action: () => showToast('Edit notice', 'info') },
            { label: 'Archive', icon: <FiTrash2 size={13} />, color: '#DC2626', action: () => showToast('Notice archived', 'success') },
          ]} />
        </div>
      )
    },
  ];

  const corrColumns = [
    { key: 'id', label: 'REF NO', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    { key: 'subject', label: 'SUBJECT', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'from', label: 'FROM' },
    { key: 'to', label: 'TO' },
    { key: 'date', label: 'DATE' },
    {
      key: 'type', label: 'TYPE',
      render: v => {
        const map = { Incoming: { bg: '#DBEAFE', color: '#1D4ED8' }, Outgoing: { bg: '#D1FAE5', color: '#065F46' }, Internal: { bg: '#FEF3C7', color: '#92400E' } };
        const s = map[v] || { bg: '#F1F5F9', color: '#475569' };
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{v}</span>;
      }
    },
    { key: 'status', label: 'STATUS', render: v => <Badge status={v === 'Sent' || v === 'Distributed' || v === 'Reviewed' ? 'Completed' : 'Pending'} text={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View"><FiEye size={15} /></button>
          <button className="icon-btn" title="Download"><FiDownload size={15} /></button>
        </div>
      )
    },
  ];

  const meetingColumns = [
    { key: 'id', label: 'MTG ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    { key: 'title', label: 'TITLE', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'organizer', label: 'ORGANIZER' },
    { key: 'date', label: 'DATE' },
    { key: 'time', label: 'TIME' },
    { key: 'venue', label: 'VENUE' },
    {
      key: 'attendees', label: 'ATTENDEES',
      render: v => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FiUsers size={13} style={{ color: '#94A3B8' }} /> {v}
        </span>
      )
    },
    { key: 'status', label: 'STATUS', render: v => <Badge status={v === 'Scheduled' ? 'Pending' : 'Completed'} text={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View"><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit', icon: <FiEdit2 size={13} />, action: () => showToast('Edit meeting', 'info') },
            { label: 'Cancel', icon: <FiTrash2 size={13} />, color: '#DC2626', action: () => showToast('Meeting cancelled', 'success') },
          ]} />
        </div>
      )
    },
  ];

  const activeColumns = activeTab === 'notices' ? noticeColumns : activeTab === 'correspondence' ? corrColumns : meetingColumns;

  const handleTabChange = (key) => { setActiveTab(key); setSearch(''); setPage(1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>General Administration</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage company notices, correspondence, and meeting schedules
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => activeTab === 'meetings' ? setMeetingModal(true) : setNoticeModal(true)}
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} />
            {activeTab === 'notices' ? 'New Notice' : activeTab === 'correspondence' ? 'Log Correspondence' : 'Schedule Meeting'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiBell size={20} />} label="Active Notices" value={mockNotices.filter(n => n.status === 'Active').length} sub="Published company-wide" accent="#1D4ED8" />
        <StatCard icon={<FiMail size={20} />} label="Pending Letters" value={mockCorrespondence.filter(c => c.status === 'Pending').length} sub="Require response" accent="#D97706" />
        <StatCard icon={<FiCalendar size={20} />} label="Upcoming Meetings" value={mockMeetings.filter(m => m.status === 'Scheduled').length} sub="This month" accent="#7C3AED" />
        <StatCard icon={<FiUsers size={20} />} label="Total Attendees" value="91" sub="Across scheduled meetings" accent="#0891B2" />
      </div>

      {/* Tab Bar + Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '14px 20px', fontSize: '0.85rem', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent',
                color: activeTab === tab.key ? '#1D4ED8' : '#64748B',
                marginBottom: '-1px', transition: 'all 150ms ease',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-toolbar-search" style={{ position: 'relative' }}>
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${activeTab}...`} style={{ paddingLeft: '36px', width: '100%' }} />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <div className="table-toolbar-actions">
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
                <FiFilter size={14} /> Filter
              </button>
            </div>
          </div>

          <DataTable columns={activeColumns} data={paginated} emptyMessage={`No ${activeTab} records found.`} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* New Notice Modal */}
      <Modal isOpen={noticeModal} onClose={() => setNoticeModal(false)} title="Create Notice / Circular" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Notice Title">
            <Input placeholder="e.g. Office Closure – Public Holiday" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Category">
              <select className="form-input">
                {['General', 'Policy', 'Safety', 'Facilities', 'HR'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select className="form-input">
                {['High', 'Medium', 'Low'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Issued By">
            <Input placeholder="Department or person name" defaultValue="Admin Office" />
          </FormField>
          <FormField label="Notice Content">
            <Textarea placeholder="Enter notice body..." rows={4} />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setNoticeModal(false)}>Cancel</button>
            <button className="btn btn-primary"
              onClick={() => { setNoticeModal(false); showToast('Notice published successfully', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiSend size={14} /> Publish Notice
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule Meeting Modal */}
      <Modal isOpen={meetingModal} onClose={() => setMeetingModal(false)} title="Schedule New Meeting" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Meeting Title">
            <Input placeholder="e.g. Q4 Strategy Meeting" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Date"><Input type="date" /></FormField>
            <FormField label="Time"><Input type="time" /></FormField>
          </div>
          <FormField label="Venue">
            <Input placeholder="e.g. Board Room A" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Organizer">
              <Input placeholder="Organizer name or dept" />
            </FormField>
            <FormField label="Expected Attendees">
              <Input type="number" placeholder="0" />
            </FormField>
          </div>
          <FormField label="Agenda / Notes">
            <Textarea placeholder="Meeting agenda..." rows={3} />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setMeetingModal(false)}>Cancel</button>
            <button className="btn btn-primary"
              onClick={() => { setMeetingModal(false); showToast('Meeting scheduled successfully', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar size={14} /> Schedule Meeting
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
