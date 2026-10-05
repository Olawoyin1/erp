import React, { useState } from 'react';
import { FiSearch, FiFilter, FiPlus, FiRefreshCw, FiCheck, FiSend, FiArchive, FiTrash2, FiDownload, FiPrinter, FiPaperclip } from 'react-icons/fi';
import { mockMemos } from '../../data/mockAdmin';

const folders = ['Inbox', 'Drafts', 'Sent', 'Archived'];

export default function Memos() {
  const [activeFolder, setActiveFolder] = useState('Inbox');
  const [selectedMemo, setSelectedMemo] = useState(mockMemos[0]);
  const [search, setSearch] = useState('');

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
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Memos & Circulars</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Issue, track, and manage internal communications across departments</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', minHeight: '560px' }}>
        {/* Left sidebar – folder list */}
        <div className="card" style={{ width: 200, minWidth: 180, padding: '16px', flexShrink: 0 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: '0 0 10px', textTransform: 'uppercase' }}>Memo & Circular Centre</p>
          {folders.map(f => (
            <button key={f} style={folderIconStyle(f)} onClick={() => { setActiveFolder(f); setSelectedMemo(null); }}>
              <span>{f}</span>
              {f === 'Inbox' && <span style={{ background: '#1D4ED8', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>2</span>}
            </button>
          ))}
        </div>

        {/* Middle – memo list */}
        <div className="card" style={{ width: 300, minWidth: 260, padding: 0, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 }} />
                <input placeholder="Search memos..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><FiFilter size={12} /> Filter</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><span>↕</span> Newest</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}><FiRefreshCw size={12} /> Refresh</button>
              <div style={{ marginLeft: 'auto' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: 8, fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
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
          <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>{selectedMemo.subject}</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {selectedMemo.tags.map(t => <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 500 }}>{t}</span>)}
            </div>
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

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: 8, fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                <FiCheck size={14} /> Acknowledge
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #E2E8F0', background: '#fff', color: '#374151', borderRadius: 8, fontSize: '13px', cursor: 'pointer' }}>
                <FiSend size={14} /> Forward
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #E2E8F0', background: '#fff', color: '#374151', borderRadius: 8, fontSize: '13px', cursor: 'pointer' }}>
                <FiDownload size={14} /> Download PDF
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #E2E8F0', background: '#fff', color: '#374151', borderRadius: 8, fontSize: '13px', cursor: 'pointer' }}>
                <FiPrinter size={14} /> Print
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #E2E8F0', background: '#fff', color: '#374151', borderRadius: 8, fontSize: '13px', cursor: 'pointer' }}>
                <FiArchive size={14} /> Archive
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, fontSize: '13px', cursor: 'pointer' }}>
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            <p>Select a memo to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
