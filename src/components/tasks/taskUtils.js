export const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
export const STATUS_KEYS = ['todo', 'in_progress', 'done'];

export const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', hot: 'Hot' };
export const ALL_PRIORITIES = ['high', 'medium', 'low', 'hot'];

export const PRIORITY_STYLE = {
  hot: { bg: '#FEE2E2', color: '#DC2626' },
  high: { bg: '#FFE4E6', color: '#E11D48' },
  medium: { bg: '#FEF3C7', color: '#D97706' },
  low: { bg: '#E0F2FE', color: '#0284C7' },
};

/** The status shown to people: a task past its due date and not done reads "Overdue" (a flag, not a stored status). */
export function displayStatus(task) {
  if (task.isOverdue && task.status !== 'done') return 'Overdue';
  return STATUS_LABEL[task.status] || task.status;
}

export const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

export const emptyTaskForm = {
  title: '',
  assigneeId: '',
  relatedTo: '',
  priority: 'medium',
  startDate: '',
  dueDate: '',
  description: '',
  projectId: '',
  linkedActivityId: '',
};

export function formFromTask(task) {
  return {
    title: task.title || '',
    assigneeId: task.assigneeId?._id || task.assigneeId || '',
    relatedTo: task.relatedTo || '',
    priority: task.priority || 'medium',
    startDate: toDateInput(task.startDate),
    dueDate: toDateInput(task.dueDate),
    description: task.description || '',
    projectId: task.projectId?._id || task.projectId || '',
    linkedActivityId: task.linkedActivityId?._id || task.linkedActivityId || '',
  };
}
