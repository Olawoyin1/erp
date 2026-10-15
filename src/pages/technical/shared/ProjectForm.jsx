import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { apiError } from '../../../services/apiHelpers';
import { projectService } from '../../../services/technical.service';
import { Choice, Field, FormBody, FormError, Note, PrimaryButton, SecondaryButton, TwoCol } from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from './TechFiles';
import { useTechLookups } from './techHooks';
import { CONTRACT_TYPES, CURRENCIES, PROJECT_TYPES, fieldErrorsOf, fromKobo, refId, toKobo, toOptions, uploadStagedFiles, ymd } from './techUtils';

const BLANK = {
  projectName: '', clientId: '', clientEmail: '', projectType: 'EPCIC', contractType: 'Lump Sum', location: '', startDate: '', plannedCompletion: '',
  budget: '', currency: 'NGN', description: '', team: [],
};

function formFromProject(p) {
  return {
    projectName: p.projectName || '',
    clientId: refId(p.clientId),
    clientEmail: p.clientEmail || '',
    projectType: p.projectType || 'EPCIC',
    contractType: p.contractType || 'Lump Sum',
    location: p.location || '',
    startDate: ymd(p.startDate),
    plannedCompletion: ymd(p.plannedCompletion),
    budget: fromKobo(p.approvedBudget),
    currency: p.currency || 'NGN',
    description: p.description || '',
    team: (p.teamMembers || []).map((m) => ({ employeeId: refId(m.employeeId), role: m.role || '', department: m.department || '' })),
  };
}

/**
 * Add New Project / Edit Project drawer. `project` is the populated record when editing (a completed project cannot be
 * edited). New projects can carry documents; an edited project manages its documents in place.
 */
