import EmployeeForm from './EmployeeForm';

/** Edit an employee. `onSave(payload)` receives only the fields that changed; `onPhotoChanged` fires after a photo upload or removal. */
export default function EditEmployeeModal({ employee, onClose, onSave, onPhotoChanged }) {
  return <EmployeeForm mode="edit" employee={employee} onClose={onClose} onSubmit={onSave} onPhotoChanged={onPhotoChanged} />;
}
