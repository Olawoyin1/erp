import { useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiPhoneCall } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { Input } from '../../../components/ui/FormField';
import { usePermissions } from '../../../hooks/usePermission';
import { hseContactsSlice } from '../../../store/hse/slices';
import { apiError } from '../../../services/apiHelpers';
import { emergencyContactService } from '../../../services/hse.service';
import { countFilters, fieldErrorsOf, formatDate } from '../../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar,
  PrimaryButton, RecordSummary, SecondaryButton, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { idOf, nameOf } from '../shared/hseUtils';
import { useHseLookups } from '../shared/useScreenLookups';

const SECTIONS = ['locations', 'contactTypes', 'organisations'];
const ALL_SITES = 'all';
const locationName = (ref) => (ref ? nameOf(ref) : 'All Sites');

const EXPORT_COLUMNS = [
  { label: 'Contact Name', value: (r) => r.contactName },
  { label: 'Organisation', value: (r) => r.organisation },
  { label: 'Type', value: (r) => r.contactType },
  { label: 'Role', value: (r) => r.role },
  { label: 'Phone', value: (r) => r.phone },
  { label: 'Email', value: (r) => r.email || '' },
  { label: 'Location', value: (r) => locationName(r.location) },
];

function ContactFormModal({ record, lookups, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => ({
    contactName: record?.contactName || '',
    organisation: record?.organisation || '',
    contactType: record?.contactType || '',
    role: record?.role || '',
    phone: record?.phone || '',
    email: record?.email || '',
    location: record ? idOf(record.location) || ALL_SITES : ALL_SITES,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.contactName.trim()) next.contactName = 'Enter the contact name';
    if (!form.organisation.trim()) next.organisation = 'Enter the organisation';
    if (!form.contactType.trim()) next.contactType = 'Enter or choose the contact type';
    if (!form.role.trim()) next.role = 'Enter the role';
    if (!form.phone.trim()) next.phone = 'Enter the primary phone number';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = {
        contactName: form.contactName.trim(),
        organisation: form.organisation.trim(),
        contactType: form.contactType.trim(),
        role: form.role.trim(),
        phone: form.phone.trim(),
        location: form.location === ALL_SITES ? null : form.location,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      };
      if (editing) {
        await emergencyContactService.update(record._id, payload);
        onSaved('Contact updated');
      } else {
        await emergencyContactService.create(payload);
        onSaved('Contact added');
      }
    } catch (err) {
      setError(apiError(err, 'The contact could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Contact' : 'Add Contact'}
      subtitle={editing ? undefined : 'Add an emergency contact for quick access during incidents and emergency response'}
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Contact'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Contact name" required error={errors.contactName}>
          <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="e.g. Lagos State Emergency Management Agency (LASEMA)" error={Boolean(errors.contactName)} />
        </Field>
        <TwoCol>
          <Field label="Organisation" required error={errors.organisation}>
            <Input list="hse-organisations" value={form.organisation} onChange={(e) => set('organisation', e.target.value)} placeholder="e.g. Government" error={Boolean(errors.organisation)} />
            <datalist id="hse-organisations">{(lookups.organisations || []).map((o) => <option key={o} value={o} />)}</datalist>
          </Field>
          <Field label="Contact type" required error={errors.contactType}>
            <Input list="hse-contact-types" value={form.contactType} onChange={(e) => set('contactType', e.target.value)} placeholder="e.g. Emergency Services" error={Boolean(errors.contactType)} />
            <datalist id="hse-contact-types">{(lookups.contactTypes || []).map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Role" required error={errors.role}>
            <Input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Emergency Response" error={Boolean(errors.role)} />
          </Field>
          <Field label="Phone number" required error={errors.phone}>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. 0800-LASEMA" error={Boolean(errors.phone)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" error={Boolean(errors.email)} />
          </Field>
          <Field label="Location" required error={errors.location}>
            <Choice value={form.location} onChange={(v) => set('location', v)} options={[{ value: ALL_SITES, label: 'All Sites' }, ...(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))]} />
          </Field>
        </TwoCol>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewContactDrawer({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(emergencyContactService, id, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title="Emergency Contact" width="480px">
      {loading && <div style={{ color: '#64748B' }}>Loading contact…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ViewHeader icon={<FiPhoneCall size={20} />} title={record.contactName} subtitle={record.phone}>{actions(record)}</ViewHeader>
          <DetailGrid
            items={[
              ['Organisation', record.organisation],
              ['Contact type', record.contactType],
              ['Role', record.role],
              ['Phone number (primary)', record.phone],
              ['Email', record.email || '—'],
              ['Location', locationName(record.location)],
              ['Last updated', formatDate(record.updatedAt)],
            ]}
          />
        </div>
      )}
    </Drawer>
  );
}

export default function ContactsTab({ showToast }) {
  const { can } = usePermissions();
  const canCreate = can('hse.emergencycontact.create');
  const canUpdate = can('hse.emergencycontact.update');
  const canDelete = can('hse.emergencycontact.delete');
  const canExport = can('hse.emergencycontact.export');

  const list = useProcList(hseContactsSlice, { initialFilters: { contactType: '', organisation: '', location: '' }, withStats: false });
  const run = useRunAction(hseContactsSlice);
  const selection = useSelection();
  const exporter = useExport(emergencyContactService, list, selection, EXPORT_COLUMNS, 'emergency-contacts.csv');
  const { lookups } = useHseLookups(SECTIONS);

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const remove = async () => {
    setBusy(true);
    setDeleteError('');
    const res = await run('remove', deleteRow._id);
    setBusy(false);
    if (res.ok) {
      setDeleteRow(null);
      setViewId(null);
      showToast('Contact deleted', 'success');
      refresh();
    } else {
      setDeleteError(res.error);
    }
  };

  const menuItems = (row) => {
    const items = [];
    if (canUpdate) items.push({ label: 'Edit Contact', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (canDelete) items.push({ label: 'Delete Contact', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => { setDeleteError(''); setDeleteRow(row); } });
    return items;
  };

  const columns = [
    { key: 'contactName', label: 'CONTACT NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'organisation', label: 'ORGANISATION', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'contactType', label: 'TYPE', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'role', label: 'ROLE', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'phone', label: 'PHONE (PRIMARY)', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'location', label: 'LOCATION', render: (v) => <span style={{ color: '#334155' }}>{locationName(v)}</span> },
    { key: 'updatedAt', label: 'LAST UPDATED', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Contact" aria-label="View contact" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
  ];

  const viewActions = (record) => (
    <>
      {canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
      {canDelete && <SecondaryButton danger icon={<FiTrash2 size={14} />} onClick={() => { setDeleteError(''); setDeleteRow(record); }}>Delete</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected contacts exported` : 'Contacts exported', 'success');
  };

  const filterFields = [
    { key: 'contactType', label: 'Contact type', options: (lookups.contactTypes || []).map((t) => ({ value: t, label: t })) },
    { key: 'organisation', label: 'Organisation', options: (lookups.organisations || []).map((o) => ({ value: o, label: o })) },
    { key: 'location', label: 'Location', options: [{ value: ALL_SITES, label: 'All Sites' }, ...(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))] },
  ];

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No emergency contacts found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search contact, organisation, type..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Add Contact</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Contacts" subtitle="Narrow the register by type, organisation and location." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <ContactFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {viewId && <ViewContactDrawer id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}
      {deleteRow && (
        <ConfirmModal
          title="Delete Contact?"
          message="This removes the contact from the emergency register."
          detail={<RecordSummary rows={[['Contact', deleteRow.contactName], ['Organisation', deleteRow.organisation]]} />}
          confirmLabel="Delete Contact"
          danger
          busy={busy}
          error={deleteError}
          onClose={() => setDeleteRow(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
