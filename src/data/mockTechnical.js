export const mockProjects = [
  { id: 'PGSL-26-001', name: 'Chevron Wellhead Upgrade', client: 'Chevron Nigeria', manager: 'Chidi Okafor', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'At Risk', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Zainab Mohammed', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'In Progress', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'TotalEnergies Earthing Installation', client: 'TotalEnergies', manager: 'Obinna Nwosu', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'On Hold', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Adaobi Udo', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'Completed', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Tunde Adebayo', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'In Progress', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Ngozi Eze', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'In Progress', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Femi Balogun', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'Completed', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Yejide Ogunleye', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'Completed', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Ifeoma Nnaji', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'Delayed', type: 'Maintenance' },
  { id: 'PGSL-26-001', name: 'NLNG Gas Pipeline Maintenance', client: 'NLNG', manager: 'Sola Oladipo', budget: '₦85M / ₦100M', progress: 82, endDate: '28/05/25', status: 'At Risk', type: 'Maintenance' },
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
  startDate: '14/02/26',
  plannedCompletion: '14/02/27',
  status: 'In Progress',
  budget: 'On Track',
  physicalProgress: 82,
  budgetUtilization: 85,
  openWorkOrders: 14,
  openRisks: 3,
  nextMilestone: '24/06/26',
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
    { name: 'Site Mobilization', date: '03/10/26', progress: 100, status: 'Completed' },
    { name: 'Equipment Delivery', date: '03/10/28', progress: 100, status: 'Completed' },
    { name: 'Mechanical Installation', date: '03/10/26', progress: 50, status: 'In Progress' },
    { name: 'Client Inspection', date: '03/10/26', progress: 0, status: 'Not Started' },
    { name: 'Final Handover', date: '03/10/26', progress: 0, status: 'Not Started' },
  ],
};

export const mockWBSActivities = [
  { wbsCode: '1.0', activity: 'Project Kick-off', phase: 'Planning', assignedTo: 'Chidi Okafor', progress: 100, startDate: '28/05/25', endDate: '28/05/25', status: 'Completed', type: 'parent' },
  { wbsCode: '1.1', activity: 'Site Mobilization', phase: 'Planning', assignedTo: 'Zainab Mohammed', progress: 100, startDate: '28/05/25', endDate: '28/05/25', status: 'Completed', type: 'child' },
  { wbsCode: '2.0', activity: 'Engineering Design', phase: 'Engineering', assignedTo: 'Obinna Nwosu', progress: 100, startDate: '28/05/25', endDate: '28/05/25', status: 'Completed', type: 'parent' },
  { wbsCode: '2.1', activity: 'Structural Design', phase: 'Engineering', assignedTo: 'Adaobi Udo', progress: 100, startDate: '28/05/25', endDate: '28/05/25', status: 'Completed', type: 'child' },
  { wbsCode: '2.1.1', activity: 'Foundation Calculations', phase: 'Engineering', assignedTo: 'Tunde Adebayo', progress: 96, startDate: '28/05/25', endDate: '28/05/25', status: 'In Progress', type: 'grandchild' },
  { wbsCode: '3.0', activity: 'Material Procurement', phase: 'Procurement', assignedTo: 'David Vance', progress: 82, startDate: '28/05/25', endDate: '28/05/25', status: 'In Progress', type: 'parent' },
  { wbsCode: '4.0', activity: 'Mechanical Installation', phase: 'Construction', assignedTo: 'Femi Balogun', progress: 82, startDate: '28/05/25', endDate: '28/05/25', status: 'On Hold', type: 'parent', isMilestone: true },
  { wbsCode: '4.1', activity: 'Electrical Installation', phase: 'Construction', assignedTo: 'Yejide Ogunleye', progress: 24, startDate: '28/05/25', endDate: '28/05/25', status: 'Delayed', type: 'child' },
  { wbsCode: '5.0', activity: 'Client Inspection', phase: 'Commissioning', assignedTo: 'Ifeoma Nnaji', progress: 0, startDate: '28/05/25', endDate: '28/05/25', status: 'Pending', type: 'parent', isCritical: true },
  { wbsCode: '6.0', activity: 'Final Handover', phase: 'Close-out', assignedTo: 'Sola Oladipo', progress: 0, startDate: '28/05/25', endDate: '28/05/25', status: 'Pending', type: 'parent' },
];

export const mockSiteInspections = [
  { id: 'SI-001', date: '28/05/25', keyFinding: 'Access restrictions and damaged pipe supports identified', inspectedBy: 'Chidi Okafor' },
  { id: 'SI-002', date: '28/05/25', keyFinding: 'Pipe support repairs completed; storage area cleared', inspectedBy: 'Zainab Mohammed' },
];

