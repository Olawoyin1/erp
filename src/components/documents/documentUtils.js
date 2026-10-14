import {
  FiEdit2, FiSend, FiCheck, FiX, FiDownload, FiUnlock, FiLock, FiUpload, FiArchive, FiRefreshCw, FiRepeat, FiTrash2,
} from 'react-icons/fi';

export const STATUS_LABEL = {
  draft: 'Draft',
  under_review: 'Under Review',
  approved: 'Approved',
  checked_out: 'Checked Out',
  archived: 'Archived',
};

export const MODULE_LABEL = {
  hr: 'Human Resources',
  administration: 'Administration',
  hse: 'HSE',
  procurement: 'Procurement',
  quality: 'Quality',
  technical: 'Technical',
  finance: 'Finance',
  businessdev: 'Business Development',
};

export const ACCESS_LABEL = { all_staff: 'All Staff', department: 'Department' };

export const ACCESS_OPTIONS = [
  { value: 'all_staff', label: 'All Staff' },
  { value: 'department', label: 'Department' },
];

export const PERMISSION_FOR = {
  edit: 'core.document.update',
  submit: 'core.document.update',
  approve: 'core.document.approve',
  reject: 'core.document.reject',
  download: 'core.document.view',
  checkout: 'core.document.checkout',
  checkin: 'core.document.checkin',
  uploadVersion: 'core.document.update',
  archive: 'core.document.archive',
  restore: 'core.document.restore',
  replace: 'core.document.update',
  delete: 'core.document.delete',
};

const ACTION = {
  edit: { label: 'Edit File', icon: FiEdit2 },
  submit: { label: 'Submit for Review', icon: FiSend },
  approve: { label: 'Approve File', icon: FiCheck, color: '#10B981' },
  reject: { label: 'Reject File', icon: FiX, color: '#DC2626' },
  download: { label: 'Download File', icon: FiDownload },
  checkout: { label: 'Check-Out File', icon: FiUnlock },
  checkin: { label: 'Check-In File', icon: FiLock },
  uploadVersion: { label: 'Upload New Version', icon: FiUpload },
  archive: { label: 'Archive File', icon: FiArchive },
  restore: { label: 'Restore File', icon: FiRefreshCw },
  replace: { label: 'Replace Document', icon: FiRepeat },
  delete: { label: 'Delete File', icon: FiTrash2, color: '#DC2626' },
};

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

export const isUploader = (doc, userId) => !!userId && idOf(doc.uploadedBy) === userId;
export const isCheckedOutBy = (doc, userId) => !!userId && idOf(doc.checkedOutBy) === userId;

/**
 * The actions a document offers, by variant and state, filtered by what the caller may do.
 * `can(permissionKey)` is the permission check; `userId` is the signed-in user.
 */
export function documentActions(doc, { variant, can, userId, deleteLabel }) {
  let keys;
  if (variant === 'controlled') {
    const mine = isCheckedOutBy(doc, userId);
    switch (doc.status) {
      case 'draft': keys = ['edit', 'submit', 'download']; break;
      case 'under_review': keys = ['approve', 'reject', 'download']; break;
      case 'approved': keys = ['download', 'checkout', 'uploadVersion', 'archive']; break;
      case 'checked_out': keys = mine ? ['download', 'checkin', 'uploadVersion'] : ['download']; break;
      case 'archived': keys = ['restore', 'download']; break;
      default: keys = ['download'];
    }
  } else if (variant === 'library') {
    keys = ['replace', 'download', 'delete'];
  } else if (variant === 'plain') {
    keys = ['download', 'delete'];
  } else {
    keys = ['download'];
  }
  return keys
    .filter((key) => can(PERMISSION_FOR[key]))
    .map((key) => ({
      key,
      ...ACTION[key],
      label: key === 'delete' && deleteLabel ? deleteLabel : ACTION[key].label,
    }));
}
