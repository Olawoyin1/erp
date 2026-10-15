import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiFilter, FiRefreshCw, FiArrowDown, FiArrowUp, FiSearch, FiInbox, FiEdit3, FiSend, FiArchive, FiPaperclip, FiCheck, FiDownload, FiPrinter, FiTrash2, FiCornerUpRight, FiRotateCcw, FiFileText } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { admMemosSlice } from '../../store/administration/slices';
import { apiError } from '../../services/apiHelpers';
import { memoService } from '../../services/admin.service';
import { countFilters, fieldErrorsOf, formatDateTime, saveBlob, statusLabel, uploadStagedFiles } from '../procurement/shared/procUtils';
import { useProcList } from '../procurement/shared/procHooks';
import {
  ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, PageHeader, PrimaryButton, SecondaryButton, Tag,
} from '../procurement/shared/ProcUi';
import { AttachField, DocumentList } from '../procurement/shared/ProcExtras';
import { useAdminLookups } from './shared/admHooks';
import MemoTargetPicker from './memos/MemoTargetPicker';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: FiInbox },
  { id: 'drafts', label: 'Drafts', icon: FiEdit3 },
  { id: 'sent', label: 'Sent', icon: FiSend },
  { id: 'archived', label: 'Archived', icon: FiArchive },
];
const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'confidential', label: 'Confidential' },
];
const PRIORITY_TONE = { high: 'red', confidential: 'purple' };

const shortDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '');
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const labels = (targets) => (targets || []).map((t) => t.label).join(', ');

function printPdf(blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60000);
  };
  document.body.appendChild(frame);
}

