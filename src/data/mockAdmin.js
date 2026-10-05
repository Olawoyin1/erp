// ─── Mock Data: Administration Module ───────────────────────────────────────

// ── EDMS ─────────────────────────────────────────────────────────────────────
export const mockEDMS = [
  { id: 'HSE-001', title: 'Emergency Response Procedure', department: 'HSE', version: 'V1.0', status: 'Checked Out', lastModified: '28/05/25', owner: 'Nafisat Abubakar' },
  { id: 'HSE-002', title: 'Permit to Work Procedure', department: 'HSE', version: 'V2.0', status: 'Approved', lastModified: '28/05/25', owner: 'Oluwaseun Adebayo' },
  { id: 'QSM-001', title: 'Quality Management Manual', department: 'Quality', version: 'V1.0', status: 'Checked Out', lastModified: '28/05/25', owner: 'Nafisat Abubakar' },
  { id: 'PRO-001', title: 'Procurement Evaluation Form', department: 'Procurement', version: 'V1.0', status: 'Approved', lastModified: '28/05/25', owner: 'Ifeanyi Uche' },
  { id: 'ADM-001', title: 'Company Travel Policy', department: 'Administration', version: 'V1.0', status: 'Approved', lastModified: '28/05/25', owner: 'Tunde Adeyemi' },
  { id: 'ADM-002', title: 'Company Travel Policy', department: 'Administration', version: 'V1.0', status: 'Checked Out', lastModified: '28/05/25', owner: 'Zainab Mohammed' },
  { id: 'ADM-003', title: 'Company Travel Policy', department: 'Administration', version: 'V1.0', status: 'Approved', lastModified: '28/05/25', owner: 'Amina Bello' },
  { id: 'ADM-004', title: 'Company Travel Policy', department: 'Administration', version: 'V1.0', status: 'Approved', lastModified: '28/05/25', owner: 'Chijioke Okafor' },
  { id: 'ADM-005', title: 'Company Travel Policy', department: 'Administration', version: 'V1.0', status: 'Checked Out', lastModified: '28/05/25', owner: 'Temitope Alabi' },
  { id: 'ADM-006', title: 'Company Travel Policy', department: 'Administration', version: 'V1.0', status: 'Archived', lastModified: '28/05/25', owner: 'Ngozi Eze' },
];

// ── Assets & Supplies ─────────────────────────────────────────────────────────
export const mockFixedAssets = [
  { id: 'AST-001', name: 'Dell Latitude Laptop (i7, 16GB)', category: 'IT Equipment', custodian: 'Nafisat Abubakar', location: 'Lagos Head Office', condition: 'Good', status: 'In Maintenance' },
  { id: 'AST-002', name: 'Toyota Hilux Double Cab (LOS-001-AA)', category: 'Vehicle & Transport', custodian: 'Chioma Daniels', location: 'Warri Yard', condition: 'Fair', status: 'On Loan' },
  { id: 'AST-003', name: 'Dell Latitude Laptop (i7, 16GB)', category: 'IT Equipment', custodian: 'Ali Nuhu', location: 'Lagos Head Office', condition: 'Fair', status: 'Active' },
  { id: 'AST-004', name: 'Dell Latitude Laptop (i7, 16GB)', category: 'IT Equipment', custodian: 'Gregory Eze', location: 'Lagos Head Office', condition: 'Good', status: 'Active' },
  { id: 'AST-005', name: 'Dell Latitude Laptop (i7, 16GB)', category: 'IT Equipment', custodian: 'Nafisat Abubakar', location: 'Lagos Head Office', condition: 'Fair', status: 'In Maintenance' },
  { id: 'AST-006', name: 'Toyota Hilux Double Cab (LOS-001-AA)', category: 'Vehicle & Transport', custodian: 'Nafisat Abubakar', location: 'Warri Yard', condition: 'Poor', status: 'In Maintenance' },
  { id: 'AST-007', name: 'Toyota Hilux Double Cab (LOS-001-AA)', category: 'Vehicle & Transport', custodian: 'Nafisat Abubakar', location: 'Warri Yard', condition: 'Good', status: 'On Loan' },
  { id: 'AST-008', name: 'Toyota Hilux Double Cab (LOS-001-AA)', category: 'Vehicle & Transport', custodian: 'Nafisat Abubakar', location: 'Warri Yard', condition: 'Fair', status: 'Active' },
  { id: 'AST-009', name: 'Toyota Hilux Double Cab (LOS-001-AA)', category: 'Vehicle & Transport', custodian: 'Nafisat Abubakar', location: 'Warri Yard', condition: 'Poor', status: 'Retired' },
];

