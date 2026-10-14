import { useEffect, useState } from 'react';
import { FiList, FiEdit, FiPaperclip, FiDownloadCloud } from 'react-icons/fi';
import Drawer from '../ui/Drawer';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Select } from '../ui/FormField';
import { tasksService } from '../../services/tasks.service';
import { apiError, unwrap } from '../../services/apiHelpers';
import { displayDate, formatFileSize, openDownloadUrl, personName } from '../documents/fileHelpers';
import { usePermission } from '../../hooks/usePermission';
import { PRIORITY_LABEL, PRIORITY_STYLE, STATUS_KEYS, STATUS_LABEL, displayStatus } from './taskUtils';

function Info({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{children}</div>
    </div>
  );
}

function TaskDetailPanel({ taskId, config, onClose, onEdit, onStatusChange, notify }) {
  const canUpdate = usePermission('core.task.update');
  const [task, setTask] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([tasksService.get(taskId), tasksService.attachments(taskId)])
      .then(([detail, files]) => {
        if (cancelled) return;
        setTask(unwrap(detail));
        setAttachments(unwrap(files) || []);
      })
      .catch((err) => { if (!cancelled) setError(apiError(err, 'Failed to load task')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId]);

  const changeStatus = async (status) => {
    if (!task || status === task.status) return;
    const updated = await onStatusChange(task, status);
    if (updated) setTask((current) => ({ ...current, status, isOverdue: status !== 'done' && !!current.dueDate && new Date(current.dueDate) < new Date() }));
  };

  const download = async (attachment) => {
    try {
      const res = await tasksService.downloadAttachment(task._id, attachment._id);
      openDownloadUrl(unwrap(res)?.url);
    } catch (err) {
      notify(apiError(err, 'Failed to download attachment'), 'error');
    }
  };

  const priority = task ? PRIORITY_STYLE[task.priority] : null;
  const labels = config.labels;

  const content = loading ? (
    <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Loading task…</div>
  ) : error ? (
    <div style={{ padding: 16, borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '0.85rem' }}>{error}</div>
  ) : task ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ padding: 8, backgroundColor: '#EFF6FF', borderRadius: 6, color: '#2563EB', display: 'flex' }}><FiList size={20} /></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{task.title}</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Priority:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 12, backgroundColor: priority?.bg, color: priority?.color }}>{PRIORITY_LABEL[task.priority]}</span>
            </div>
            <div style={{ fontSize: '0.813rem', color: '#64748B', marginTop: 4 }}>{personName(task.assigneeId)} • {task.taskNo}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          {canUpdate ? (
            <div style={{ width: 150 }}>
              <Select
                value={task.status}
                onChange={(e) => changeStatus(e.target.value)}
                options={STATUS_KEYS.map((k) => ({ value: k, label: STATUS_LABEL[k] }))}
              />
            </div>
          ) : (
            <Badge status={displayStatus(task)} />
          )}
          {task.isOverdue && task.status !== 'done' && <Badge status="Overdue" />}
        </div>
        {canUpdate && (
          <button
            type="button"
            onClick={() => onEdit(task)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiEdit size={14} /> Edit Task
          </button>
        )}
      </div>

      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Info label={labels.title}>{task.title}</Info>
        <Info label="TASK ID">{task.taskNo}</Info>
        {config.fields.project && <Info label="PROJECT">{task.projectId?.projectName || '—'}</Info>}
        {config.fields.project && (
          <Info label="LINKED ACTIVITY">
            {task.linkedActivityId?.activityName ? `${task.linkedActivityId.activityName}${task.linkedActivityId.wbsCode ? ` (WBS ${task.linkedActivityId.wbsCode})` : ''}` : '—'}
          </Info>
        )}
        <Info label={labels.assignee}>{personName(task.assigneeId)}</Info>
        {config.fields.related && <Info label="RELATED TO">{task.relatedTo || '—'}</Info>}
        <Info label="PRIORITY">{PRIORITY_LABEL[task.priority]}</Info>
        {config.fields.startDate && <Info label="START DATE">{displayDate(task.startDate)}</Info>}
        <Info label={labels.due}>{displayDate(task.dueDate)}</Info>
        <Info label="STATUS">{displayStatus(task)}</Info>
        <Info label="ASSIGNED BY">{personName(task.createdBy)}</Info>
      </div>

      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>{labels.description}</div>
        <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{task.description || 'No description provided.'}</div>
      </div>

      {config.fields.attachments && (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>ATTACHED DOCUMENTS</div>
          {attachments.length === 0 ? (
            <div style={{ fontSize: '0.813rem', color: '#94A3B8' }}>No documents attached.</div>
          ) : attachments.map((attachment) => (
            <div key={attachment._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#334155' }}>
                <FiPaperclip size={14} color="#64748B" /> {attachment.originalName} ({formatFileSize(attachment.sizeBytes)})
              </span>
              <button type="button" className="icon-btn" title="Download" onClick={() => download(attachment)}>
                <FiDownloadCloud size={15} color="#2563EB" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  if (config.viewStyle === 'modal') {
    return <Modal isOpen onClose={onClose} maxWidth="640px">{content}</Modal>;
  }
  return <Drawer isOpen onClose={onClose} title="Task Details" subtitle={task?.taskNo} width="560px">{content}</Drawer>;
}

export default function TaskDetail({ taskId, ...rest }) {
  if (!taskId) return null;
  return <TaskDetailPanel key={taskId} taskId={taskId} {...rest} />;
}
