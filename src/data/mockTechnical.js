export const mockProjects = [
  { id: 'PGSL-26-001', name: 'Chevron Wellhead Upgrade', client: 'Chevron Nigeria', manager: 'Chidi Okafor', budget: '₦85M / ₦100M', progress: 82, endDate: '2025-11-28', status: 'At Risk', type: 'Maintenance' },
  { id: 'PGSL-26-002', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Zainab Mohammed', budget: '₦120M / ₦140M', progress: 60, endDate: '2026-03-15', status: 'In Progress', type: 'Maintenance' },
  { id: 'PGSL-26-003', name: 'TotalEnergies Earthing Installation', client: 'TotalEnergies', manager: 'Obinna Nwosu', budget: '₦45M / ₦50M', progress: 35, endDate: '2026-06-30', status: 'On Hold', type: 'Installation' },
  { id: 'PGSL-26-004', name: 'Seplat Flow Station Upgrade', client: 'Seplat Energy', manager: 'Adaobi Udo', budget: '₦200M / ₦220M', progress: 100, endDate: '2025-09-10', status: 'Completed', type: 'Upgrade' },
  { id: 'PGSL-26-005', name: 'Shell NG Cathodic Protection', client: 'Shell Nigeria', manager: 'Tunde Adebayo', budget: '₦60M / ₦75M', progress: 55, endDate: '2026-02-20', status: 'In Progress', type: 'Installation' },
  { id: 'PGSL-26-006', name: 'Agip Pipeline Inspection Survey', client: 'Agip Nigeria', manager: 'Ngozi Eze', budget: '₦30M / ₦35M', progress: 70, endDate: '2026-01-31', status: 'In Progress', type: 'Inspection' },
  { id: 'PGSL-26-007', name: 'Eroton Flowline Repair', client: 'Eroton E&P', manager: 'Femi Balogun', budget: '₦55M / ₦60M', progress: 100, endDate: '2025-08-05', status: 'Completed', type: 'Maintenance' },
  { id: 'PGSL-26-008', name: 'NOAC Manifold Installation', client: 'NOAC', manager: 'Yejide Ogunleye', budget: '₦90M / ₦100M', progress: 100, endDate: '2025-10-22', status: 'Completed', type: 'Installation' },
  { id: 'PGSL-26-009', name: 'Neconde Gas Flare Reduction', client: 'Neconde Energy', manager: 'Ifeoma Nnaji', budget: '₦75M / ₦80M', progress: 45, endDate: '2026-04-14', status: 'Delayed', type: 'Engineering' },
  { id: 'PGSL-26-010', name: 'Heritage Energy Metering Station', client: 'Heritage Energy', manager: 'Sola Oladipo', budget: '₦110M / ₦125M', progress: 20, endDate: '2026-08-01', status: 'At Risk', type: 'Installation' },
];

export const mockProjectDetail = {
  id: 'PGSL-26-001',
  name: 'Chevron Wellhead Upgrade',
  client: 'Chevron Nigeria',
  clientEmail: 'chevronng@chevron.com',
  type: 'Maintenance',
  projectType: 'EPCIC',
  contractType: 'Lump Sum',
  location: 'Bonny Island, Rivers',
  manager: 'Chinonso Okafor',
  technicalLead: 'Musa Bello',
  startDate: '2026-02-14',
  plannedCompletion: '2027-02-14',
  status: 'In Progress',
  budget: 'On Track',
  physicalProgress: 82,
  budgetUtilization: 85,
  openWorkOrders: 14,
  openRisks: 3,
  nextMilestone: '2026-06-24',
  totalApprovedCAPEX: '₦100,000,000',
  totalDisbursed: '₦62M',
  liquidReserve: '₦38M',
  financialStatus: 'On Track',
  description: 'Upgrade the existing wellhead facilities at Chevron Escravo by replacing aging components, carrying out mechanical and electrical modifications, performing equipment testing, and restoring the facility to full operational readiness in compliance with project specifications and safety standards.',
  team: [
    { name: 'Chidi Okafor', role: 'Project Manager', department: 'Operations Management' },
    { name: 'Olawoyin Israel', role: 'Technical Lead', department: 'Piping & Structural Design' },
    { name: 'David Vance', role: 'Senior Civil Engineer', department: 'Civil Engineering' },
    { name: 'Jibril Gold', role: 'HSE Coordinator', department: 'Safety & Training' },
    { name: 'Helen Patrick', role: 'QA/QC Engineer', department: 'Quality Assurance & Control' },
    { name: 'Aisha Ibrahim', role: 'I&C Engineer', department: 'Instrumentation Engineering' },
  ],
  milestones: [
    { name: 'Site Mobilization', date: '2026-03-10', progress: 100, status: 'Completed' },
    { name: 'Equipment Delivery', date: '2026-04-28', progress: 100, status: 'Completed' },
    { name: 'Mechanical Installation', date: '2026-07-10', progress: 50, status: 'In Progress' },
    { name: 'Client Inspection', date: '2026-10-03', progress: 0, status: 'Not Started' },
    { name: 'Final Handover', date: '2027-02-14', progress: 0, status: 'Not Started' },
  ],
};

export const mockWBSActivities = [
  { wbsCode: '1.0', activity: 'Project Kick-off', phase: 'Planning', assignedTo: 'Chidi Okafor', progress: 100, startDate: '2026-02-14', endDate: '2026-02-21', status: 'Completed', type: 'parent' },
  { wbsCode: '1.1', activity: 'Site Mobilization', phase: 'Planning', assignedTo: 'Zainab Mohammed', progress: 100, startDate: '2026-02-22', endDate: '2026-03-10', status: 'Completed', type: 'child' },
  { wbsCode: '2.0', activity: 'Engineering Design', phase: 'Engineering', assignedTo: 'Obinna Nwosu', progress: 100, startDate: '2026-03-11', endDate: '2026-04-15', status: 'Completed', type: 'parent' },
  { wbsCode: '2.1', activity: 'Structural Design', phase: 'Engineering', assignedTo: 'Adaobi Udo', progress: 100, startDate: '2026-03-11', endDate: '2026-04-01', status: 'Completed', type: 'child' },
  { wbsCode: '2.1.1', activity: 'Foundation Calculations', phase: 'Engineering', assignedTo: 'Tunde Adebayo', progress: 96, startDate: '2026-03-15', endDate: '2026-03-28', status: 'In Progress', type: 'grandchild' },
  { wbsCode: '3.0', activity: 'Material Procurement', phase: 'Procurement', assignedTo: 'David Vance', progress: 82, startDate: '2026-04-16', endDate: '2026-05-30', status: 'In Progress', type: 'parent' },
  { wbsCode: '4.0', activity: 'Mechanical Installation', phase: 'Construction', assignedTo: 'Femi Balogun', progress: 45, startDate: '2026-06-01', endDate: '2026-08-15', status: 'On Hold', type: 'parent', isMilestone: true },
  { wbsCode: '4.1', activity: 'Electrical Installation', phase: 'Construction', assignedTo: 'Yejide Ogunleye', progress: 24, startDate: '2026-07-01', endDate: '2026-09-01', status: 'Delayed', type: 'child' },
  { wbsCode: '5.0', activity: 'Client Inspection', phase: 'Commissioning', assignedTo: 'Ifeoma Nnaji', progress: 0, startDate: '2026-10-01', endDate: '2026-10-14', status: 'Pending', type: 'parent', isCritical: true },
  { wbsCode: '6.0', activity: 'Final Handover', phase: 'Close-out', assignedTo: 'Sola Oladipo', progress: 0, startDate: '2027-01-15', endDate: '2027-02-14', status: 'Pending', type: 'parent' },
];

export const mockSiteInspections = [
  { id: 'SI-001', date: '2026-03-12', keyFinding: 'Access restrictions and damaged pipe supports identified', inspectedBy: 'Chidi Okafor' },
  { id: 'SI-002', date: '2026-04-05', keyFinding: 'Pipe support repairs completed; storage area cleared', inspectedBy: 'Zainab Mohammed' },
];

export const mockProjectTasks = [
  { id: 'TSK-001', task: 'Prepare Welding Procedure Specification', assignedTo: 'Chidi Okafor', priority: 'High', dueDate: '2026-05-10', status: 'In Progress' },
  { id: 'TSK-002', task: 'Review P&ID drawings for accuracy', assignedTo: 'Zainab Mohammed', priority: 'High', dueDate: '2026-05-15', status: 'To Do' },
  { id: 'TSK-003', task: 'Submit HSE audit report', assignedTo: 'Obinna Nwosu', priority: 'Medium', dueDate: '2026-04-30', status: 'Done' },
  { id: 'TSK-004', task: 'Coordinate crane lifting schedule', assignedTo: 'Adaobi Udo', priority: 'High', dueDate: '2026-06-01', status: 'In Progress' },
  { id: 'TSK-005', task: 'Update material tracking register', assignedTo: 'Tunde Adebayo', priority: 'Low', dueDate: '2026-04-20', status: 'Overdue' },
];

export const mockProgressLogs = [
  { id: 'LOG-001', type: 'Risk', title: 'Heavy rainfall forecast', relatedWBS: 'Foundation Works', raisedBy: 'Chidi Okafor', dateRaised: '2026-05-02', priority: 'High', status: 'Monitoring' },
  { id: 'LOG-002', type: 'Issue', title: 'Generator failure', relatedWBS: 'Equipment Installation', raisedBy: 'Zainab Mohammed', dateRaised: '2026-05-08', priority: 'Medium', status: 'Resolved' },
  { id: 'LOG-003', type: 'Change Request', title: 'Additional cable trays', relatedWBS: 'Cable Installation', raisedBy: 'Obinna Nwosu', dateRaised: '2026-05-12', priority: 'Low', status: 'Pending' },
  { id: 'LOG-004', type: 'Risk', title: 'Delayed welding consumables', relatedWBS: 'Pipeline Welding', raisedBy: 'Adaobi Udo', dateRaised: '2026-05-18', priority: 'Medium', status: 'Mitigated' },
  { id: 'LOG-005', type: 'Issue', title: 'Failed weld inspection', relatedWBS: 'QA/QC Inspection', raisedBy: 'Tunde Adebayo', dateRaised: '2026-05-22', priority: 'High', status: 'Open' },
];

export const mockResourceRequests = [
  { id: 'RRQ-001', request: 'Crane CR-05', category: 'Equipment', qty: '1 Unit', requestedBy: 'Chidi Okafor', requestDate: '2026-04-10', status: 'Issued' },
  { id: 'RRQ-002', request: 'Welding Machine WM-08', category: 'Equipment', qty: '2 Units', requestedBy: 'Zainab Mohammed', requestDate: '2026-04-12', status: 'Technical Reviewing' },
  { id: 'RRQ-003', request: 'Safety Helmets', category: 'PPE', qty: '20 Pieces', requestedBy: 'Obinna Nwosu', requestDate: '2026-04-15', status: 'Technical Approved' },
  { id: 'RRQ-004', request: '24-inch Carbon Steel Pipes', category: 'Material', qty: '12 Pieces', requestedBy: 'Adaobi Udo', requestDate: '2026-04-18', status: 'Store Reviewing' },
  { id: 'RRQ-005', request: 'Pressure Testing Kit PT-02', category: 'Material', qty: '1 Unit', requestedBy: 'Tunde Adebayo', requestDate: '2026-04-20', status: 'Store Reviewing' },
  { id: 'RRQ-006', request: 'Earthing Cable Roll', category: 'Material', qty: '5 Rolls', requestedBy: 'Ngozi Eze', requestDate: '2026-04-22', status: 'Returned' },
  { id: 'RRQ-007', request: 'Heavy Transport Tractor', category: 'Vehicle', qty: '1 Unit', requestedBy: 'Femi Balogun', requestDate: '2026-04-25', status: 'Technical Reviewing' },
  { id: 'RRQ-008', request: 'High-Pressure Hose Reel', category: 'Material', qty: '3 Units', requestedBy: 'Yejide Ogunleye', requestDate: '2026-04-28', status: 'Unavailable' },
  { id: 'RRQ-009', request: 'Scaffolding Set', category: 'Equipment', qty: '2 Sets', requestedBy: 'Ifeoma Nnaji', requestDate: '2026-05-01', status: 'Cancelled' },
  { id: 'RRQ-010', request: 'Angle Grinder Set', category: 'Equipment', qty: '4 Units', requestedBy: 'Sola Oladipo', requestDate: '2026-05-03', status: 'Rejected by Technical' },
];

export const mockSiteDiary = [
  { id: 'SD-26-001', date: '2026-05-29', location: 'Chevron Wellhead A', loggedBy: 'Chidi Okafor', summaryOfWork: 'Pipeline welding', workforce: 28, incident: 'Yes', status: 'Submitted' },
  { id: 'SD-26-002', date: '2026-05-30', location: 'Chevron Wellhead A', loggedBy: 'Zainab Mohammed', summaryOfWork: 'Structural installation', workforce: 28, incident: 'No', status: 'Signed Off' },
  { id: 'SD-26-003', date: '2026-05-31', location: 'Pipeline Section B', loggedBy: 'Obinna Nwosu', summaryOfWork: 'Cable trench excavation', workforce: 24, incident: 'Yes', status: 'Signed Off' },
  { id: 'SD-26-004', date: '2026-06-01', location: 'Gas Metering Station', loggedBy: 'Adaobi Udo', summaryOfWork: 'Pressure testing', workforce: 12, incident: 'Yes', status: 'Signed Off' },
  { id: 'SD-26-005', date: '2026-06-02', location: 'Chevron Wellhead A', loggedBy: 'Tunde Adebayo', summaryOfWork: 'Earthing installation', workforce: 28, incident: 'No', status: 'Submitted' },
  { id: 'SD-26-006', date: '2026-06-03', location: 'Pipeline Section B', loggedBy: 'Ngozi Eze', summaryOfWork: 'Pipe alignment', workforce: 24, incident: 'No', status: 'Submitted' },
];

export const mockTimesheets = [
  { empId: 'PGSL-O421', employee: 'Chidi Okafor', role: 'Site Engineer', activity: 'Pipeline Welding', hoursWorked: '9h 20m', overtime: '2h', status: 'Submitted' },
  { empId: 'PGSL-O422', employee: 'Zainab Mohammed', role: 'QA/QC Inspector', activity: 'Pressure Test Inspection', hoursWorked: '8h 37m', overtime: '0h', status: 'Approved' },
  { empId: 'PGSL-O423', employee: 'Obinna Nwosu', role: 'HSE Officer', activity: 'Site Safety Monitoring', hoursWorked: '8h 37m', overtime: '1h', status: 'Approved' },
  { empId: 'PGSL-O424', employee: 'Adaobi Udo', role: 'Mechanical Technician', activity: 'Equipment Installation', hoursWorked: '8h 37m', overtime: '2h', status: 'Approved' },
  { empId: 'PGSL-O425', employee: 'Tunde Adebayo', role: 'Electrician', activity: 'Earthing Installation', hoursWorked: '8h 37m', overtime: '2h', status: 'Submitted' },
  { empId: 'PGSL-O426', employee: 'Ngozi Eze', role: 'Welder', activity: 'Pipe Alignment', hoursWorked: '8h 37m', overtime: '0h', status: 'Submitted' },
  { empId: 'PGSL-O427', employee: 'Femi Balogun', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '0h', status: 'Approved' },
  { empId: 'PGSL-O428', employee: 'Yejide Ogunleye', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '2h', status: 'Approved' },
  { empId: 'PGSL-O429', employee: 'Ifeoma Nnaji', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '0h', status: 'Submitted' },
  { empId: 'PGSL-O430', employee: 'Sola Oladipo', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '0h', status: 'Rejected' },
];

export const mockProjectDocuments = [
  { id: 'ED-001', title: 'Method Statement — Pipe Welding', category: 'Method Statement', preparedBy: 'Chinonso Okafor', clientFacing: 'Yes', version: 'V1.0', lastUpdated: '2026-05-10', status: 'Pending' },
  { id: 'ED-002', title: 'Site Visit Report — Week 29', category: 'Site Visit Report', preparedBy: 'Fatima Ibrahim', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-05-18', status: 'Approved' },
  { id: 'ED-003', title: 'Progress Report — July', category: 'Progress Report', preparedBy: 'Emmanuel Eze', clientFacing: 'Yes', version: 'V2.0', lastUpdated: '2026-06-01', status: 'Approved' },
  { id: 'ED-004', title: 'Structural Drawing — Rev B', category: 'Drawing', preparedBy: 'Zainab Mohammed', clientFacing: 'Yes', version: 'V1.2', lastUpdated: '2026-06-05', status: 'Sent to Client' },
  { id: 'ED-005', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Adeola Olatunji', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-06-08', status: 'Under Review' },
  { id: 'ED-006', title: 'Inspection Checklist — Piping', category: 'Technical Specification', preparedBy: 'Tunde Bakare', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-06-10', status: 'Checked' },
  { id: 'ED-007', title: 'Inspection Checklist — Electrical', category: 'Technical Specification', preparedBy: 'Amaka Ugochukwu', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-06-12', status: 'Pending' },
  { id: 'ED-008', title: 'QA/QC Inspection Report — Rev A', category: 'Technical Specification', preparedBy: 'Damilola Adebayo', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-06-15', status: 'Approved' },
  { id: 'ED-009', title: 'Final Quality Inspection Report', category: 'Technical Specification', preparedBy: 'Chidera Nwosu', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-06-20', status: 'Returned' },
  { id: 'ED-010', title: 'Non-Conformance Report — NCR-04', category: 'Technical Specification', preparedBy: 'Ijeoma Chukwuma', clientFacing: 'No', version: 'V1.0', lastUpdated: '2026-06-22', status: 'Rejected' },
];

export const mockSitePhotos = [
  { id: 1, title: 'Foundation Excavation', caption: 'Excavation completed at Section A before concrete works.', uploadedBy: 'David Vance', date: '2026-05-24' },
  { id: 2, title: 'Pipe Welding in Progress', caption: 'Hot work permit active. Welding at Section B junction.', uploadedBy: 'Chidi Okafor', date: '2026-05-26' },
  { id: 3, title: 'Equipment Delivery', caption: 'Heavy lift crane delivered to staging area.', uploadedBy: 'Femi Balogun', date: '2026-04-28' },
  { id: 4, title: 'Site Safety Briefing', caption: 'Morning toolbox talk conducted before shift commencement.', uploadedBy: 'Jibril Gold', date: '2026-06-03' },
];
