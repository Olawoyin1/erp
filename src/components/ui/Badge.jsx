import React from 'react';

const statusMap = {
  'Active': 'active',
  'Probation': 'probation',
  'On Leave': 'on-leave',
  'Inactive': 'inactive',
  'Valid': 'valid',
  'Expired': 'expired',
  'Approved': 'approved',
  'Rejected': 'rejected',
  'Pending': 'pending',
  'Pending Approval': 'pending',
  'Declined': 'rejected',
  'Cancelled': 'inactive',
  'Current': 'active',
  'Completed': 'inactive',
};

export default function Badge({ status, children }) {
  const text = children || status;
  const cls = statusMap[text] || 'inactive';
  return (
    <span className={`badge badge-${cls}`}>{text}</span>
  );
}
