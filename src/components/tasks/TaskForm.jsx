import { useEffect, useState } from 'react';
import { FiPaperclip, FiX, FiDownload } from 'react-icons/fi';
import Drawer from '../ui/Drawer';
import Modal from '../ui/Modal';
import { FormField, Input, Select, Textarea, DatePicker } from '../ui/FormField';
import FileDrop from '../documents/FileDrop';
import { fieldErrors, formatFileSize, openDownloadUrl } from '../documents/fileHelpers';
import { tasksService } from '../../services/tasks.service';
import { apiError, unwrap } from '../../services/apiHelpers';
import { usePermission } from '../../hooks/usePermission';
import { ALL_PRIORITIES, PRIORITY_LABEL, STATUS_KEYS, STATUS_LABEL, emptyTaskForm, formFromTask } from './taskUtils';

const statusOptions = STATUS_KEYS.map((key) => ({ value: key, label: STATUS_LABEL[key] }));

function TaskFormPanel({ mode, task, module, config, onClose, onSaved, notify }) {
  const canUpdate = usePermission('core.task.update');
  const isEdit = mode === 'edit';
  const { fields, labels } = config;

  const [form, setForm] = useState(() => (isEdit && task ? formFromTask(task) : emptyTaskForm));
  const [status, setStatus] = useState('todo');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activityCache, setActivityCache] = useState({});

  useEffect(() => {
    tasksService.assignees({ limit: 100 })
      .then((res) => setAssignees(unwrap(res) || []))
      .catch((err) => notify(apiError(err, 'Could not load the list of people'), 'error'));
    if (fields.project) {
      tasksService.projects()
        .then((res) => setProjects(res.data.data || []))
        .catch((err) => notify(apiError(err, 'Could not load projects'), 'error'));
    }
    if (isEdit && task && fields.attachments) {
      tasksService.attachments(task._id)
        .then((res) => setExisting(unwrap(res) || []))
        .catch(() => setExisting([]));
    }
  }, [isEdit, task, fields.project, fields.attachments, notify]);

  useEffect(() => {
    if (!fields.project || !form.projectId || activityCache[form.projectId]) return;
    const projectId = form.projectId;
    tasksService.projectActivities(projectId)
      .then((res) => {
        const rows = unwrap(res);
        setActivityCache((cache) => ({ ...cache, [projectId]: Array.isArray(rows) ? rows : [] }));
      })
      .catch(() => setActivityCache((cache) => ({ ...cache, [projectId]: [] })));
  }, [fields.project, form.projectId, activityCache]);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const assigneeOptions = (() => {
    const options = assignees.map((user) => ({ value: user._id, label: user.fullName }));
    const current = task?.assigneeId;
    if (isEdit && current?._id && !options.some((o) => o.value === current._id)) {
      options.unshift({ value: current._id, label: [current.firstName, current.lastName].filter(Boolean).join(' ') || current.email });
    }
    return options;
  })();

  const validate = () => {
    const problems = {};
    if (form.title.trim().length < 3) problems.title = 'Task name must be at least 3 characters';
    if (!form.assigneeId) problems.assigneeId = 'Choose who this task is assigned to';
    if (fields.project && !form.projectId) problems.projectId = 'Choose a project';
    if (fields.project && !form.linkedActivityId) problems.linkedActivityId = 'Choose the linked activity';
    if (config.relatedRequired && !form.relatedTo.trim()) problems.relatedTo = 'This field is required';
    if (config.dueRequired && !form.dueDate) problems.dueDate = 'Choose a due date';
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) problems.startDate = 'Start date must be on or before the due date';
    return problems;
  };

  const buildPayload = () => {
    const payload = { title: form.title.trim(), assigneeId: form.assigneeId, priority: form.priority };
    const optional = (key, value) => {
      if (value) payload[key] = value;
      else if (isEdit) payload[key] = null;
    };
    if (fields.related) optional('relatedTo', form.relatedTo.trim());
    if (fields.startDate) optional('startDate', form.startDate);
    optional('dueDate', form.dueDate);
    optional('description', form.description.trim());
    if (fields.project) {
      payload.projectId = form.projectId;
      payload.linkedActivityId = form.linkedActivityId;
    }
    if (!isEdit) {
      payload.module = module;
      if (fields.status && status !== 'todo') payload.status = status;
    }
    return payload;
  };

  const submit = async () => {
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(true);
    try {
      const payload = buildPayload();
      const res = isEdit ? await tasksService.update(task._id, payload) : await tasksService.create(payload);
      const saved = unwrap(res);

      const failed = [];
      for (const file of files) {
        try {
          await tasksService.uploadAttachment(saved._id, file);
        } catch (err) {
          failed.push(`${file.name} (${apiError(err, 'upload failed')})`);
        }
      }
      if (failed.length) notify(`Task saved, but these files were not attached: ${failed.join('; ')}`, 'error');
      else notify(isEdit ? 'Task updated successfully' : 'Task assigned successfully', 'success');
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      notify(apiError(err, 'Failed to save task'), 'error');
      setSaving(false);
    }
  };

  const removeExisting = async (attachment) => {
    try {
      await tasksService.removeAttachment(task._id, attachment._id);
      setExisting((list) => list.filter((a) => a._id !== attachment._id));
    } catch (err) {
      notify(apiError(err, 'Failed to remove attachment'), 'error');
    }
  };

  const downloadExisting = async (attachment) => {
    try {
      const res = await tasksService.downloadAttachment(task._id, attachment._id);
      openDownloadUrl(unwrap(res)?.url);
    } catch (err) {
      notify(apiError(err, 'Failed to download attachment'), 'error');
    }
  };

  const priorityOptions = (config.priorities || ALL_PRIORITIES).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }));
  const activities = form.projectId ? activityCache[form.projectId] || [] : [];
  const activityOptions = activities.map((a) => ({
    value: a._id,
    label: a.wbsCode ? `${a.activityName} (WBS ${a.wbsCode})` : a.activityName,
  }));
  const projectOptions = projects.map((p) => ({ value: p._id, label: p.projectName }));

  const titleText = isEdit ? 'Edit Task' : config.assignTitle || 'Assign Task';
  const submitText = isEdit ? 'Save Changes' : config.createLabel || 'Assign Task';

  const taskIdField = (
    <FormField label="TASK ID">
      <Input value={isEdit ? task?.taskNo || '' : 'Assigned on save'} disabled style={{ backgroundColor: '#F1F5F9' }} />
    </FormField>
  );
  const assigneeField = (
    <FormField label={labels.assignee} required error={errors.assigneeId}>
      <Select value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} options={assigneeOptions} placeholder="Select" searchable error={!!errors.assigneeId} />
    </FormField>
  );
  const priorityField = (
    <FormField label="PRIORITY" required error={errors.priority}>
      <Select value={form.priority} onChange={(e) => set('priority', e.target.value)} options={priorityOptions} />
    </FormField>
  );
  const startField = fields.startDate && (
    <FormField label="START DATE" error={errors.startDate}>
      <DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={!!errors.startDate} />
    </FormField>
  );
  const dueField = (
    <FormField label={labels.due} required={config.dueRequired} error={errors.dueDate}>
      <DatePicker value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={!!errors.dueDate} />
    </FormField>
  );
  const statusField = fields.status && !isEdit && (
    <FormField label="STATUS">
      <Select value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
    </FormField>
  );
  const relatedOptions = config.relatedOptions
    ? [
        { value: '', label: 'None' },
        ...(form.relatedTo && !config.relatedOptions.includes(form.relatedTo) ? [{ value: form.relatedTo, label: form.relatedTo }] : []),
        ...config.relatedOptions.map((o) => ({ value: o, label: o })),
      ]
    : null;
  const relatedField = fields.related && (
    <FormField label={config.relatedRequired ? 'RELATED TO' : 'RELATED TO (OPTIONAL)'} required={config.relatedRequired} error={errors.relatedTo}>
      {relatedOptions ? (
        <Select value={form.relatedTo} onChange={(e) => set('relatedTo', e.target.value)} options={relatedOptions} placeholder="Select" />
      ) : (
        <Input value={form.relatedTo} onChange={(e) => set('relatedTo', e.target.value)} placeholder={config.relatedPlaceholder || ''} maxLength={150} error={!!errors.relatedTo} />
      )}
    </FormField>
  );
  const row = (a, b) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {a || <div />}
      {b || <div />}
    </div>
  );

  let layout;
  if (fields.project) {
    layout = (
      <>
        {row(
          <FormField label="PROJECT" required error={errors.projectId}>
            <Select
              value={form.projectId}
              onChange={(e) => setForm((c) => ({ ...c, projectId: e.target.value, linkedActivityId: '' }))}
              options={projectOptions}
              placeholder="Select"
              searchable
              error={!!errors.projectId}
            />
          </FormField>,
          <FormField label="LINKED ACTIVITY" required error={errors.linkedActivityId}>
            <Select
              value={form.linkedActivityId}
              onChange={(e) => set('linkedActivityId', e.target.value)}
              options={activityOptions}
              placeholder={form.projectId ? 'Select' : 'Choose a project first'}
              disabled={!form.projectId}
              error={!!errors.linkedActivityId}
            />
          </FormField>,
        )}
        {row(assigneeField, startField)}
        {row(dueField, priorityField)}
      </>
    );
  } else if (config.layout === 'compact') {
    layout = (
      <>
        {row(assigneeField, priorityField)}
        {dueField}
        {statusField}
      </>
    );
  } else if (config.layout === 'admin') {
    layout = (
      <>
        {row(assigneeField, dueField)}
        {row(priorityField, statusField)}
        {relatedField}
      </>
    );
  } else {
    layout = (
      <>
        {row(taskIdField, assigneeField)}
        {fields.related ? row(relatedField, priorityField) : row(priorityField, startField)}
        {fields.related ? row(startField, dueField) : dueField}
      </>
    );
  }

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FormField label={labels.title} required error={errors.title}>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={config.titlePlaceholder} maxLength={300} error={!!errors.title} />
      </FormField>

      {layout}

      <FormField label={labels.description} error={errors.description}>
        <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={config.descriptionPlaceholder || 'Insert notes on deliverables…'} maxLength={2000} error={!!errors.description} />
      </FormField>

      {fields.attachments && (
        <FormField label="ATTACH DOCUMENTS">
          {isEdit && existing.map((attachment) => (
            <div key={attachment._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#fff', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#334155' }}>
                <FiPaperclip size={14} color="#64748B" /> {attachment.originalName} ({formatFileSize(attachment.sizeBytes)})
              </span>
              <span style={{ display: 'inline-flex', gap: 8 }}>
                <button type="button" title="Download" onClick={() => downloadExisting(attachment)} style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex' }}><FiDownload size={14} /></button>
                {canUpdate && (
                  <button type="button" title="Remove" onClick={() => removeExisting(attachment)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex' }}><FiX size={14} /></button>
                )}
              </span>
            </div>
          ))}
          <FileDrop files={files} onChange={setFiles} onError={(m) => notify(m, 'error')} multiple />
        </FormField>
      )}
    </div>
  );

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: config.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving…' : submitText}
      </button>
    </>
  );

  if (config.formStyle === 'drawer') {
    return (
      <Drawer isOpen onClose={onClose} title={titleText} subtitle={config.formSubtitle} width="500px" footer={footer}>
        {body}
      </Drawer>
    );
  }
  return (
    <Modal isOpen onClose={onClose} title={titleText} subtitle={config.formSubtitle} maxWidth="560px" footer={footer}>
      {body}
    </Modal>
  );
}

/** Mounted only while open (and keyed per task), so every open starts from fresh form state. */
export default function TaskForm({ open, mode, task, ...rest }) {
  if (!open) return null;
  return <TaskFormPanel key={`${mode}-${task?._id || 'new'}`} mode={mode} task={task} {...rest} />;
}