export const mockOfficeSupplies = [
  { id: 'SUP-001', name: 'A4 Paper Ream (80gsm)', category: 'Stationery', unit: 'Ream', qty: 42, reorderLevel: 20, location: 'Lagos Head Office', lastRestocked: '28/05/25', status: 'In Stock' },
  { id: 'SUP-002', name: 'Ballpoint Pens (Box of 50)', category: 'Printing Supply', unit: 'Box', qty: 7, reorderLevel: 2, location: 'Warri Yard', lastRestocked: '28/05/25', status: 'Low Stock' },
  { id: 'SUP-003', name: 'Hand Sanitizer 500ml', category: 'Hygiene & Cleaning', unit: 'Unit', qty: 56, reorderLevel: 15, location: 'Lagos Head Office', lastRestocked: '28/05/25', status: 'In Stock' },
  { id: 'SUP-004', name: 'A4 Paper Ream (80gsm)', category: 'IT Equipment', unit: 'Box', qty: 42, reorderLevel: 20, location: 'Lagos Head Office', lastRestocked: '28/05/25', status: 'In Stock' },
  { id: 'SUP-005', name: 'A4 Paper Ream (80gsm)', category: 'IT Equipment', unit: 'Box', qty: 42, reorderLevel: 20, location: 'Lagos Head Office', lastRestocked: '28/05/25', status: 'Out of Stock' },
  { id: 'SUP-006', name: 'A4 Paper Ream (80gsm)', category: 'Vehicle & Transport', unit: 'Box', qty: 42, reorderLevel: 20, location: 'Warri Yard', lastRestocked: '28/05/25', status: 'Low Stock' },
  { id: 'SUP-007', name: 'A4 Paper Ream (80gsm)', category: 'Vehicle & Transport', unit: 'Unit', qty: 42, reorderLevel: 20, location: 'Warri Yard', lastRestocked: '28/05/25', status: 'Low Stock' },
  { id: 'SUP-008', name: 'A4 Paper Ream (80gsm)', category: 'Vehicle & Transport', unit: 'Ream', qty: 42, reorderLevel: 20, location: 'Warri Yard', lastRestocked: '28/05/25', status: 'In Stock' },
  { id: 'SUP-009', name: 'A4 Paper Ream (80gsm)', category: 'Vehicle & Transport', unit: 'Ream', qty: 42, reorderLevel: 20, location: 'Warri Yard', lastRestocked: '28/05/25', status: 'Out of Stock' },
];

