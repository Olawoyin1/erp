import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { apiError } from '../../../services/apiHelpers';
import { inventoryImportService } from '../../../services/procurement.service';
import { downloadFile } from '../shared/procUtils';
import { Field, FormError, Note, PrimaryButton, SecondaryButton, SimpleTable } from '../shared/ProcUi';
import { AttachField } from '../shared/ProcExtras';

/**
 * Bulk import of inventory items from a CSV or XLSX file. The file is always checked first (a dry run that
 * writes nothing); the "Import" button only appears once at least one row is valid.
 */
export default function ImportDialog({ onClose, onDone }) {
  const [files, setFiles] = useState([]);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const file = files[0] || null;

  const chooseFile = (next) => {
    setFiles(next);
    setReport(null);
    setError('');
  };

  const template = async () => {
    const message = await downloadFile(() => inventoryImportService.template(), 'inventory-items-import-template.csv');
    if (message) setError(message);
  };

  const run = async (dryRun) => {
    if (!file) { setError('Choose a CSV or XLSX file first.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await inventoryImportService.run(file, dryRun);
      const data = res.data?.data;
      if (dryRun) setReport(data);
      else onDone(`${data.created} inventory item${data.created === 1 ? '' : 's'} imported${data.errors?.length ? `, ${data.errors.length} row(s) skipped` : ''}`);
    } catch (err) {
      setError(apiError(err, 'The file could not be processed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Import Inventory Items"
      subtitle="Add many items at once from a spreadsheet. Nothing is saved until you confirm."
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Close</SecondaryButton>
          <SecondaryButton onClick={() => run(true)} disabled={busy || !file}>{busy && !report ? 'Checking…' : 'Check File'}</SecondaryButton>
          {report && report.validRows > 0 && <PrimaryButton onClick={() => run(false)} disabled={busy}>{busy ? 'Importing…' : `Import ${report.validRows} valid row${report.validRows === 1 ? '' : 's'}`}</PrimaryButton>}
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Note>
          Use the template: one item per row with its code, name, category, opening stock, reorder level, unit and warehouse. Up to 5,000 rows and 5MB; an item code can repeat across warehouses.
          {' '}
          <button type="button" onClick={template} style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FiDownload size={13} /> Download template
          </button>
        </Note>
        <Field label="File" required>
          <AttachField files={files} onChange={chooseFile} multiple={false} accept=".csv,.xlsx" hint="CSV or XLSX, up to 5MB" disabled={busy} />
        </Field>
        {report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Note tone={report.errors.length ? 'amber' : 'green'}>
              {report.totalRows} row{report.totalRows === 1 ? '' : 's'} read: <strong>{report.validRows} valid</strong>, {report.errors.length} with problems. Rows with problems are skipped; the valid ones are imported.
            </Note>
            {report.errors.length > 0 && (
              <SimpleTable
                rows={report.errors.slice(0, 50).map((e, i) => ({ ...e, key: i }))}
                columns={[
                  { key: 'row', label: 'Row', align: 'center' },
                  { key: 'field', label: 'Column', render: (e) => e.field || '—' },
                  { key: 'message', label: 'Problem' },
                ]}
              />
            )}
            {report.errors.length > 50 && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Showing the first 50 problems.</span>}
          </div>
        )}
        <FormError message={error} />
      </div>
    </Modal>
  );
}
