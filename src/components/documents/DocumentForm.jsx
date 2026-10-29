import { useState } from 'react';
import Drawer from '../ui/Drawer';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import FileDrop from './FileDrop';
import MultiEmployeePicker from '../../pages/hr/MultiEmployeePicker';
import { documentService } from '../../services/documents.service';
import { apiError, unwrap } from '../../services/apiHelpers';
import { fieldErrors, validateUpload } from './fileHelpers';
import { ACCESS_OPTIONS, HR_ACCESS_OPTIONS } from './documentUtils';

const buttonBase = { padding: '8px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' };

function initialForm(mode, doc, config, isHr) {
  if (doc && mode !== 'upload') {
    return {
      title: doc.title || '',
      category: doc.category || '',
      accessLevel: isHr ? 'assigned' : doc.accessLevel || 'all_staff',
      description: mode === 'version' && config.variant === 'controlled' ? '' : doc.description || '',
    };
  }
  return { title: '', category: config.categories?.[0] || '', accessLevel: isHr ? 'assigned' : 'all_staff', description: '' };
}

/** An HR document's assigned employees, as the `{ [id]: employee }` map MultiEmployeePicker owns. */
function initialAssigned(mode, doc) {
  if (!doc || mode === 'upload') return {};
  const list = Array.isArray(doc.assignedTo) ? doc.assignedTo : [];
  return Object.fromEntries(list.filter((e) => e && typeof e === 'object').map((e) => [e._id, e]));
}

