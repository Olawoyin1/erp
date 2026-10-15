import { useState } from 'react';
import { FiCamera, FiFilter, FiSearch, FiUser } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { projectService } from '../../../services/technical.service';
import { DataState, Field, FilterDrawer, FormBody, FormError, PrimaryButton, SecondaryButton } from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import { useDebouncedValue, useFetched } from '../shared/techHooks';
import { countFilters, fieldErrorsOf, formatDate } from '../shared/techUtils';

function UploadPhotoModal({ projectId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const save = async () => {
    setError('');
    const next = {};
    if (!title.trim()) next.photoTitle = 'Enter a title for the photo';
    if (!files.length) next.file = 'Choose the photo to upload';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const data = new FormData();
    data.append('file', files[0]);
    data.append('photoTitle', title.trim());
    if (description.trim()) data.append('detailedDescription', description.trim());
    try {
      await projectService.uploadImage(projectId, data);
      onSaved('Photo uploaded');
    } catch (err) {
      setError(apiError(err, 'The photo could not be uploaded'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Upload Field Photo"
      subtitle="Store site photos for audit tracking"
      maxWidth="520px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Uploading…' : 'Upload Photo'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Photo title" required error={errors.photoTitle}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. EPC – Gas Processing Plant Upgrade" error={Boolean(errors.photoTitle)} /></Field>
        <Field label="Detailed description" error={errors.detailedDescription}><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does the photo show?" /></Field>
        <Field label="Upload image" required error={errors.file}><AttachField files={files} onChange={setFiles} multiple={false} accept=".png,.jpg,.jpeg" hint="PNG, JPG, up to 50MB" disabled={busy} /></Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

export default function ImagesTab({ project, refreshKey, showToast }) {
  const projectId = project._id;
  const canUpload = usePermission('technical.project.update') && project.status !== 'completed';
  const [searchText, setSearchText] = useState('');
  const q = useDebouncedValue(searchText.trim(), 400);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  const images = useFetched(
    () => projectService.images(projectId, { ...(q ? { q } : {}), ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}), ...(filters.dateTo ? { dateTo: filters.dateTo } : {}) }),
    `${projectId}|${q}|${filters.dateFrom}|${filters.dateTo}`,
    refreshKey + localKey,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search field snapshots..." style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton icon={<FiFilter size={15} />} onClick={() => setFilterOpen(true)}>Filter{countFilters(filters) ? ` (${countFilters(filters)})` : ''}</SecondaryButton>
          {canUpload && <PrimaryButton icon={<FiCamera size={15} />} onClick={() => setUploadOpen(true)}>Upload Photo</PrimaryButton>}
        </div>
      </div>

      <DataState loading={images.loading} error={images.error} empty={!images.data.length} emptyText="No field photos yet.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {images.data.map((photo) => (
            <div key={photo._id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
              {photo.url
                ? <img src={photo.url} alt={photo.photoTitle || photo.originalName} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                : <div style={{ height: 150, background: '#F1F5F9' }} />}
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{photo.photoTitle || photo.originalName}</div>
                {photo.detailedDescription && <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 8, lineHeight: 1.4 }}>{photo.detailedDescription}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FiUser size={12} /> {photo.uploadedByName || '—'}</span>
                  <span>{formatDate(photo.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DataState>

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Photos"
        subtitle="Show photos uploaded in a date range."
        fields={[{ key: 'dateFrom', label: 'Uploaded from', type: 'date' }, { key: 'dateTo', label: 'Uploaded to', type: 'date' }]}
        values={filters}
        onApply={setFilters}
      />
      {uploadOpen && <UploadPhotoModal projectId={projectId} onClose={() => setUploadOpen(false)} onSaved={(message) => { setUploadOpen(false); showToast(message, 'success'); setLocalKey((k) => k + 1); }} />}
    </div>
  );
}
