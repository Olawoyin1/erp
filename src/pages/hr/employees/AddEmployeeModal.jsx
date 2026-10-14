import EmployeeForm from './EmployeeForm';

/** Register a new employee. `onAdd(payload)` resolves to nothing on success or `{ message, details }` on refusal. */
export default function AddEmployeeModal({ onClose, onAdd }) {
  return <EmployeeForm mode="add" onClose={onClose} onSubmit={onAdd} />;
}
