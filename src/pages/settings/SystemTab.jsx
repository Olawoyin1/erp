import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { departmentService, locationService } from '../../services/platform.service';
import { legalEntityService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import { EmptyState, ErrorBanner, LinkButton, PanelHeader, PanelSkeleton, PrimaryButton, SectionCard, StatusTag } from './settingsShared';
import { detailErrors, tableCell, tableHead } from './settingsUtils';

const ENTITY_TYPES = ['Parent', 'Subsidiary', 'Joint Venture'];
const LOCATION_TYPES = [
  { value: 'head_office', label: 'Head office' },
  { value: 'yard', label: 'Yard' },
  { value: 'site', label: 'Site' },
  { value: 'warehouse', label: 'Warehouse' },
];
const locationTypeLabel = (v) => LOCATION_TYPES.find((t) => t.value === v)?.label || v;

function EditModal({ title, saveLabel, fields, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };

  const save = async () => {
    const errs = {};
    fields.forEach((f) => {
      if (f.required && !String(form[f.name] ?? '').trim()) errs[f.name] = `${f.label} is required`;
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save'));
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      maxWidth="480px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : saveLabel}</button>
        </>
      }
    >
      <ErrorBanner message={formError} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fields.map((f) => (
          <FormField key={f.name} label={f.label} required={f.required} error={errors[f.name]} helpText={f.help} style={f.wide ? { gridColumn: '1 / -1' } : undefined}>
            {f.options ? (
              <Select value={form[f.name]} onChange={(e) => set(f.name, e.target.value)} options={f.options} placeholder="Select" />
            ) : (
              <Input value={form[f.name]} onChange={(e) => set(f.name, f.upper ? e.target.value.toUpperCase() : e.target.value)} placeholder={f.placeholder} maxLength={f.max} error={!!errors[f.name]} />
            )}
          </FormField>
        ))}
      </div>
    </Modal>
  );
}

function Panel({ title, subtitle, addLabel, canAdd, onAdd, api, columns, grid, rows, renderActions, emptyText }) {
  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      action={canAdd && <PrimaryButton icon={<FiPlus size={14} />} onClick={onAdd}>{addLabel}</PrimaryButton>}
    >
      <ErrorBanner message={api.error} onRetry={api.reload} />
      <div style={{ display: 'grid', gridTemplateColumns: grid, borderBottom: '1px solid #E2E8F0', paddingBottom: 4, gap: 10 }}>
        {columns.map((c) => <span key={c} style={tableHead}>{c}</span>)}
      </div>
      {api.loading && !api.data && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={3} /></div>}
      {!api.loading && !api.error && rows.length === 0 && <EmptyState>{emptyText}</EmptyState>}
      {rows.map(({ key, cells, actions }) => (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: grid, alignItems: 'center', gap: 10 }}>
          {cells.map((cell, i) => <span key={i} style={tableCell}>{cell}</span>)}
          <span style={tableCell}>{renderActions(actions)}</span>
        </div>
      ))}
    </SectionCard>
  );
}

