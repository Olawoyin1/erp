import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiUsers, FiMail, FiPhone, FiMapPin, FiBriefcase,
  FiEdit2, FiTrash2, FiUser, FiLinkedin, FiCalendar,
  FiStar, FiMessageSquare,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockContacts, CONTACT_CATEGORIES } from '../../data/mockBizDev';

const ITEMS_PER_PAGE = 10;

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

const categoryStyle = {
  'Client':     { bg: '#DBEAFE', color: '#1E40AF' },
  'Lead':       { bg: '#FEF3C7', color: '#92400E' },
  'Partner':    { bg: '#D1FAE5', color: '#065F46' },
  'Regulator':  { bg: '#EDE9FE', color: '#5B21B6' },
  'Vendor':     { bg: '#FFF1F2', color: '#BE123C' },
};

function CategoryPill({ cat }) {
  const s = categoryStyle[cat] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{cat}</span>;
}

// Avatar initials
function Avatar({ name, size = 36 }) {
  const parts = name.split(' ');
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  const colors = ['#1D4ED8', '#7C3AED', '#0891B2', '#16A34A', '#D97706', '#DC2626', '#DB2777'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color + '20', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {initials.toUpperCase()}
    </div>
  );
}

function ContactDrawer({ contact, onClose, onShowToast }) {
  if (!contact) return null;
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('Activity logged', 'success')}>
        <FiMessageSquare size={14} /> Log Activity
      </button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('Edit mode', 'info')}>
        <FiEdit2 size={14} /> Edit Contact
      </button>
    </div>
  );

  return (
    <Drawer isOpen={!!contact} onClose={onClose} title="Contact Profile" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Contact Header */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar name={contact.name} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{contact.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>{contact.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#1D4ED8', fontWeight: 600, marginTop: '2px' }}>{contact.company}</div>
              </div>
              <CategoryPill cat={contact.category} />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { label: 'Email', value: contact.email, icon: <FiMail size={14} />, href: `mailto:${contact.email}` },
            { label: 'Phone', value: contact.phone, icon: <FiPhone size={14} />, href: `tel:${contact.phone}` },
            { label: 'Location', value: contact.location, icon: <FiMapPin size={14} /> },
            { label: 'Sector', value: contact.sector, icon: <FiBriefcase size={14} /> },
            { label: 'Owner', value: contact.owner, icon: <FiUser size={14} /> },
            { label: 'Last Contact', value: contact.lastContact, icon: <FiCalendar size={14} /> },
          ].map(({ label, value, icon, href }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#94A3B8' }}>{icon}</span>{label}
              </span>
              {href ? (
                <a href={href} style={{ fontSize: '0.85rem', color: '#1D4ED8', fontWeight: 600, textDecoration: 'none' }}>{value}</a>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>{value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: contact.status === 'Active' ? '#F0FDF4' : '#F8FAFC', borderRadius: '8px', border: `1px solid ${contact.status === 'Active' ? '#BBF7D0' : '#E2E8F0'}` }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: contact.status === 'Active' ? '#16A34A' : '#64748B' }}>
            {contact.status === 'Active' ? '● Active Contact' : '● Inactive'}
          </span>
          <Badge status={contact.status} />
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Send Email', icon: <FiMail size={15} />, color: '#1D4ED8' },
            { label: 'Log Call', icon: <FiPhone size={15} />, color: '#16A34A' },
            { label: 'Schedule', icon: <FiCalendar size={15} />, color: '#7C3AED' },
          ].map(action => (
            <button key={action.label} onClick={() => onShowToast(`${action.label} initiated`, 'success')}
              style={{ padding: '10px 8px', borderRadius: '8px', border: `1px solid ${action.color}30`, backgroundColor: action.color + '08', color: action.color, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.73rem', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = action.color + '15'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = action.color + '08'}>
              {action.icon}{action.label}
            </button>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

export default function CRMContacts() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const categoryFilters = ['All', ...CONTACT_CATEGORIES];

  const filtered = mockContacts.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchC = categoryFilter === 'All' || c.category === categoryFilter;
    return matchQ && matchC;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const clients = mockContacts.filter(c => c.category === 'Client').length;
  const leads = mockContacts.filter(c => c.category === 'Lead').length;
  const partners = mockContacts.filter(c => c.category === 'Partner').length;
  const active = mockContacts.filter(c => c.status === 'Active').length;

  const columns = [
    {
      key: 'name', label: 'CONTACT',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar name={v} size={32} />
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A' }}>{v}</div>
            <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{row.title}</div>
          </div>
        </div>
      )
    },
    {
      key: 'company', label: 'COMPANY',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: '#0F172A' }}>{v}</div>
          <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{row.sector}</div>
        </div>
      )
    },
    { key: 'category', label: 'CATEGORY', render: v => <CategoryPill cat={v} /> },
    {
      key: 'email', label: 'EMAIL',
      render: v => <a href={`mailto:${v}`} style={{ color: '#1D4ED8', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><FiMail size={13} />{v}</a>
    },
    {
      key: 'phone', label: 'PHONE',
      render: v => <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}><FiPhone size={13} style={{ color: '#94A3B8' }} />{v}</span>
    },
    {
      key: 'location', label: 'LOCATION',
      render: v => <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}><FiMapPin size={13} style={{ color: '#94A3B8' }} />{v}</span>
    },
    { key: 'owner', label: 'OWNER' },
    { key: 'lastContact', label: 'LAST CONTACT' },
    { key: 'status', label: 'STATUS', render: v => <Badge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View Profile" onClick={() => setSelectedContact(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit Contact', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
            { label: 'Log Activity', icon: <FiMessageSquare size={13} />, action: () => showToast('Activity logged', 'success') },
            { label: 'Send Email', icon: <FiMail size={13} />, action: () => showToast('Email composed', 'info') },
            { label: 'Remove', icon: <FiTrash2 size={13} />, color: '#DC2626', action: () => showToast('Contact removed', 'success') },
          ]} />
        </div>
      )
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ContactDrawer contact={selectedContact} onClose={() => setSelectedContact(null)} onShowToast={showToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>CRM Contacts</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage client relationships, track interactions, and maintain your business network
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiUsers size={20} />} label="Total Contacts" value={mockContacts.length} sub={`${active} active`} accent="#1D4ED8" />
        <StatCard icon={<FiBriefcase size={20} />} label="Clients" value={clients} sub="Active accounts" accent="#16A34A" />
        <StatCard icon={<FiStar size={20} />} label="Leads" value={leads} sub="In nurture pipeline" accent="#D97706" />
        <StatCard icon={<FiUsers size={20} />} label="Partners" value={partners} sub="Collaborative network" accent="#7C3AED" />
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categoryFilters.map(f => {
              const s = categoryStyle[f] || { bg: '#1D4ED8', color: '#fff' };
              const active = categoryFilter === f;
              return (
                <button key={f} onClick={() => { setCategoryFilter(f); setPage(1); }}
                  style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    backgroundColor: active ? '#1D4ED8' : '#F1F5F9', color: active ? '#fff' : '#64748B' }}>
                  {f}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative' }}>
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search contacts, companies..." style={{ paddingLeft: '34px', width: '260px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No contacts found."
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Contact" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Full Name"><Input placeholder="First and last name" /></FormField>
            <FormField label="Job Title"><Input placeholder="e.g. Procurement Manager" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Company"><Input placeholder="Company or organisation" /></FormField>
            <FormField label="Category">
              <select className="form-input">{CONTACT_CATEGORIES.map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Email Address"><Input type="email" placeholder="name@company.com" /></FormField>
            <FormField label="Phone Number"><Input placeholder="+234 000 000 0000" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Sector">
              <select className="form-input">{['Oil & Gas', 'Petrochemical', 'Chemical', 'Power', 'Government', 'Consulting', 'Other'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
            <FormField label="Location"><Input placeholder="City / State" /></FormField>
          </div>
          <FormField label="Owner / BD Manager"><Input placeholder="Responsible team member" /></FormField>
          <FormField label="Notes"><Textarea placeholder="Any relevant notes about this contact..." rows={2} /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Contact added to CRM', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
              Add Contact
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