// ── Administrative Requests ───────────────────────────────────────────────────
export const mockAdminRequests = [
  { id: 'ADM-REQ-001', type: 'Office Supplies', request: 'A4 Printing Paper', qty: '10 Reams', requestedBy: 'Chidi Okafor', date: '28/05/25', urgency: 'Routine', status: 'Issued' },
  { id: 'ADM-REQ-002', type: 'Furniture', request: 'Office Chairs — Replacement', qty: '3 Pieces', requestedBy: 'Zainab Mohammed', date: '28/05/25', urgency: 'Urgent', status: 'HOD Reviewing' },
  { id: 'ADM-REQ-003', type: 'Office Supplies', request: 'Extension Cables', qty: '5 Pieces', requestedBy: 'Obinna Nwosu', date: '28/05/25', urgency: 'Critical', status: 'HOD Approved' },
  { id: 'ADM-REQ-004', type: 'Office Supplies', request: 'Printer Toner', qty: '12 Pieces', requestedBy: 'Adaobi Udo', date: '28/05/25', urgency: 'Routine', status: 'Store Reviewing' },
  { id: 'ADM-REQ-005', type: 'Cleaning Supplies', request: 'Multipurpose Cleaner', qty: '1 Bottle', requestedBy: 'Tunde Adebayo', date: '28/05/25', urgency: 'Routine', status: 'Store Reviewing' },
  { id: 'ADM-REQ-006', type: 'Cleaning Supplies', request: 'Refuse Bags', qty: '5 Packs', requestedBy: 'Ngozi Eze', date: '28/05/25', urgency: 'Urgent', status: 'Returned' },
  { id: 'ADM-REQ-007', type: 'Office Equipment', request: 'Desktop Monitor', qty: '5 Rolls', requestedBy: 'Femi Balogun', date: '28/05/25', urgency: 'Urgent', status: 'HOD Reviewing' },
  { id: 'ADM-REQ-008', type: 'IT Equipment', request: 'Wireless Keyboard', qty: '5 Rolls', requestedBy: 'Yejide Ogunleye', date: '28/05/25', urgency: 'Routine', status: 'Unavailable' },
  { id: 'ADM-REQ-009', type: 'Stationery', request: 'Ballpoint Pens', qty: '5 Boxes', requestedBy: 'Ifeoma Nnaji', date: '28/05/25', urgency: 'Critical', status: 'Cancelled' },
  { id: 'ADM-REQ-010', type: 'Stationery', request: 'Ballpoint Pens', qty: '5 Boxes', requestedBy: 'Sola Oladipo', date: '28/05/25', urgency: 'Urgent', status: 'Rejected by HOD' },
];

// ── Facility Maintenance ──────────────────────────────────────────────────────
export const mockFacilityMaintenance = [
  { id: 'FAC-25-001', facility: 'Lagos Head Office — Generator', type: 'Preventive', description: 'Monthly servicing and oil change', assignedTo: 'PGSL Facility Team', frequency: 'Monthly', dueDate: '28/05/25', status: 'Scheduled' },
  { id: 'FAC-25-002', facility: 'Warri Yard — Borehole Pump', type: 'Corrective', description: 'Pump vibration, pressure loss — repair and test', assignedTo: 'External Vendor (AquaTech Services)', frequency: 'One-time', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'FAC-25-003', facility: 'Lagos Head Office — Generator', type: 'Preventive', description: 'Monthly servicing and oil change', assignedTo: 'Electrical Contractor', frequency: 'Quarterly', dueDate: '28/05/25', status: 'Completed' },
  { id: 'FAC-25-004', facility: 'Lagos Head Office — Generator', type: 'Corrective', description: 'Monthly servicing and oil change', assignedTo: 'PGSL Facility Team', frequency: 'Quarterly', dueDate: '28/05/25', status: 'Completed' },
  { id: 'FAC-25-005', facility: 'Lagos Head Office — Generator', type: 'Preventive', description: 'Monthly servicing and oil change', assignedTo: 'PGSL Facility Team', frequency: 'Quarterly', dueDate: '28/05/25', status: 'Scheduled' },
  { id: 'FAC-25-006', facility: 'Lagos Head Office — Generator', type: 'Preventive', description: 'Pump vibration, pressure loss — repair and test', assignedTo: 'PGSL Facility Team', frequency: 'Monthly', dueDate: '28/05/25', status: 'Scheduled' },
  { id: 'FAC-25-007', facility: 'Lagos Head Office — Generator', type: 'Corrective', description: 'Pump vibration, pressure loss — repair and test', assignedTo: 'PGSL Facility Team', frequency: 'Monthly', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'FAC-25-008', facility: 'Warri Yard — Borehole Pump', type: 'Preventive', description: 'Pump vibration, pressure loss — repair and test', assignedTo: 'PGSL Facility Team', frequency: 'Monthly', dueDate: '28/05/25', status: 'Completed' },
  { id: 'FAC-25-009', facility: 'Warri Yard — Borehole Pump', type: 'Preventive', description: 'Pump vibration, pressure loss — repair and test', assignedTo: 'PGSL Facility Team', frequency: 'Bi-annually', dueDate: '28/05/25', status: 'Overdue' },
  { id: 'FAC-25-010', facility: 'Warri Yard — Borehole Pump', type: 'Preventive', description: 'Pump vibration, pressure loss — repair and test', assignedTo: 'PGSL Facility Team', frequency: 'Monthly', dueDate: '28/05/25', status: 'Cancelled' },
];

