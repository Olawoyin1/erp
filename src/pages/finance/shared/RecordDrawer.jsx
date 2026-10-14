import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { DataState, DetailGrid, DrawerStatusBar, FormError, Note, Panel, SecondaryButton, StatusBadge, TabBar } from './FinanceUi';
import { DocumentUploads, HistoryList } from './FinanceRecordExtras';
import { downloadFile } from './financeUtils';
import { useRecord } from './useRecord';

/**
 * The View drawer every finance record shares: a status bar with actions, a details tab (grid, notes,
 * text panels, documents) and a history tab (the activity trail). `describe(record)` returns:
 *   { title, subtitle, status, actions: [node], notes: [{ tone, text }], items: [[label, value]],
 *     panels: [{ title, text }], canEditDocs, pdfName, extraTabs: [{ id, label, render }] }
 * `pdfName` shows an Export button when the api has `pdf(id)`.
 */
export default function RecordDrawer({ api, id, refreshKey = 0, onClose, describe, detailsLabel = 'Details', historyLabel = 'History', width = '560px' }) {
  const { record, loading, error } = useRecord(api, id, refreshKey);
  const [tab, setTab] = useState('details');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const view = record ? describe(record) : null;

  const exportPdf = async () => {
    setExporting(true);
    setExportError('');
    const failure = await downloadFile(() => api.pdf(id), view.pdfName);
    if (failure) setExportError(failure);
    setExporting(false);
  };

  const tabs = [{ id: 'details', label: detailsLabel }, ...(view?.extraTabs || []).map((t) => ({ id: t.id, label: t.label })), { id: 'history', label: historyLabel }];
  const extra = (view?.extraTabs || []).find((t) => t.id === tab);

  return (
    <Drawer isOpen onClose={onClose} title={view?.title || 'Details'} subtitle={view?.subtitle} width={width} footer={<SecondaryButton style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</SecondaryButton>}>
      <DataState loading={loading} error={error} empty={!loading && !error && !record}>
        {view && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerStatusBar status={<StatusBadge status={view.status} label={view.statusLabel} />}>
              {view.actions}
              {view.pdfName && api.pdf && <SecondaryButton icon={<FiDownload size={13} />} onClick={exportPdf} disabled={exporting}>{exporting ? 'Exporting…' : view.exportLabel || 'Export PDF'}</SecondaryButton>}
            </DrawerStatusBar>
            {exportError && <FormError message={exportError} />}
            {(view.notes || []).filter(Boolean).map((n) => <Note key={n.text} tone={n.tone || 'amber'}>{n.text}</Note>)}
            <TabBar tabs={tabs} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={view.items} />
                {(view.panels || []).filter(Boolean).map((p) => <Panel key={p.title} title={p.title}>{p.text || p.empty || '—'}</Panel>)}
                <DocumentUploads key={record._id} api={api} id={record._id} canEdit={Boolean(view.canEditDocs)} />
              </>
            )}
            {extra && extra.render(record)}
            {tab === 'history' && <HistoryList key={record._id + refreshKey} api={api} id={record._id} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}