function EntitiesPanel({ showToast }) {
  const canView = usePermission('finance.legalentity.view');
  const canManage = usePermission('core.settings.update');
  const api = useApi(() => (canView ? legalEntityService.list({ all: true }) : Promise.resolve({ data: { data: [] } })), [canView]);
  const [modal, setModal] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  if (!canView) return null;

  const toggle = async (entity) => {
    setBusyId(entity._id);
    setActionError('');
    try {
      if (entity.status === 'active') await legalEntityService.deactivate(entity._id);
      else await legalEntityService.activate(entity._id);
      showToast(`${entity.name} ${entity.status === 'active' ? 'deactivated' : 'activated'}`, 'success');
      api.reload();
    } catch (err) {
      setActionError(apiError(err, 'Could not change the status'));
    } finally {
      setBusyId('');
    }
  };

  const save = async (form) => {
    const body = { name: form.name.trim(), entityType: form.entityType };
    if (modal.entity) await legalEntityService.update(modal.entity._id, body);
    else await legalEntityService.create(body);
    showToast(modal.entity ? 'Entity updated' : 'Entity added', 'success');
    setModal(null);
    api.reload();
  };

  const rows = (api.data?.data || []).map((e) => ({
    key: e._id,
    cells: [e.name, e.entityType, <StatusTag key="s" active={e.status === 'active'} />],
    actions: e,
  }));

  return (
    <>
      <ErrorBanner message={actionError} />
      <Panel
        title="Entities"
        subtitle="Manage registered legal entities within the organisation."
        addLabel="Add Entity"
        canAdd={canManage}
        onAdd={() => setModal({ entity: null })}
        api={api}
        columns={['Entity Name', 'Type', 'Status', 'Actions']}
        grid="2fr 1fr 1fr 1fr"
        rows={rows}
        emptyText="No legal entities yet."
        renderActions={(entity) =>
          canManage && (
            <div style={{ display: 'flex', gap: 12 }}>
              <LinkButton onClick={() => setModal({ entity })}>Edit</LinkButton>
              <LinkButton tone="danger" disabled={busyId === entity._id} onClick={() => toggle(entity)}>{entity.status === 'active' ? 'Deactivate' : 'Activate'}</LinkButton>
            </div>
          )
        }
      />
      {modal && (
        <EditModal
          title={modal.entity ? 'Edit Entity' : 'Add Entity'}
          saveLabel={modal.entity ? 'Save Entity' : 'Add Entity'}
          fields={[
            { name: 'name', label: 'Entity Name', required: true, placeholder: 'e.g. PGSL Offshore Ltd', max: 200, wide: true },
            { name: 'entityType', label: 'Entity Type', required: true, options: ENTITY_TYPES },
          ]}
          initial={{ name: modal.entity?.name || '', entityType: modal.entity?.entityType || 'Subsidiary' }}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function DepartmentsPanel({ showToast }) {
  const canView = usePermission('core.department.view');
  const canCreate = usePermission('core.department.create');
  const canUpdate = usePermission('core.department.update');
  const canActivate = usePermission('core.department.activate');
  const canDeactivate = usePermission('core.department.deactivate');
  const api = useApi(() => (canView ? departmentService.list() : Promise.resolve({ data: { data: [] } })), [canView]);
  const [modal, setModal] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  if (!canView) return null;

  const toggle = async (dept) => {
    setBusyId(dept._id);
    setActionError('');
    try {
      if (dept.isActive) await departmentService.deactivate(dept._id);
      else await departmentService.activate(dept._id);
      showToast(`${dept.name} ${dept.isActive ? 'deactivated' : 'activated'}`, 'success');
      api.reload();
    } catch (err) {
      setActionError(apiError(err, 'Could not change the status'));
    } finally {
      setBusyId('');
    }
  };

  const save = async (form) => {
    const body = { name: form.name.trim(), code: form.code.trim().toUpperCase() };
    if (modal.dept) await departmentService.update(modal.dept._id, body);
    else await departmentService.create(body);
    showToast(modal.dept ? 'Department updated' : 'Department added', 'success');
    setModal(null);
    api.reload();
  };

  const rows = (api.data?.data || []).map((d) => ({
    key: d._id,
    cells: [d.code, d.name, <StatusTag key="s" active={d.isActive} />],
    actions: d,
  }));

  return (
    <>
      <ErrorBanner message={actionError} />
      <Panel
        title="Departments"
        subtitle="Manage organisational departments and their status"
        addLabel="Department"
        canAdd={canCreate}
        onAdd={() => setModal({ dept: null })}
        api={api}
        columns={['Department ID', 'Department', 'Status', 'Actions']}
        grid="1fr 2fr 1fr 1fr"
        rows={rows}
        emptyText="No departments yet."
        renderActions={(dept) => (
          <div style={{ display: 'flex', gap: 12 }}>
            {canUpdate && <LinkButton onClick={() => setModal({ dept })}>Edit</LinkButton>}
            {(dept.isActive ? canDeactivate : canActivate) && (
              <LinkButton tone="danger" disabled={busyId === dept._id} onClick={() => toggle(dept)}>{dept.isActive ? 'Deactivate' : 'Activate'}</LinkButton>
            )}
          </div>
        )}
      />
      {modal && (
        <EditModal
          title={modal.dept ? 'Edit Department' : 'Add Department'}
          saveLabel={modal.dept ? 'Save Department' : 'Add Department'}
          fields={[
            { name: 'code', label: 'Department ID', required: true, placeholder: 'e.g. MECH', max: 20, upper: true, help: 'A short unique code, shown as the department ID' },
            { name: 'name', label: 'Department', required: true, max: 150 },
          ]}
          initial={{ code: modal.dept?.code || '', name: modal.dept?.name || '' }}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function LocationsPanel({ showToast }) {
  const canView = usePermission('core.location.view');
  const canCreate = usePermission('core.location.create');
  const canUpdate = usePermission('core.location.update');
  const api = useApi(() => (canView ? locationService.list() : Promise.resolve({ data: { data: [] } })), [canView]);
  const [modal, setModal] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  if (!canView) return null;

  const toggle = async (location) => {
    setBusyId(location._id);
    setActionError('');
    try {
      await locationService.update(location._id, { isActive: !location.isActive });
      showToast(`${location.name} ${location.isActive ? 'deactivated' : 'activated'}`, 'success');
      api.reload();
    } catch (err) {
      setActionError(apiError(err, 'Could not change the status'));
    } finally {
      setBusyId('');
    }
  };

  const save = async (form) => {
    const body = { name: form.name.trim(), code: form.code.trim().toUpperCase(), type: form.type, address: form.address.trim() };
    if (modal.location) await locationService.update(modal.location._id, body);
    else await locationService.create({ ...body, address: body.address || undefined });
    showToast(modal.location ? 'Location updated' : 'Location added', 'success');
    setModal(null);
    api.reload();
  };

  const rows = (api.data?.data || []).map((l) => ({
    key: l._id,
    cells: [l.code, l.name, locationTypeLabel(l.type), <StatusTag key="s" active={l.isActive} />],
    actions: l,
  }));

  return (
    <>
      <ErrorBanner message={actionError} />
      <Panel
        title="Locations"
        subtitle="Offices, yards, sites and warehouses used for staff, deployments and stock"
        addLabel="Location"
        canAdd={canCreate}
        onAdd={() => setModal({ location: null })}
        api={api}
        columns={['Code', 'Location', 'Type', 'Status', 'Actions']}
        grid="1fr 2fr 1fr 1fr 1fr"
        rows={rows}
        emptyText="No locations yet."
        renderActions={(location) =>
          canUpdate && (
            <div style={{ display: 'flex', gap: 12 }}>
              <LinkButton onClick={() => setModal({ location })}>Edit</LinkButton>
              <LinkButton tone="danger" disabled={busyId === location._id} onClick={() => toggle(location)}>{location.isActive ? 'Deactivate' : 'Activate'}</LinkButton>
            </div>
          )
        }
      />
      {modal && (
        <EditModal
          title={modal.location ? 'Edit Location' : 'Add Location'}
          saveLabel={modal.location ? 'Save Location' : 'Add Location'}
          fields={[
            { name: 'code', label: 'Code', required: true, placeholder: 'e.g. LK4', max: 20, upper: true },
            { name: 'name', label: 'Location', required: true, max: 150 },
            { name: 'type', label: 'Type', required: true, options: LOCATION_TYPES },
            { name: 'address', label: 'Address (Optional)', max: 300 },
          ]}
          initial={{ code: modal.location?.code || '', name: modal.location?.name || '', type: modal.location?.type || 'site', address: modal.location?.address || '' }}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

export default function SystemTab({ showToast }) {
  return (
    <div>
      <PanelHeader title="System Configuration" subtitle="Manage core system behaviour settings" />
      <EntitiesPanel showToast={showToast} />
      <DepartmentsPanel showToast={showToast} />
      <LocationsPanel showToast={showToast} />
    </div>
  );
}