function FormPanel({ mode, doc, module, config, onClose, onSaved, notify }) {
  const isHr = module === 'hr';
  const [form, setForm] = useState(() => initialForm(mode, doc, config, isHr));
  const [assigned, setAssigned] = useState(() => initialAssigned(mode, doc));
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(null);

  const controlled = config.variant === 'controlled';
  const plain = config.variant === 'plain';
  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const problems = {};
    if (form.title.trim().length < 3) problems.title = `${plain ? 'Document name' : 'Document title'} must be at least 3 characters`;
    if (!plain && !form.category) problems.category = 'Choose a category';
    if (isHr && Object.keys(assigned).length === 0) problems.assignedTo = 'Choose at least one employee to share this document with';
    if (mode !== 'edit') {
      const fileProblem = validateUpload(file);
      if (fileProblem) problems.file = fileProblem;
    }
    return problems;
  };

  const save = async (submitAfter) => {
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(submitAfter ? 'submit' : 'save');
    try {
      let message;
      if (mode === 'edit') {
        await documentService.update(doc._id, {
          title: form.title.trim(),
          category: form.category,
          accessLevel: form.accessLevel,
          ...(isHr ? { assignedTo: Object.keys(assigned) } : {}),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
        });
        message = 'Document updated';
      } else if (mode === 'version') {
        const body = new FormData();
        body.append('file', file);
        if (controlled) {
          if (form.description.trim()) body.append('note', form.description.trim());
          await documentService.uploadVersion(doc._id, body);
          message = 'New version uploaded';
        } else {
          const metadataChanged = form.title.trim() !== doc.title || form.category !== doc.category
            || (form.description.trim() && form.description.trim() !== (doc.description || ''));
          if (metadataChanged) {
            await documentService.update(doc._id, {
              title: form.title.trim(),
              category: form.category,
              ...(form.description.trim() ? { description: form.description.trim() } : {}),
            });
          }
          await documentService.replaceFile(doc._id, body);
          message = 'Document replaced';
        }
      } else {
        const body = new FormData();
        body.append('file', file);
        body.append('title', form.title.trim());
        body.append('module', module);
        body.append('category', plain ? config.defaultCategory : form.category);
        body.append('controlled', controlled ? 'true' : 'false');
        if (!plain) body.append('accessLevel', form.accessLevel);
        if (isHr) body.append('assignedTo', JSON.stringify(Object.keys(assigned)));
        if (form.description.trim()) body.append('description', form.description.trim());
        const created = unwrap(await documentService.create(body));
        message = 'Document uploaded';
        if (submitAfter) {
          try {
            await documentService.submit(created._id);
            message = 'Document uploaded and submitted for review';
          } catch (err) {
            onSaved(`Uploaded as a draft, but it could not be submitted for review: ${apiError(err, 'submit failed')}`, 'error');
            return;
          }
        }
      }
      onSaved(message);
    } catch (err) {
      setErrors(fieldErrors(err));
      notify(apiError(err, 'Failed to save document'), 'error');
      setSaving(null);
    }
  };

  const titles = {
    upload: [config.uploadTitle, config.uploadSubtitle],
    edit: ['Edit Document', ''],
    version: [controlled ? 'Upload New Version' : 'Replace Document', 'Upload a new version of this document'],
  };
  const [title, subtitle] = titles[mode];
  const lockedMeta = mode === 'version' && controlled;
  const currentFile = doc?.currentFileId?.originalName;

  const primaryLabel = {
    upload: controlled ? 'Upload File' : config.uploadSubmitLabel,
    edit: 'Save Changes',
    version: controlled ? 'Upload New Version' : 'Replace Document',
  }[mode];

  const footer = (
    <>
      <button type="button" onClick={onClose} disabled={!!saving} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
      {mode === 'upload' && controlled && (
        <button type="button" onClick={() => save(false)} disabled={!!saving} style={{ ...buttonBase, backgroundColor: '#fff', color: '#334155', border: '1px solid #E2E8F0', opacity: saving ? 0.7 : 1 }}>
          {saving === 'save' ? 'Saving…' : 'Save as Draft'}
        </button>
      )}
      <button type="button" onClick={() => save(mode === 'upload' && controlled)} disabled={!!saving} style={{ ...buttonBase, backgroundColor: '#1D4ED8', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
        {saving === 'submit' || (saving === 'save' && !(mode === 'upload' && controlled)) ? 'Saving…' : primaryLabel}
      </button>
    </>
  );

  return (
    <Drawer isOpen onClose={saving ? undefined : onClose} title={title} subtitle={subtitle} width="520px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label={plain ? 'DOCUMENT NAME' : 'DOCUMENT TITLE'} required error={errors.title}>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={config.titlePlaceholder} maxLength={200} disabled={lockedMeta} error={!!errors.title} />
        </FormField>

        {!plain && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="DOCUMENT CATEGORY" required error={errors.category}>
              <Select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                options={[...(form.category && !config.categories.includes(form.category) ? [form.category] : []), ...config.categories]}
                placeholder="Select"
                disabled={lockedMeta}
                error={!!errors.category}
              />
            </FormField>
            <FormField label="ACCESS LEVEL" required error={errors.accessLevel || errors.departmentId}>
              <Select
                value={form.accessLevel}
                onChange={(e) => set('accessLevel', e.target.value)}
                options={isHr ? HR_ACCESS_OPTIONS : ACCESS_OPTIONS}
                disabled={isHr || lockedMeta || (mode === 'version' && !controlled)}
              />
            </FormField>
          </div>
        )}

        {!plain && isHr && mode !== 'version' && (
          <FormField label="ASSIGN TO" required error={errors.assignedTo} helpText="Only these employees (and HR) will be able to see this document.">
            <MultiEmployeePicker selected={assigned} onChange={setAssigned} />
          </FormField>
        )}

        {mode === 'version' && currentFile && (
          <FormField label="CURRENT FILE">
            <Input value={currentFile} disabled style={{ backgroundColor: '#F1F5F9' }} />
          </FormField>
        )}

        {!plain && (
          <FormField label="DESCRIPTION (OPTIONAL)" error={errors.description}>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={mode === 'version' && controlled ? 'What changed in this version?' : 'Add context…'}
              maxLength={mode === 'version' && controlled ? 1000 : 2000}
              error={!!errors.description}
            />
          </FormField>
        )}

        {mode !== 'edit' && (
          <FormField label="ATTACH DOCUMENTS" required error={errors.file}>
            <FileDrop files={file ? [file] : []} onChange={(list) => { setFile(list[0] || null); setErrors((c) => ({ ...c, file: undefined })); }} onError={(m) => notify(m, 'error')} />
          </FormField>
        )}
      </div>
    </Drawer>
  );
}

/** Mounted only while open, so every open starts from fresh state. */
export default function DocumentForm({ mode, ...rest }) {
  if (!mode) return null;
  return <FormPanel key={`${mode}-${rest.doc?._id || 'new'}`} mode={mode} {...rest} />;
}