function ComposeModal({ draft, lookups, me, onClose, onDone }) {
  const editing = Boolean(draft);
  const [form, setForm] = useState(() => ({
    to: draft?.to || [],
    cc: draft?.cc || [],
    subject: draft?.subject || '',
    priority: draft?.priority || 'normal',
    body: draft?.body || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.to.length) next.to = 'Choose at least one recipient';
    if (form.subject.trim().length < 3) next.subject = 'Enter a subject of at least 3 characters';
    if (!form.body.trim()) next.body = 'Write the memo';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (send) => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    let id = draft?._id;
    try {
      const payload = { to: form.to, cc: form.cc, subject: form.subject.trim(), priority: form.priority, body: form.body.trim() };
      if (editing) await memoService.update(id, payload);
      else id = (await memoService.create(payload)).data?.data?._id;
      let note = '';
      if (files.length && id) {
        const failed = await uploadStagedFiles(memoService, id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      if (send) await memoService.send(id);
      onDone(`${send ? 'Memo sent' : 'Memo saved as draft'}.${note}`, send ? 'sent' : 'drafts');
    } catch (err) {
      setError(apiError(err, send ? 'The memo could not be sent' : 'The memo could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Draft' : 'Compose Memo'}
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>Save as Draft</SecondaryButton>
          <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Working…' : 'Send Memo'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Memo reference" help={editing ? undefined : 'Assigned automatically when the memo is saved.'}>
            <Input value={editing ? draft.memoReference : 'Assigned on save'} disabled />
          </Field>
          <Field label="From">
            <Input value={me ? `${me.fullName}${me.position ? ` · ${me.position}` : ''}` : ''} disabled />
          </Field>
        </div>
        <Field label="To" required error={errors.to}>
          <MemoTargetPicker value={form.to} onChange={(v) => set('to', v)} lookups={lookups} placeholder="Add a recipient" error={errors.to} />
        </Field>
        <Field label="CC (optional)" error={errors.cc}>
          <MemoTargetPicker value={form.cc} onChange={(v) => set('cc', v)} lookups={lookups} placeholder="Add a person to copy" />
        </Field>
        <Field label="Subject" required error={errors.subject}>
          <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} error={Boolean(errors.subject)} />
        </Field>
        <Field label="Priority" required error={errors.priority}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {PRIORITIES.map((p) => (
              <label key={p.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
                <input type="radio" name="memo-priority" checked={form.priority === p.value} onChange={() => set('priority', p.value)} style={{ accentColor: '#1E3A8A' }} />
                {p.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Description / notes" required error={errors.body}>
          <Textarea rows={6} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Add any context…" error={Boolean(errors.body)} />
        </Field>
        {editing ? (
          <DocumentList key={draft._id} api={memoService} id={draft._id} canUpload title="Attachments" />
        ) : (
          <Field label="Attachments">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ForwardModal({ memo, lookups, onClose, onDone }) {
  const [to, setTo] = useState([]);
  const [cc, setCc] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    setError('');
    if (!to.length) { setErrors({ to: 'Choose at least one recipient' }); return; }
    setErrors({});
    setBusy(true);
    try {
      await memoService.forward(memo._id, { to, cc, ...(note.trim() ? { additionalNote: note.trim() } : {}) });
      onDone('Memo forwarded');
    } catch (err) {
      setError(apiError(err, 'The memo could not be forwarded'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Forward Memo"
      subtitle={memo.subject}
      maxWidth="600px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy} icon={<FiCornerUpRight size={14} />}>{busy ? 'Forwarding…' : 'Forward'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="To" required error={errors.to}><MemoTargetPicker value={to} onChange={setTo} lookups={lookups} error={errors.to} /></Field>
        <Field label="CC (optional)"><MemoTargetPicker value={cc} onChange={setCc} lookups={lookups} /></Field>
        <Field label="Additional note (optional)" error={errors.additionalNote}>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note above the original memo…" />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function MemoRow({ memo, folder, active, onSelect }) {
  const unread = folder === 'inbox' && !memo.readAt;
  const who = folder === 'sent' ? `To: ${labels(memo.to)}` : folder === 'drafts' ? 'Draft' : memo.sender?.name;
  const date = folder === 'drafts' ? memo.updatedAt : memo.sentAt;
  return (
    <button
      type="button"
      onClick={() => onSelect(memo)}
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: '1px solid #F1F5F9', borderLeft: active ? '3px solid #1E3A8A' : '3px solid transparent', background: active ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer', fontFamily: 'var(--font)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.8rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: unread ? 700 : 600, color: '#0F172A', minWidth: 0 }}>
          {unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{who}</span>
        </span>
        <span style={{ color: '#64748B', flexShrink: 0 }}>{shortDate(date)}</span>
      </div>
      <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: unread ? 700 : 500, margin: '4px 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memo.subject}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {memo.departmentName && <Tag>{memo.departmentName}</Tag>}
        {PRIORITY_TONE[memo.priority] && <Tag tone={PRIORITY_TONE[memo.priority]}>{statusLabel(memo.priority)}</Tag>}
        {memo.attachmentCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: '#64748B' }}><FiPaperclip size={11} />{memo.attachmentCount}</span>}
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94A3B8' }}>{memo.memoReference}</span>
      </div>
    </button>
  );
}

function ReadingPane({ state, folder, perms, busy, onAction }) {
  if (!state.id) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94A3B8', minHeight: 320 }}>
        <FiFileText size={28} />
        <span style={{ fontSize: '0.875rem' }}>Select a memo to read it.</span>
      </div>
    );
  }
  if (state.loading) return <div style={{ padding: 24, color: '#64748B' }}>Loading memo…</div>;
  if (state.error) return <div style={{ padding: 24 }}><FormError message={state.error} /></div>;
  const m = state.record;
  const isDraft = m.status === 'draft';
  const acknowledged = Boolean(m.recipientState?.acknowledgedAt);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 520 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{m.subject}</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {PRIORITY_TONE[m.priority] && <Tag tone={PRIORITY_TONE[m.priority]}>{statusLabel(m.priority)}</Tag>}
            {m.departmentName && <Tag>{m.departmentName}</Tag>}
            <Tag>{m.memoReference}</Tag>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>From</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#DBEAFE', color: '#1E40AF', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(m.sender?.name)}</span>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>{m.sender?.name}<div style={{ fontWeight: 400, fontSize: '0.74rem', color: '#64748B' }}>{m.sender?.position}</div></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>To</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{(m.to || []).map((t) => <Tag key={`${t.type}${t.refId || ''}`}>{t.label}</Tag>)}</div>
            {m.cc?.length > 0 && <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 6 }}>CC: {labels(m.cc)}</div>}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Date & time</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>{formatDateTime(m.sentAt || m.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Department</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>{m.departmentName || '—'}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, fontSize: '0.875rem', color: '#1E293B', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
        <DocumentList key={`${m._id}-${state.nonce}`} api={memoService} id={m._id} canUpload={isDraft && m.isSender && perms.send} title={`Attachments (${m.attachmentCount ?? 0})`} />
      </div>
      <div style={{ borderTop: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', background: '#FFFFFF' }}>
        {folder === 'inbox' && (
          <PrimaryButton icon={<FiCheck size={14} />} disabled={busy || acknowledged} onClick={() => onAction('acknowledge', m)}>{acknowledged ? 'Acknowledged' : 'Acknowledge'}</PrimaryButton>
        )}
        {isDraft && perms.send && <PrimaryButton icon={<FiEdit3 size={14} />} disabled={busy} onClick={() => onAction('edit', m)}>Edit Draft</PrimaryButton>}
        {isDraft && perms.send && <SecondaryButton icon={<FiSend size={14} />} disabled={busy} onClick={() => onAction('send', m)}>Send</SecondaryButton>}
        {!isDraft && perms.send && <SecondaryButton icon={<FiCornerUpRight size={14} />} disabled={busy} onClick={() => onAction('forward', m)}>Forward</SecondaryButton>}
        {!isDraft && <SecondaryButton icon={<FiDownload size={14} />} disabled={busy} onClick={() => onAction('pdf', m)}>Download PDF</SecondaryButton>}
        {!isDraft && <SecondaryButton icon={<FiPrinter size={14} />} disabled={busy} onClick={() => onAction('print', m)}>Print</SecondaryButton>}
        {folder === 'inbox' && <SecondaryButton icon={<FiArchive size={14} />} disabled={busy} onClick={() => onAction('archive', m)}>Archive</SecondaryButton>}
        {folder === 'archived' && <SecondaryButton icon={<FiRotateCcw size={14} />} disabled={busy} onClick={() => onAction('unarchive', m)}>Move to Inbox</SecondaryButton>}
        {(folder === 'inbox' || folder === 'archived' || isDraft) && <SecondaryButton danger icon={<FiTrash2 size={14} />} disabled={busy} onClick={() => onAction('delete', m)}>Delete</SecondaryButton>}
      </div>
    </div>
  );
}

function MemoCentre({ folder, perms, lookups, me, counts, reloadCounts, showToast, onCompose, onFolder }) {
  const list = useProcList(admMemosSlice, { fixed: { folder }, initialFilters: { priority: '', dateFrom: '', dateTo: '', sort: 'newest' }, withStats: false });
  const [state, setState] = useState({ id: null, record: null, loading: false, error: '', nonce: 0 });
  const [filterOpen, setFilterOpen] = useState(false);
  const [forwardFor, setForwardFor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [editDraft, setEditDraft] = useState(null);

  const sort = list.filters.sort || 'newest';
  const refreshAll = useCallback(() => { list.reload(); reloadCounts(); }, [list, reloadCounts]);

  const open = useCallback(async (id, wasUnread) => {
    setState((s) => ({ id, record: null, loading: true, error: '', nonce: s.nonce + 1 }));
    try {
      const res = await memoService.get(id);
      setState((s) => ({ ...s, id, record: res.data?.data, loading: false, error: '' }));
      if (wasUnread) refreshAll();
    } catch (err) {
      setState((s) => ({ ...s, id, record: null, loading: false, error: apiError(err, 'Could not open the memo') }));
    }
  }, [refreshAll]);

  const clearSelection = () => setState({ id: null, record: null, loading: false, error: '', nonce: 0 });

  const run = async (call, success, { clear = false, reopen = false } = {}) => {
    setBusy(true);
    setActionError('');
    try {
      await call();
      setConfirm(null);
      showToast(success, 'success');
      if (clear) clearSelection();
      else if (reopen && state.id) await open(state.id, false);
      refreshAll();
    } catch (err) {
      const message = apiError(err, 'The action failed');
      setActionError(message);
      if (!confirm) showToast(message, 'error');
    }
    setBusy(false);
  };

  const onAction = async (type, memo) => {
    if (type === 'acknowledge') await run(() => memoService.acknowledge(memo._id), 'Memo acknowledged', { reopen: true });
    else if (type === 'archive') await run(() => memoService.archive(memo._id), 'Memo archived', { clear: true });
    else if (type === 'unarchive') await run(() => memoService.unarchive(memo._id), 'Memo moved back to the inbox', { clear: true });
    else if (type === 'send') await run(() => memoService.send(memo._id), 'Memo sent', { clear: true });
    else if (type === 'edit') setEditDraft(memo);
    else if (type === 'forward') setForwardFor(memo);
    else if (type === 'delete') { setActionError(''); setConfirm(memo); }
    else if (type === 'pdf' || type === 'print') {
      setBusy(true);
      try {
        const res = await memoService.pdf(memo._id);
        if (type === 'pdf') saveBlob(res.data, `${memo.memoReference}.pdf`);
        else printPdf(res.data);
      } catch (err) {
        showToast(apiError(err, 'The PDF could not be produced'), 'error');
      }
      setBusy(false);
    }
  };

  const unreadCount = counts.unread || 0;
  const folderCount = { inbox: unreadCount, drafts: counts.drafts, sent: counts.sent, archived: counts.archived };

  return (
    <div className="card" style={{ padding: 0, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '190px minmax(280px, 380px) minmax(0, 1fr)', minHeight: 560, overflowX: 'auto' }}>
        <div style={{ borderRight: '1px solid #E2E8F0', padding: '16px 10px', background: '#F8FAFC' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', padding: '0 8px 10px' }}>MEMO & CIRCULAR CENTRE</div>
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const count = folderCount[f.id];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFolder(f.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.84rem', fontWeight: 600, background: folder === f.id ? '#DBEAFE' : 'transparent', color: folder === f.id ? '#1E3A8A' : '#475569', textAlign: 'left' }}
              >
                <Icon size={15} />
                <span style={{ flex: 1 }}>{f.label}</span>
                {count > 0 && <span style={{ background: f.id === 'inbox' ? '#1E3A8A' : '#E2E8F0', color: f.id === 'inbox' ? '#FFFFFF' : '#475569', borderRadius: 999, fontSize: '0.7rem', padding: '1px 8px', fontWeight: 700 }}>{count}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <Input value={list.searchText} onChange={(e) => list.onSearch(e.target.value)} placeholder="Search memos..." style={{ paddingLeft: 34 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <SecondaryButton icon={<FiFilter size={13} />} onClick={() => setFilterOpen(true)} style={{ padding: '6px 10px' }}>Filter{countFilters({ priority: list.filters.priority, dateFrom: list.filters.dateFrom, dateTo: list.filters.dateTo }) ? ` (${countFilters({ priority: list.filters.priority, dateFrom: list.filters.dateFrom, dateTo: list.filters.dateTo })})` : ''}</SecondaryButton>
              <SecondaryButton icon={sort === 'newest' ? <FiArrowDown size={13} /> : <FiArrowUp size={13} />} onClick={() => list.applyFilters({ ...list.filters, sort: sort === 'newest' ? 'oldest' : 'newest' })} style={{ padding: '6px 10px' }}>{sort === 'newest' ? 'Newest' : 'Oldest'}</SecondaryButton>
              <SecondaryButton icon={<FiRefreshCw size={13} />} onClick={refreshAll} style={{ padding: '6px 10px' }}>Refresh</SecondaryButton>
              {perms.send && <PrimaryButton icon={<FiPlus size={14} />} onClick={onCompose} style={{ padding: '6px 12px', marginLeft: 'auto' }}>New Memo</PrimaryButton>}
            </div>
          </div>
          <div style={{ padding: '8px 14px', fontSize: '0.66rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
            {FOLDERS.find((f) => f.id === folder).label.toUpperCase()} · {list.meta?.total ?? 0} MEMO{list.meta?.total === 1 ? '' : 'S'}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 520 }}>
            <DataState loading={list.loading} error={list.error} empty={!list.items.length} emptyText={`No memos in ${folder}.`} onRetry={list.reload}>
              {list.items.map((memo) => (
                <MemoRow key={memo._id} memo={memo} folder={folder} active={state.id === memo._id} onSelect={(row) => open(row._id, folder === 'inbox' && !row.readAt)} />
              ))}
            </DataState>
          </div>
          {!list.loading && !list.error && list.meta && list.meta.totalPages > 1 && (
            <div style={{ padding: 8 }}><Pagination currentPage={list.page} totalPages={list.meta.totalPages} onPageChange={list.setPage} /></div>
          )}
        </div>

        <ReadingPane state={state} folder={folder} perms={perms} busy={busy} onAction={onAction} />
      </div>

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Memos"
        subtitle="Narrow the folder by priority and date."
        fields={[
          { key: 'priority', label: 'Priority', options: PRIORITIES },
          { key: 'dateFrom', label: folder === 'drafts' ? 'Created from' : 'Sent from', type: 'date' },
          { key: 'dateTo', label: folder === 'drafts' ? 'Created to' : 'Sent to', type: 'date' },
        ]}
        values={list.filters}
        onApply={(next) => list.applyFilters({ ...next, sort })}
      />

      {forwardFor && (
        <ForwardModal
          memo={forwardFor}
          lookups={lookups}
          onClose={() => setForwardFor(null)}
          onDone={(message) => { setForwardFor(null); showToast(message, 'success'); refreshAll(); }}
        />
      )}

      {editDraft && (
        <ComposeModal
          draft={editDraft}
          lookups={lookups}
          me={me}
          onClose={() => setEditDraft(null)}
          onDone={(message, target) => { setEditDraft(null); clearSelection(); showToast(message, 'success'); if (target !== folder) onFolder(target); refreshAll(); }}
        />
      )}

      {confirm && (
        <ConfirmModal
          title="Delete Memo?"
          message={confirm.status === 'draft' ? 'This discards the draft and its attachments.' : 'This removes the memo from your mailbox. Other recipients keep their copy.'}
          confirmLabel="Delete"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => run(() => memoService.remove(confirm._id), 'Memo deleted', { clear: true })}
        />
      )}
    </div>
  );
}

export default function Memos() {
  const { can } = usePermissions();
  const perms = { send: can('administration.memo.send') };
  const { lookups } = useAdminLookups(['me', 'departments', 'roles', 'users']);
  const { toast, showToast, hideToast } = useToast();
  const [folder, setFolder] = useState('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [counts, setCounts] = useState({ inbox: 0, unread: 0, drafts: 0, sent: 0, archived: 0 });
  const [tick, setTick] = useState(0);
  const reloadCounts = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    memoService.counts()
      .then((res) => { if (!cancelled) setCounts(res.data?.data || {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Memos & Circulars" subtitle="Issue, track, and manage internal communications across departments" />

      <MemoCentre
        key={folder}
        folder={folder}
        perms={perms}
        lookups={lookups}
        me={lookups.me}
        counts={counts}
        reloadCounts={reloadCounts}
        showToast={showToast}
        onCompose={() => setComposeOpen(true)}
        onFolder={setFolder}
      />

      {composeOpen && (
        <ComposeModal
          lookups={lookups}
          me={lookups.me}
          onClose={() => setComposeOpen(false)}
          onDone={(message, target) => { setComposeOpen(false); showToast(message, 'success'); setFolder(target); reloadCounts(); }}
        />
      )}
    </div>
  );
}