export const mockProjectTasks = [
  { id: 'TSK-001', task: 'Prepare Welding Procedure Specification', assignedTo: 'Chidi Okafor', priority: 'High', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'TSK-002', task: 'Review P&ID drawings for accuracy', assignedTo: 'Zainab Mohammed', priority: 'High', dueDate: '28/05/25', status: 'To Do' },
  { id: 'TSK-003', task: 'Submit HSE audit report', assignedTo: 'Obinna Nwosu', priority: 'Medium', dueDate: '28/05/25', status: 'Done' },
  { id: 'TSK-004', task: 'Coordinate crane lifting schedule', assignedTo: 'Adaobi Udo', priority: 'High', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'TSK-005', task: 'Update material tracking register', assignedTo: 'Tunde Adebayo', priority: 'Low', dueDate: '28/05/25', status: 'Overdue' },
];

export const mockProgressLogs = [
  { id: 'LOG-001', type: 'Risk', title: 'Heavy rainfall forecast', relatedWBS: 'Foundation Works', raisedBy: 'Chidi Okafor', dateRaised: '28/05/25', priority: 'High', status: 'Monitoring' },
  { id: 'REQ-001', type: 'Issue', title: 'Generator failure', relatedWBS: 'Equipment Installation', raisedBy: 'Zainab Mohammed', dateRaised: '28/05/25', priority: 'Medium', status: 'Resolved' },
  { id: 'REQ-001', type: 'Change Request', title: 'Additional cable trays', relatedWBS: 'Cable Installation', raisedBy: 'Obinna Nwosu', dateRaised: '28/05/25', priority: 'Low', status: 'Pending' },
  { id: 'REQ-001', type: 'Risk', title: 'Delayed welding consumables', relatedWBS: 'Pipeline Welding', raisedBy: 'Adaobi Udo', dateRaised: '28/05/25', priority: 'Medium', status: 'Mitigated' },
  { id: 'REQ-001', type: 'Issue', title: 'Failed weld inspection', relatedWBS: 'QA/QC Inspection', raisedBy: 'Tunde Adebayo', dateRaised: '28/05/25', priority: 'High', status: 'Open' },
];

export const mockResourceRequests = [
  { id: 'REQ-001', request: 'Crane CR-05', category: 'Equipment', qty: '1 Unit', requestedBy: 'Chidi Okafor', requestDate: '28/05/25', status: 'Issued' },
  { id: 'REQ-001', request: 'Welding Machine WM-08', category: 'Equipment', qty: '2 Units', requestedBy: 'Zainab Mohammed', requestDate: '28/05/25', status: 'Technical Reviewing' },
  { id: 'REQ-001', request: 'Safety Helmets', category: 'PPE', qty: '20 Pieces', requestedBy: 'Obinna Nwosu', requestDate: '28/05/25', status: 'Technical Approved' },
  { id: 'REQ-001', request: '24-inch Carbon Steel Pipes', category: 'Material', qty: '12 Pieces', requestedBy: 'Adaobi Udo', requestDate: '28/05/25', status: 'Store Reviewing' },
  { id: 'REQ-001', request: 'Pressure Testing Kit PT-02', category: 'Material', qty: '1 Unit', requestedBy: 'Tunde Adebayo', requestDate: '28/05/25', status: 'Store Reviewing' },
  { id: 'REQ-001', request: 'Earthing Cable Roll', category: 'Material', qty: '5 Rolls', requestedBy: 'Ngozi Eze', requestDate: '28/05/25', status: 'Returned' },
  { id: 'REQ-001', request: 'Heavy Transport Tractor', category: 'Vehicle', qty: '5 Rolls', requestedBy: 'Femi Balogun', requestDate: '28/05/25', status: 'Technical Reviewing' },
  { id: 'REQ-001', request: 'Earthing Cable Roll', category: 'Material', qty: '5 Rolls', requestedBy: 'Yejide Ogunleye', requestDate: '28/05/25', status: 'Unavailable' },
  { id: 'REQ-001', request: 'Earthing Cable Roll', category: 'Material', qty: '5 Rolls', requestedBy: 'Ifeoma Nnaji', requestDate: '28/05/25', status: 'Cancelled' },
  { id: 'REQ-001', request: 'Earthing Cable Roll', category: 'Material', qty: '5 Rolls', requestedBy: 'Sola Oladipo', requestDate: '28/05/25', status: 'Rejected by Technical' },
];

