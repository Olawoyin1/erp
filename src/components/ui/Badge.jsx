import React from 'react';

const statusMap = {
  // Employee statuses
  'Active': 'active',
  'Probation': 'probation',
  'On Leave': 'on-leave',
  'Inactive': 'inactive',

  // Cert / Training
  'Valid': 'valid',
  'Expired': 'expired',
  'Expiring Soon': 'expiring',

  // Approval / Document
  'Approved': 'approved',
  'Rejected': 'rejected',
  'Rejected by HOD': 'rejected',
  'Pending': 'pending',
  'Pending Approval': 'pending',
  'Declined': 'rejected',
  'Cancelled': 'inactive',
  'Current': 'active',
  'Completed': 'completed',

  // Document workflow
  'Draft': 'draft',
  'Under Review': 'under-review',
  'Checked Out': 'checked-out',
  'Archived': 'archived',
  'Submitted': 'under-review',

  // Task statuses
  'To Do': 'todo',
  'In Progress': 'in-progress',
  'Done': 'done',
  'Overdue': 'overdue',

  // Grievance statuses
  'Open': 'open',
  'Resolved': 'done',
  'Under Investigation': 'under-review',

  // Attendance
  'Present': 'active',
  'Absent': 'rejected',
  'Late': 'expiring',

  // Onboarding
  'Not Started': 'inactive',

  // HR Requests workflow
  'Issued': 'issued',
  'HOD Reviewing': 'hod-reviewing',
  'HOD Approved': 'hod-approved',
  'Store Reviewing': 'store-reviewing',
  'Returned': 'returned',
  'Unavailable': 'inactive',

  // Offshore / HSE
  'Pending Verification': 'pending',
};

export default function Badge({ status, text }) {
  const label = text || status;
  const cls = statusMap[label] || 'inactive';
  return (
    <span className={`badge badge-${cls}`}>{label}</span>
  );
}

