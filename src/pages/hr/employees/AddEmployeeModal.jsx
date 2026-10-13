import React, { useState } from 'react';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select } from '../../../components/ui/FormField';

const DEPARTMENTS = [
  'Engineering', 'HSE', 'Operations', 'Administration',
  'Finance & Accounts', 'Procurement', 'Human Resources',
  'Mechanical Engineering', 'Civil Engineering', 'Quality Assurance',
];

export default function AddEmployeeModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: 'Engineering',   // sent as departmentId — backend accepts name or id
    employmentType: 'Full-time',
    contractType: 'permanent',
    hireDate: '',
    // baseSalary sent as kobo — user types naira, we convert on submit
    baseSalaryNaira: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build the API payload — field names must match POST /employees
    const payload = {
      fullName:     formData.fullName,
      email:        formData.email,
      phone:        formData.phone,
      position:     formData.position,
      departmentId: formData.department,   // backend resolves name or ObjectId
      employmentType: formData.employmentType,
      contractType: formData.contractType,
      hireDate:     formData.hireDate || undefined,
      baseSalary:   formData.baseSalaryNaira
        ? Math.round(parseFloat(formData.baseSalaryNaira) * 100)   // naira → kobo
        : 0,
    };
    onAdd(payload);
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
        form="add-employee-form"
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
        Register Personnel
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Personnel Member"
      subtitle="Fill out official personnel profile credentials for PGSL ERP"
      width="540px"
      footer={footer}
    >
      <form id="add-employee-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="Full Legal Name" required>
          <Input name="fullName" value={formData.fullName} onChange={handleChange}
            placeholder="e.g. Angela Amara Davids" required />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Email Address" required>
            <Input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="angela@pgsl.ng" required />
          </FormField>
          <FormField label="Phone Number" required>
            <Input name="phone" value={formData.phone} onChange={handleChange}
              placeholder="+234..." required />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Assigned Position" required>
            <Input name="position" value={formData.position} onChange={handleChange}
              placeholder="e.g. Senior Mechanical Engineer" required />
          </FormField>
          <FormField label="Department" required>
            <Select name="department" value={formData.department} onChange={handleChange} options={DEPARTMENTS} />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Contract Type" required>
            <Select name="contractType" value={formData.contractType} onChange={handleChange}
              options={['permanent', 'contract', 'temporary']} />
          </FormField>
          <FormField label="Employment Type">
            <Select name="employmentType" value={formData.employmentType} onChange={handleChange}
              options={['Full-time', 'Part-time']} />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Hire Date">
            <Input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} />
          </FormField>
          <FormField label="Base Salary (₦)">
            <Input type="number" name="baseSalaryNaira" value={formData.baseSalaryNaira}
              onChange={handleChange} placeholder="e.g. 850000" />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}
