import { useState } from 'react';
import { FiDownload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import { FileUpload } from '../../components/ui/FormField';
import { importService } from '../../services/hr.service';
import { apiError } from '../../services/apiHelpers';
import { saveBlob, blobErrorMessage } from './hrUtils';

/**
 * Bulk import through `POST /imports/:entity`. The first pass is always a dry run: the file is
 * checked and every problem is listed by row; nothing is saved until the person confirms.
 */
export default function ImportDialog({ entity, title, description, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const downloadTemplate = async () => {
    try {
      const res = await importService.template(entity);
      saveBlob(res.data, `${entity}-import-template.csv`);
    } catch (err) {
      setError(await blobErrorMessage(err, 'Could not download the template'));
    }
  };

  const run = async (dryRun) => {
    if (!file) { setError('Choose a .csv or .xlsx file first'); return; }
    setBusy(dryRun ? 'check' : 'import');
    setError('');
    try {
      const res = await importService.upload(entity, file, dryRun);
      const data = res.data?.data;
      setReport({ ...data, wasDryRun: dryRun });
      if (!dryRun) onImported(data);
    } catch (err) {
      setError(apiError(err, 'The file could not be processed'));
      setReport(null);
    } finally {
      setBusy('');
    }
  };

  const importedDone = report && !report.wasDryRun;
  const canImport = report && report.wasDryRun && report.validRows > 0;

  return (
    <Modal isOpen onClose={onClose} title={title} subtitle={description} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button type="button" onClick={downloadTemplate}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
          <FiDownload size={14} /> Download the template
        </button>

        {!importedDone && (
          <FileUpload value={file} onChange={(f) => { setFile(f); setReport(null); setError(''); }} accept=".csv,.xlsx"
            maxSizeText="Up to 5,000 rows" subtext="CSV or XLSX" placeholder="Click to choose a file or drag it here" />
        )}

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{error}</span>
          </div>
        )}

        {report && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>
              <FiCheckCircle size={15} color={importedDone ? '#059669' : '#64748B'} />
              {importedDone
                ? `${report.created} of ${report.totalRows} row(s) imported`
                : `${report.validRows} of ${report.totalRows} row(s) are ready to import`}
            </div>
            {report.errors?.length > 0 && (
              <div style={{ marginTop: 10, maxHeight: 180, overflowY: 'auto' }}>
                {report.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: '#991B1B', padding: '4px 0', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
                    Row {e.row}{e.field ? ` (${e.field})` : ''}: {e.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>{importedDone ? 'Close' : 'Cancel'}</button>
          {!importedDone && (
            <>
              <button className="btn btn-secondary" onClick={() => run(true)} disabled={!!busy || !file}>
                {busy === 'check' ? 'Checking…' : 'Check file'}
              </button>
              <button onClick={() => run(false)} disabled={!!busy || !canImport}
                style={{ padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: canImport ? 'pointer' : 'not-allowed', opacity: canImport ? 1 : 0.6 }}>
                {busy === 'import' ? 'Importing…' : 'Import valid rows'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