// ── Travel & Logistics ────────────────────────────────────────────────────────
export const mockTravelRequests = [
  { id: 'TRV-25-031', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Warri Yard', departure: '28/05/25', returnDate: '28/05/25', mode: 'Company Vehicle', accommodation: 'Yes (2 nights)', status: 'Approved' },
  { id: 'TRV-25-032', traveler: 'Aisha Suleiman', from: 'Lagos Head Office', to: 'Client Site (Seplat — Warri)', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'No', status: 'Pending' },
  { id: 'TRV-25-033', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Hired Vehicle', accommodation: 'Yes (2 nights)', status: 'Approved' },
  { id: 'TRV-25-034', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Boat', accommodation: 'Yes (2 nights)', status: 'Rejected' },
  { id: 'TRV-25-035', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'Yes (2 nights)', status: 'Approved' },
  { id: 'TRV-25-036', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'No', status: 'Draft' },
  { id: 'TRV-25-037', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'No', status: 'Pending' },
  { id: 'TRV-25-038', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'No', status: 'Pending' },
  { id: 'TRV-25-039', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'Yes (2 nights)', status: 'Approved' },
  { id: 'TRV-25-040', traveler: 'Tunde Fashola', from: 'Lagos Head Office', to: 'Abuja', departure: '28/05/25', returnDate: '28/05/25', mode: 'Domestic Flight', accommodation: 'No', status: 'Approved' },
];

// ── Memos ─────────────────────────────────────────────────────────────────────
export const mockMemos = [
  {
    id: 'MEM-2025-0412',
    subject: 'Site Safety Compliance — Tower Block C, Level 14',
    from: 'Nafisat Abubakar',
    fromRole: 'HSE Manager',
    to: ['Project Leads', 'Safety Officers', 'Site Supervisors'],
    date: '04 Jul 2025 - 09:14',
    department: 'Health & Safety',
    tags: ['Health & Safety'],
    priority: 'High',
    attachments: 2,
    body: `Following yesterday's unannounced inspection of Tower Block C, Level 14, several non-conformances were identified that require immediate corrective action before work may resume on that floor.\n\nNon-conformances identified:\n• Incomplete edge protection along the north façade (Sections N-4 through N-7)\n• Missing fall-arrest anchorage points at curtain wall installation zone\n• Two operatives observed without appropriate PPE (harnesses not worn)\n• Housekeeping: excessive debris accumulation in stairwell B exit\n\nA stop-work notice has been issued for Level 14 activities until all items are remediated and a re-inspection is completed by the HSE team. Please ensure your teams are briefed by 11:00 today.\n\nCorrective action plans must be submitted to this office by 16:00 on 04 Jul 2025. Failure to comply will be escalated to the client's representative.`,
    status: 'Unread',
    folder: 'Inbox',
  },
  {
    id: 'MEM-2025-0411',
    subject: 'Q3 Budget Review — Finance Summary',
    from: 'Chioma Daniels',
    fromRole: 'CFO',
    to: ['Department Heads'],
    date: '03 Jul 2025 - 14:30',
    department: 'Finance',
    tags: ['Finance'],
    priority: 'Medium',
    attachments: 1,
    body: `Please find attached the Q3 budget summary for review. All HODs are required to respond with their departmental comments by end of week.`,
    status: 'Read',
    folder: 'Inbox',
  },
  {
    id: 'MEM-2025-0410',
    subject: 'New Office Procedure — Visitor Management',
    from: 'Admin Office',
    fromRole: 'Admin Manager',
    to: ['All Staff'],
    date: '02 Jul 2025 - 10:00',
    department: 'Administration',
    tags: ['General'],
    priority: 'Low',
    attachments: 0,
    body: `Effective immediately, all visitors must be registered at the front desk upon arrival. The new QR code badge system is now active.`,
    status: 'Read',
    folder: 'Inbox',
  },
];

export const mockMemosDrafts = [
  { id: 'DFT-001', subject: 'Updated HSE Procedures', to: 'All Staff', date: '05 Jul 2025', status: 'Draft' },
];

// ── Waste & Disposal ──────────────────────────────────────────────────────────
export const mockWasteStats = {
  totalGenerated: '245 Tons',
  totalDisposed: '198 Tons',
  awaitingManifest: 8,
  complianceRate: '88%',
};

export const mockWasteDisposal = [
  { id: 'DSP-25-018', description: 'Old laptops — end of life (x4)', type: 'IT Equipment', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Completed' },
  { id: 'DSP-25-019', description: 'Cardboard and paper waste — May batch', type: 'Paper & Cardboard', qty: '~80kg', method: 'Recycling', date: '28/05/25', disposedBy: 'Aisha Suleiman', vendor: 'GreenIT Recyclers Ltd', status: 'Pending' },
  { id: 'DSP-25-020', description: 'Old laptops — end of life (x4)', type: 'IT Equipment', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Completed' },
  { id: 'DSP-25-021', description: 'Old laptops — end of life (x4)', type: 'General Waste', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Completed' },
  { id: 'DSP-25-022', description: 'Old laptops — end of life (x4)', type: 'IT Equipment', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Pending' },
  { id: 'DSP-25-023', description: 'Old laptops — end of life (x4)', type: 'IT Equipment', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Completed' },
  { id: 'DSP-25-024', description: 'Old laptops — end of life (x4)', type: 'IT Equipment', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Completed' },
  { id: 'DSP-25-025', description: 'Old laptops — end of life (x4)', type: 'IT Equipment', qty: '4 units', method: 'Vendor Collection', date: '28/05/25', disposedBy: 'Tunde Fashola', vendor: 'GreenIT Recyclers Ltd', status: 'Pending' },
];

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const mockAdminTaskStats = {
  total: 128, inProgress: 32, dueThisWeek: 65, overdue: 25,
};

export const mockAdminTasks = [
  { id: 'ADM-TSK-001', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'High', dueDate: '28/05/25', status: 'To Do' },
  { id: 'ADM-TSK-002', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Waste Management', priority: 'Medium', dueDate: '28/05/25', status: 'To Do' },
  { id: 'ADM-TSK-003', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'Medium', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'ADM-TSK-004', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'High', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'ADM-TSK-005', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'Low', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'ADM-TSK-006', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'Hot', dueDate: '28/05/25', status: 'Done' },
  { id: 'ADM-TSK-007', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'High', dueDate: '28/05/25', status: 'Done' },
  { id: 'ADM-TSK-008', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'Low', dueDate: '28/05/25', status: 'Done' },
  { id: 'ADM-TSK-009', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'High', dueDate: '28/05/25', status: 'Overdue' },
  { id: 'ADM-TSK-010', task: 'Resolve pending COC documents — DSP-2025-015 and DSP-2025-012', assignedTo: 'Nafisat Abubakar', relatedTo: 'Asset Management', priority: 'Medium', dueDate: '28/05/25', status: 'Overdue' },
];

// ── Admin Documents ───────────────────────────────────────────────────────────
export const mockAdminDocuments = [
  { id: 'ADM-001', title: 'Company Travel Policy', category: 'Travel & Logistics', version: 'V1.0', uploadedBy: 'Chinonso Okafor', status: 'Approved', lastUpdated: '28/05/25' },
  { id: 'ADM-002', title: 'Visitor Management Procedure', category: 'Facility Maintenance', version: 'V1.0', uploadedBy: 'Fatima Ibrahim', status: 'Under Review', lastUpdated: '28/05/25' },
  { id: 'ADM-003', title: 'Office Asset Management Policy', category: 'Office Assets', version: 'V1.0', uploadedBy: 'Emmanuel Eze', status: 'Under Review', lastUpdated: '28/05/25' },
  { id: 'ADM-004', title: 'Administrative Request Form', category: 'Administrative Requests', version: 'V1.0', uploadedBy: 'Zainab Mohammed', status: 'Approved', lastUpdated: '28/05/25' },
  { id: 'ADM-005', title: 'Office Circular Template', category: 'Internal Communications', version: 'V1.0', uploadedBy: 'Adeola Olatunji', status: 'Draft', lastUpdated: '28/05/25' },
  { id: 'ADM-006', title: 'Office Circular Template', category: 'Internal Communications', version: 'V1.0', uploadedBy: 'Tunde Bakare', status: 'Under Review', lastUpdated: '28/05/25' },
  { id: 'ADM-007', title: 'Office Circular Template', category: 'Internal Communications', version: 'V1.0', uploadedBy: 'Amaka Ugochukwu', status: 'Approved', lastUpdated: '28/05/25' },
  { id: 'ADM-008', title: 'Office Circular Template', category: 'Internal Communications', version: 'V1.0', uploadedBy: 'Damilola Adebayo', status: 'Checked Out', lastUpdated: '28/05/25' },
  { id: 'ADM-009', title: 'Office Circular Template', category: 'Internal Communications', version: 'V1.0', uploadedBy: 'Chidera Nwosu', status: 'Draft', lastUpdated: '28/05/25' },
  { id: 'ADM-010', title: 'Office Circular Template', category: 'Internal Communications', version: 'V1.0', uploadedBy: 'Ijeoma Chukwuma', status: 'Archived', lastUpdated: '28/05/25' },
];

// ── Reports ───────────────────────────────────────────────────────────────────
export const mockAdminReportStats = [
  { label: 'Total Pipeline Value', value: '₦2.62B', trend: '+8% vs last year', icon: 'pipeline' },
  { label: 'Opportunity Conversion', value: '61%', trend: '+4.2% vs Q1 average', icon: 'conversion' },
  { label: 'RFQ Proposal Success', value: '57%', trend: '+1.5% higher drawing precision', icon: 'rfq' },
  { label: 'Team Tasks Resolved', value: '12/20', trend: '1 critical bidding delays', icon: 'tasks' },
];

export const mockMonthlyRevenue = [
  { month: 'Jan', awarded: 55, pipeline: 80 },
  { month: 'Feb', awarded: 90, pipeline: 120 },
  { month: 'Mar', awarded: 110, pipeline: 160 },
  { month: 'Apr', awarded: 175, pipeline: 190 },
  { month: 'May', awarded: 140, pipeline: 140 },
  { month: 'Jun', awarded: 155, pipeline: 80 },
];

export const mockRFQPerformance = {
  submittedRFQs: 42,
  rfqValueYTD: '₦52.6M',
  distribution: [
    { label: 'Pending Assessment', rfqs: 1, value: '#12M' },
    { label: 'In Formulation', rfqs: 2, value: '#12M' },
    { label: 'Under Review', rfqs: 3, value: '#12M' },
    { label: 'Submitted & Active', rfqs: 1, value: '#12M' },
  ],
};

export const mockPipelineFunnel = [
  { stage: 'Lead Intake (100%)', count: 32, percent: 100 },
  { stage: 'Qualified (75%)', count: 24, percent: 75 },
  { stage: 'Proposal Sent (45%)', count: 14, percent: 45 },
  { stage: 'Negotiation (27%)', count: 9, percent: 27 },
  { stage: 'Won (16%)', count: 5, percent: 16 },
  { stage: 'Lost (2%)', count: 1, percent: 2 },
];
