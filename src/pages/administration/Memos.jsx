import React, { useState } from 'react';
import { FiSearch, FiFilter, FiPlus, FiRefreshCw, FiCheck, FiSend, FiArchive, FiTrash2, FiDownload, FiPrinter, FiPaperclip } from 'react-icons/fi';
import { mockMemos } from '../../data/mockAdmin';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import { Input, FormField, Select, Textarea } from '../../components/ui/FormField';

const folders = ['Inbox', 'Drafts', 'Sent', 'Archived'];

export default function Memos() {
  const [activeFolder, setActiveFolder] = useState('Inbox');
  const [selectedMemo, setSelectedMemo] = useState(mockMemos[0]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({
    memoRef: 'PGSL/MEMO/2025/042',
    from: 'Emeka Okafor · Admin Manager',
    to: 'All Staff',
    cc: '',
    subject: '',
    priority: 'Normal',
    description: '',
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSend = () => {
    if (!form.subject.trim() || !form.to.trim()) {
      showToast('Please fill in the To and Subject fields.');
      return;
    }
    setShowCompose(false);
    setForm({ memoRef: 'PGSL/MEMO/2025/043', from: 'Emeka Okafor · Admin Manager', to: 'All Staff', cc: '', subject: '', priority: 'Normal', description: '' });
    showToast('Memo sent successfully!');
  };

  const handleSaveDraft = () => {
    setShowCompose(false);
    setForm({ memoRef: 'PGSL/MEMO/2025/043', from: 'Emeka Okafor · Admin Manager', to: 'All Staff', cc: '', subject: '', priority: 'Normal', description: '' });
    showToast('Memo saved to Drafts.');
  };

  const folderMemos = mockMemos.filter(m => m.folder === activeFolder);
  const filtered = folderMemos.filter(m =>
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const folderIconStyle = (f) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
    cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
    background: activeFolder === f ? '#EFF6FF' : 'transparent',
    color: activeFolder === f ? '#1D4ED8' : '#374151',
    border: 'none', width: '100%', textAlign: 'left',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Memos & Circulars</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Issue, track, and manage internal communications across departments</p>
      </div>

      <div className="card" style={{ display: 'flex', padding: 0, minHeight: '560px', overflow: 'hidden' }}>

        {/* Left sidebar – folder list */}
        <div style={{ width: 200, minWidth: 180, padding: '16px', flexShrink: 0, borderRight: '1px solid #E2E8F0', background: '#FAFAFA' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: '0 0 10px', textTransform: 'uppercase' }}>Memo & Circular Centre</p>
          {folders.map(f => (
            <button key={f} style={folderIconStyle(f)} onClick={() => { setActiveFolder(f); setSelectedMemo(null); }}>
              <span>{f}</span>
              {f === 'Inbox' && <span style={{ background: '#1D4ED8', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>2</span>}
            </button>
          ))}
        </div>

        {/* Middle – memo list */}
        <div style={{ width: 300, minWidth: 260, padding: 0, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #E2E8F0', background: '#fff' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 }} />
                <Input placeholder="Search memos..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '30px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><FiFilter size={12} /> Filter</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><span>↕</span> Newest</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><FiRefreshCw size={12} /> Refresh</button>
              <div style={{ marginLeft: 'auto' }}>
                <button onClick={() => setShowCompose(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                  <FiPlus size={12} /> New Memo
                </button>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', padding: '10px 14px 4px', margin: 0 }}>INBOX · {filtered.length} MEMOS</p>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {(filtered.length > 0 ? filtered : mockMemos).map(memo => (
              <div
                key={memo.id}
                onClick={() => setSelectedMemo(memo)}
                style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', background: selectedMemo?.id === memo.id ? '#F0F4FF' : '#fff', borderLeft: selectedMemo?.id === memo.id ? '3px solid #1D4ED8' : '3px solid transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{memo.from}</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>04 Jul</span>
                </div>
                <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px', fontWeight: memo.status === 'Unread' ? 600 : 400, lineHeight: 1.4 }}>
                  {memo.status === 'Unread' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#1D4ED8', marginRight: 6, verticalAlign: 'middle' }}></span>}
                  {memo.subject}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {memo.tags.map(t => (
                    <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 500 }}>{t}</span>
                  ))}
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626', fontWeight: 500 }}>High</span>
                  {memo.attachments > 0 && (
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 2 }}><FiPaperclip size={10} /> {memo.attachments}</span>
                  )}
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>{memo.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – memo detail */}
        {selectedMemo ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
            {/* Detail Header with Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>{selectedMemo.subject}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedMemo.tags.map(t => <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 500 }}>{t}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => showToast('Acknowledged!')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                  <FiCheck size={14} /> Acknowledge
                </button>
                <button onClick={() => showToast('Forwarding memo...')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 6, fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                  <FiSend size={14} /> Forward
                </button>
                <button onClick={() => showToast('Downloading PDF...')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 6, fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                  <FiDownload size={14} /> PDF
                </button>
                <RowMenu items={[
                  { label: 'Print', icon: <FiPrinter size={14} />, action: () => showToast('Printing...') },
                  { label: 'Archive', icon: <FiArchive size={14} />, action: () => showToast('Archived memo') },
                  { label: 'Delete', icon: <FiTrash2 size={14} />, color: '#EF4444', action: () => showToast('Memo deleted') }
                ]} />
              </div>
            </div>

            {/* Detail Body */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '10px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>FROM</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                      {selectedMemo.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{selectedMemo.from}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{selectedMemo.fromRole}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' }}>TO</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedMemo.to.map(t => <span key={t} style={{ fontSize: '12px', padding: '2px 10px', background: '#E0E7FF', color: '#4338CA', borderRadius: 20, fontWeight: 500 }}>{t}</span>)}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>DATE & TIME</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0F172A' }}>{selectedMemo.date}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>DEPARTMENT</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0F172A' }}>{selectedMemo.department}</p>
                </div>
              </div>

              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-line', marginBottom: 24 }}>
                {selectedMemo.body}
              </div>

              {selectedMemo.attachments > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiPaperclip size={12} /> ATTACHMENTS ({selectedMemo.attachments})
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 6px', borderRadius: 4, fontSize: '10px', fontWeight: 700 }}>PDF</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#0F172A' }}>Inspection_Rep...</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>2.4 MB</p>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 6px', borderRadius: 4, fontSize: '10px', fontWeight: 700 }}>XLSX</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#0F172A' }}>Non_Conforma...</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>340 KB</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', background: '#fff' }}>
            <p>Select a memo to read</p>
          </div>
        )}
      </div>

      {/* New Memo Compose Drawer */}
      <Drawer
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        title="Compose Memo"
        subtitle="Draft and send a new internal memo or circular"
        width="520px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <button onClick={() => setShowCompose(false)} style={{ padding: '8px 16px', background: 'none', color: '#475569', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveDraft} style={{ padding: '8px 16px', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>
                Save as Draft
              </button>
              <button onClick={handleSend} style={{ padding: '8px 20px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                Send Memo
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Row 1: Memo Reference + From */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Memo Reference" required>
              <Input
                value={form.memoRef}
                onChange={e => setForm(f => ({ ...f, memoRef: e.target.value }))}
              />
            </FormField>
            <FormField label="From" required>
              <Input
                value={form.from}
                onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
              />
            </FormField>
          </div>

          {/* Row 2: To + CC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="To" required>
              <Select
                value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                options={['All Staff', 'HSE Team', 'Project Leads', 'Site Supervisors', 'Safety Officers', 'Management', 'Technical Team', 'Procurement Team']}
              />
            </FormField>
            <FormField label="CC (Optional)">
              <Input
                value={form.cc}
                onChange={e => setForm(f => ({ ...f, cc: e.target.value }))}
              />
            </FormField>
          </div>

          {/* Subject */}
          <FormField label="Subject">
            <Input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </FormField>

          {/* Priority - radio buttons */}
          <div>
            <label style={{ display: 'block', fontSize: '0.688rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Priority *</label>
            <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
              {['Normal', 'High', 'Confidential'].map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#374151', cursor: 'pointer', fontWeight: form.priority === p ? 600 : 400 }}>
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={form.priority === p}
                    onChange={() => setForm(f => ({ ...f, priority: p }))}
                    style={{ accentColor: '#1D4ED8', width: 15, height: 15 }}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {/* Description / Notes */}
          <FormField label="Description / Notes">
            <Textarea
              placeholder="Add any context..."
              rows={5}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </FormField>

          {/* Attachments */}
          <div>
            <label style={{ display: 'block', fontSize: '0.688rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Attachments</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, cursor: 'pointer' }}>
              <FiPaperclip size={14} style={{ color: '#64748B' }} />
              <span style={{ fontSize: '13px', color: '#64748B' }}>Attach file</span>
            </div>
          </div>

        </div>
      </Drawer>
    </div>
  );
}
