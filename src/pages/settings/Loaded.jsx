import { ErrorBanner, PanelSkeleton } from './settingsShared';

/**
 * Renders `children(data)` once an `useApi` result has data; a skeleton while it loads for the first time and
 * an error banner with Retry when it failed. Form tabs mount their form inside it so the form starts from the
 * loaded values.
 */
export default function Loaded({ api, rows = 4, children }) {
  if (api.data) return children(api.data.data, api.data);
  if (api.error) return <ErrorBanner message={api.error} onRetry={api.reload} />;
  return <PanelSkeleton rows={rows} />;
}