export default function ProjectFormDrawer({ project, onClose, onSaved }) {
  const editing = Boolean(project);
  const { lookups, error: lookupError } = useTechLookups(['clients', 'employees']);
  const [form, setForm] = useState(() => (project ? formFromProject(project) : BLANK));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const clientOptions = useMemo(() => {
    const options = toOptions(lookups.clients, 'clientName');
    const current = project?.clientId;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.clientName });
    return options;
  }, [lookups.clients, project]);
  const employeeOptions = useMemo(() => {
    const options = toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`);
    (project?.teamMembers || []).forEach((m) => {
      const emp = m.employeeId;
      if (emp && typeof emp === 'object' && !options.some((o) => o.value === emp._id)) options.push({ value: emp._id, label: `${emp.fullName} (${emp.employeeId})` });
    });
    return options;
  }, [lookups.employees, project]);

  const pickClient = (id) => {
    const client = (lookups.clients || []).find((c) => c._id === id);
    setForm((f) => ({ ...f, clientId: id, clientEmail: f.clientEmail || client?.email || '' }));
  };

  const setMember = (index, patch) => setForm((f) => ({ ...f, team: f.team.map((m, i) => (i === index ? { ...m, ...patch } : m)) }));

  const validate = () => {
    const next = {};
    if (!form.projectName.trim()) next.projectName = 'Enter the project name';
    if (!form.clientId) next.clientId = 'Choose the client';
    if (!/^\S+@\S+\.\S+$/.test(form.clientEmail.trim())) next.clientEmail = 'Enter a valid client email';
    if (!form.location.trim()) next.location = 'Enter the project location';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.plannedCompletion) next.plannedCompletion = 'Choose the planned completion date';
    if (form.startDate && form.plannedCompletion && form.startDate > form.plannedCompletion) next.startDate = 'Start date must be on or before the planned completion';
    if (Number.isNaN(toKobo(form.budget))) next.approvedBudget = 'Enter the budget in naira, for example 100000000';
    if (!form.description.trim()) next.description = 'Describe the project and its scope';
    if (form.team.some((m) => !m.employeeId || !m.role.trim())) next.teamMembers = 'Every team member needs a person and a role';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    projectName: form.projectName.trim(),
    clientId: form.clientId,
    clientEmail: form.clientEmail.trim(),
    projectType: form.projectType,
    contractType: form.contractType,
    location: form.location.trim(),
    startDate: form.startDate,
    plannedCompletion: form.plannedCompletion,
    approvedBudget: toKobo(form.budget),
    currency: form.currency,
    description: form.description.trim(),
    teamMembers: form.team.map((m) => ({ employeeId: m.employeeId, role: m.role.trim(), ...(m.department.trim() ? { department: m.department.trim() } : {}) })),
  });

  const save = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      let saved;
      if (editing) saved = (await projectService.update(project._id, payload())).data?.data;
      else saved = (await projectService.create(payload())).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(projectService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Project updated successfully' : 'Project created successfully'}.${note}`, saved);
    } catch (err) {
      setError(apiError(err, 'The project could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Project' : 'Add New Project'}
      subtitle={editing ? 'Update the delivery information of this project' : 'Create a new technical project and assign the key delivery information'}
      width="560px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Project'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        {lookupError && <Note tone="amber">{lookupError}</Note>}
        <Field label="Project name" required error={errors.projectName}>
          <Input value={form.projectName} onChange={(e) => set('projectName', e.target.value)} placeholder="e.g. Chevron Wellhead Upgrade" error={Boolean(errors.projectName)} />
        </Field>
        <TwoCol min={200}>
          <Field label="Client" required error={errors.clientId}>
            <Choice value={form.clientId} onChange={pickClient} searchable placeholder="Select a client" options={clientOptions} error={errors.clientId} />
          </Field>
          <Field label="Client email" required error={errors.clientEmail}>
            <Input type="email" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} placeholder="client@company.com" error={Boolean(errors.clientEmail)} />
          </Field>
        </TwoCol>
        <TwoCol min={200}>
          <Field label="Project type" required error={errors.projectType}>
            <Choice value={form.projectType} onChange={(v) => set('projectType', v)} options={PROJECT_TYPES} />
          </Field>
          <Field label="Contract type" required error={errors.contractType}>
            <Choice value={form.contractType} onChange={(v) => set('contractType', v)} options={CONTRACT_TYPES} />
          </Field>
        </TwoCol>
        <Field label="Location" required error={errors.location}>
          <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bonny Island, Rivers" error={Boolean(errors.location)} />
        </Field>
        <TwoCol min={200}>
          <Field label="Start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} />
          </Field>
          <Field label="Planned completion" required error={errors.plannedCompletion}>
            <DatePicker value={form.plannedCompletion} onChange={(e) => set('plannedCompletion', e.target.value)} error={Boolean(errors.plannedCompletion)} />
          </Field>
        </TwoCol>
        <TwoCol min={200}>
          <Field label="Approved budget" required error={errors.approvedBudget}>
            <Input value={form.budget} inputMode="decimal" onChange={(e) => set('budget', e.target.value.replace(/,/g, ''))} placeholder="0.00" error={Boolean(errors.approvedBudget)} />
          </Field>
          <Field label="Currency" required error={errors.currency}>
            <Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} />
          </Field>
        </TwoCol>
        <Field label="Project description & scope" required error={errors.description}>
          <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add project description..." error={Boolean(errors.description)} />
        </Field>

        <Field label="Team members" error={errors.teamMembers} help="Name a member with the role Project Manager or Technical Lead to set those leads on the project.">
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.team.length === 0 && <div style={{ fontSize: '0.84rem', color: '#94A3B8', textAlign: 'center', padding: 8 }}>No team members have been assigned yet</div>}
            {form.team.map((member, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                <Choice value={member.employeeId} onChange={(v) => setMember(i, { employeeId: v })} searchable placeholder="Select a person" options={employeeOptions} />
                <Input value={member.role} onChange={(e) => setMember(i, { role: e.target.value })} placeholder="Role" />
                <Input value={member.department} onChange={(e) => setMember(i, { department: e.target.value })} placeholder="Department" />
                <button type="button" aria-label="Remove team member" onClick={() => setForm((f) => ({ ...f, team: f.team.filter((_, idx) => idx !== i) }))} style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', borderRadius: 6, padding: '9px 10px', cursor: 'pointer', display: 'flex' }}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
            <div>
              <SecondaryButton icon={<FiPlus size={13} />} onClick={() => setForm((f) => ({ ...f, team: [...f.team, { employeeId: '', role: '', department: '' }] }))}>Team Member</SecondaryButton>
            </div>
          </div>
        </Field>

        {editing ? (
          <FilesPanel key={project._id} api={projectService} id={project._id} title="Attached documents" canUpload canRemove />
        ) : (
          <Field label="Attach document (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}
