import React, { useState, useEffect } from 'react';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea } from '../../../components/ui/FormField';

const DEPARTMENTS = [
  'Engineering',
  'HSE',
  'Operations',
  'Administration',
  'Finance & Accounts',
  'Procurement',
  'Human Resources',
  'Mechanical Engineering',
  'Civil Engineering',
  'Quality Assurance',
];

const MANAGERS = [
  'Engr. Tunde Bello',
  'Oluwatobi Ajeniya',
  'Chidozie Godwin',
  'Saurusi Fareedah',
  'Bamidele Olayiwola',
];

export default function EditEmployeeModal({ isOpen = true, employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    email: '',
    phone: '',
    position: '',
    department: 'Engineering',
    employmentType: 'Full-time',
    reportingManager: '',
    dateJoined: '',
    status: 'Active',
    basicSalary: '',
    notes: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        id: employee.id || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || 'Engineering',
        employmentType: employee.contractType || 'Full-time',
        reportingManager: employee.reportingManager || employee.manager || 'Engr. Tunde Bello',
        dateJoined: employee.dateJoined || '',
        status: employee.status || 'Active',
        basicSalary: employee.basicSalary || '',
        notes: '',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...employee, ...formData });
  };

  const footer = (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        style={{
          padding: '8px 16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#475569',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        Cancel
      </button>
      <button
        type="submit"
        form="edit-employee-form"
        className="btn btn-primary"
        style={{
          padding: '8px 20px',
          backgroundColor: '#1D4ED8',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        Save Changes
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Staff Credential"
      subtitle="Modify personnel profile details and assignments"
      width="540px"
      footer={footer}
    >
      <form id="edit-employee-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="Full Legal Name" required>
          <Input name="name" value={formData.name} onChange={handleChange} required />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Generated ID" required>
            <Input name="id" value={formData.id} onChange={handleChange} readOnly />
          </FormField>

          <FormField label="Email Address" required>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Phone Number" required>
            <Input name="phone" value={formData.phone} onChange={handleChange} required />
          </FormField>

          <FormField label="Assigned Position" required>
            <Input name="position" value={formData.position} onChange={handleChange} required />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Department" required>
            <Select name="department" value={formData.department} onChange={handleChange} options={DEPARTMENTS} />
          </FormField>

          <FormField label="Employment Type" required>
            <Select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              options={['Full-time', 'Contract', 'Probation', 'Trainee', 'Part-time']}
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Hiring/Reporting Manager" required>
            <Select name="reportingManager" value={formData.reportingManager} onChange={handleChange} options={MANAGERS} />
          </FormField>

          <FormField label="Date Joined">
            <Input name="dateJoined" value={formData.dateJoined} onChange={handleChange} />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Status" required>
            <Select name="status" value={formData.status} onChange={handleChange} options={['Active', 'Probation', 'On Leave', 'Inactive']} />
          </FormField>

          <FormField label="Official Base Salary (#)">
            <Input
              type="number"
              name="basicSalary"
              value={formData.basicSalary}
              onChange={handleChange}
            />
          </FormField>
        </div>

        <FormField label="General Notes">
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter basic evaluation commentary..."
            rows={3}
          />
        </FormField>
      </form>
    </Drawer>
  );
}
