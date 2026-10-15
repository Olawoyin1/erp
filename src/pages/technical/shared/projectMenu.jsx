import { FiAlertTriangle, FiCheck, FiDownload, FiEdit2, FiPause, FiPlay, FiShare2 } from 'react-icons/fi';

/** The per-status row menu of the Projects designs, filtered by what the user may do. */
export function projectMenuItems(project, can, handlers) {
  const item = (label, icon, action, color) => ({ label, icon, action, ...(color ? { color } : {}) });
  const edit = can.update && item('Edit Project', <FiEdit2 size={13} />, () => handlers.edit(project));
  const share = can.export && item('Share Progress', <FiShare2 size={13} />, () => handlers.open('share', project));
  const transition = (label, icon, key, color) => can.transition && item(label, icon, () => handlers.open(key, project), color);
  const byStatus = {
    completed: [can.export && item('Export Report', <FiDownload size={13} />, () => handlers.exportReport(project)), share],
    on_hold: [edit, transition('Resume', <FiPlay size={13} />, 'resume')],
    in_progress: [
      edit,
      transition('Put on Hold', <FiPause size={13} />, 'hold'),
      transition('Mark At Risk', <FiAlertTriangle size={13} />, 'atRisk'),
      transition('Completed', <FiCheck size={13} color="#10B981" />, 'complete', '#10B981'),
    ],
    at_risk: [edit, transition('Put on Hold', <FiPause size={13} />, 'hold'), transition('In Progress', <FiCheck size={13} />, 'inProgress'), share],
    delayed: [transition('Update Timeline', <FiEdit2 size={13} />, 'timeline'), share],
  };
  return (byStatus[project.status] || []).filter(Boolean);
}
