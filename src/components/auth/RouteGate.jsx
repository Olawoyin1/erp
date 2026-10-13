import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermission';
import { canOpenPath, firstPathInSection, getLandingPath } from '../layout/navConfig';
import NoAccess from './NoAccess';

/**
 * Layout route that renders the matched page only when the user may open it (the rule comes from
 * navConfig, the same table as the sidebar). Anything else gets the "no access" page instead of a
 * page that would only produce 403 toasts.
 */
export default function RouteGate() {
  const { pathname } = useLocation();
  const { can } = usePermissions();
  if (!canOpenPath(pathname, can)) return <NoAccess />;
  return <Outlet />;
}

/** `/hr` and friends: go to the first page of the section the user may open. */
export function SectionIndex({ base }) {
  const { can } = usePermissions();
  const target = firstPathInSection(base, can);
  return target ? <Navigate to={target} replace /> : <NoAccess />;
}

/** `/`: go to the first page the user may open. */
export function LandingRedirect() {
  const { can } = usePermissions();
  return <Navigate to={getLandingPath(can)} replace />;
}