export const mockSiteDiary = [
  { id: 'SD-26-001', date: '29/05/25', location: 'Chevron Wellhead A', loggedBy: 'Chidi Okafor', summaryOfWork: 'Pipeline welding', workforce: 28, incident: 'Yes', status: 'Submitted' },
  { id: 'SD-26-001', date: '30/05/25', location: 'Chevron Wellhead A', loggedBy: 'Zainab Mohammed', summaryOfWork: 'Structural installation', workforce: 28, incident: 'No', status: 'Signed Off' },
  { id: 'SD-26-001', date: '31/05/25', location: 'Pipeline Section B', loggedBy: 'Obinna Nwosu', summaryOfWork: 'Cable trench excavation', workforce: 24, incident: 'Yes', status: 'Signed Off' },
  { id: 'SD-26-001', date: '01/06/25', location: 'Gas Metering Station', loggedBy: 'Adaobi Udo', summaryOfWork: 'Pressure testing', workforce: 12, incident: 'Yes', status: 'Signed Off' },
  { id: 'SD-26-001', date: '02/06/25', location: 'Chevron Wellhead A', loggedBy: 'Tunde Adebayo', summaryOfWork: 'Earthing installation', workforce: 28, incident: 'No', status: 'Submitted' },
  { id: 'SD-26-001', date: '03/06/25', location: 'Pipeline Section B', loggedBy: 'Ngozi Eze', summaryOfWork: 'Pipe alignment', workforce: 24, incident: 'No', status: 'Submitted' },
];

export const mockTimesheets = [
  { empId: 'PGSL-O421', employee: 'Chidi Okafor', role: 'Site Engineer', activity: 'Pipeline Welding', hoursWorked: '9h 20m', overtime: '2h', status: 'Submitted' },
  { empId: 'PGSL-O421', employee: 'Zainab Mohammed', role: 'QA/QC Inspector', activity: 'Pressure Test Inspection', hoursWorked: '8h 37m', overtime: '0h', status: 'Approved' },
  { empId: 'PGSL-O421', employee: 'Obinna Nwosu', role: 'HSE Officer', activity: 'Site Safety Monitoring', hoursWorked: '8h 37m', overtime: '1h', status: 'Approved' },
  { empId: 'PGSL-O421', employee: 'Adaobi Udo', role: 'Mechanical Technician', activity: 'Equipment Installation', hoursWorked: '8h 37m', overtime: '2h', status: 'Approved' },
  { empId: 'PGSL-O421', employee: 'Tunde Adebayo', role: 'Electrician', activity: 'Earthing Installation', hoursWorked: '8h 37m', overtime: '2h', status: 'Submitted' },
  { empId: 'PGSL-O421', employee: 'Ngozi Eze', role: 'Welder', activity: 'Pipe alignment', hoursWorked: '8h 37m', overtime: '0h', status: 'Submitted' },
  { empId: 'PGSL-O421', employee: 'Femi Balogun', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '0h', status: 'Approved' },
  { empId: 'PGSL-O421', employee: 'Yejide Ogunleye', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '2h', status: 'Approved' },
  { empId: 'PGSL-O421', employee: 'Ifeoma Nnaji', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '0h', status: 'Submitted' },
  { empId: 'PGSL-O421', employee: 'Sola Oladipo', role: 'Store Officer', activity: 'Material Issue & Verification', hoursWorked: '8h 37m', overtime: '0h', status: 'Rejected' },
];

export const mockProjectDocuments = [
  { id: 'ED-001', title: 'Method Statement — Pipe Welding', category: 'Method Statement', preparedBy: 'Chinonso Okafor', clientFacing: 'Yes', version: 'V1.0', lastUpdated: '28/05/25', status: 'Pending' },
  { id: 'ED-001', title: 'Site Visit Report — Week 29', category: 'Site Visit Report', preparedBy: 'Fatima Ibrahim', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Approved' },
  { id: 'ED-001', title: 'Progress Report — July', category: 'Progress Report', preparedBy: 'Emmanuel Eze', clientFacing: 'Yes', version: 'V1.0', lastUpdated: '28/05/25', status: 'Approved' },
  { id: 'ED-001', title: 'Structural Drawing — Rev B', category: 'Drawing', preparedBy: 'Zainab Mohammed', clientFacing: 'Yes', version: 'V1.0', lastUpdated: '28/05/25', status: 'Sent to Client' },
  { id: 'ED-001', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Adeola Olatunji', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Under Review' },
  { id: 'ED-001', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Tunde Bakare', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Checked' },
  { id: 'ED-001', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Amaka Ugochukwu', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Pending' },
  { id: 'ED-001', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Damilola Adebayo', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Approved' },
  { id: 'ED-001', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Chidera Nwosu', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Returned' },
  { id: 'ED-001', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Ijeoma Chukwuma', clientFacing: 'No', version: 'V1.0', lastUpdated: '28/05/25', status: 'Rejected' },
];

export const mockSitePhotos = [
  { id: 1, title: 'Foundation Excavation', caption: 'Excavation completed at Section A before concrete works.', uploadedBy: 'David Vance', date: '24/05/26' },
  { id: 2, title: 'Foundation Excavation', caption: 'Excavation completed at Section A before concrete works.', uploadedBy: 'David Vance', date: '24/05/26' },
  { id: 3, title: 'Foundation Excavation', caption: 'Excavation completed at Section A before concrete works.', uploadedBy: 'David Vance', date: '24/05/26' },
  { id: 4, title: 'Foundation Excavation', caption: 'Excavation completed at Section A before concrete works.', uploadedBy: 'David Vance', date: '24/05/26' },
];
