export const mockOffshoreTravel = [
  { sn: 1, employee: 'Emeka Obi', department: 'Technical', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Valid' },
  { sn: 2, employee: 'Zainab Mohammed', department: 'Technical', documentType: 'Offshore Safety Permit', issuingBody: 'NUPRC', issueDate: '28/05/25', expiry: '28/05/25', status: 'Expiring Soon' },
  { sn: 3, employee: 'Adaobi Nwankwo', department: 'HSE', documentType: 'Offshore Safety Training Certificate', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Valid' },
  { sn: 4, employee: 'Tunde Ogunleye', department: 'Technical', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Expiring Soon' },
  { sn: 5, employee: 'Ifeoma Eze', department: 'Technical', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Valid' },
  { sn: 6, employee: 'Chidera Okafor', department: 'HSE', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Valid' },
  { sn: 7, employee: 'Seyi Adebayo', department: 'Technical', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Pending Verification' },
  { sn: 8, employee: 'Kemi Afolabi', department: 'HSE', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Valid' },
  { sn: 9, employee: 'Uchechukwu Nwachukwu', department: 'HSE', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Expired' },
  { sn: 10, employee: 'Oluwatobi Bakare', department: 'HSE', documentType: 'BOSIET', issuingBody: 'OPITO', issueDate: '28/05/25', expiry: '28/05/25', status: 'Expiring Soon' },
];

export const mockEmergencyPlans = [
  { id: 'ERP-001', planName: 'Fire Emergency Response Plan', location: 'All Sites', reviewDue: '28/05/25', version: 'v4', owner: 'Aisha Bello', status: 'Active' },
  { id: 'ERP-002', planName: 'Oil Spill Contingency Plan', location: 'Port Harcourt Site', reviewDue: '28/05/25', version: 'v5', owner: 'Chinedu Okafor', status: 'Under Review' },
  { id: 'ERP-003', planName: 'Medevac Plan', location: 'Lagos Head Office', reviewDue: '28/05/25', version: 'v6', owner: 'Fatima Abubakar', status: 'Active' },
  { id: 'ERP-004', planName: 'H2S Emergency Response Plan', location: 'All Sites', reviewDue: '28/05/25', version: 'v7', owner: 'Tunde Adesola', status: 'Active' },
  { id: 'ERP-005', planName: 'Oil Spill Contingency Plan', location: 'Warri Yard', reviewDue: '28/05/25', version: 'v8', owner: 'Zainab Mohammed', status: 'Active' },
  { id: 'ERP-006', planName: 'Oil Spill Contingency Plan', location: 'Port Harcourt Site', reviewDue: '28/05/25', version: 'v9', owner: 'Emeka Nwosu', status: 'Active' },
  { id: 'ERP-007', planName: 'Oil Spill Contingency Plan', location: 'Port Harcourt Site', reviewDue: '28/05/25', version: 'v10', owner: 'Olamide Ajayi', status: 'Active' },
  { id: 'ERP-008', planName: 'Oil Spill Contingency Plan', location: 'Port Harcourt Site', reviewDue: '28/05/25', version: 'v11', owner: 'Ngozi Uche', status: 'Under Review' },
  { id: 'ERP-009', planName: 'Oil Spill Contingency Plan', location: 'Port Harcourt Site', reviewDue: '28/05/25', version: 'v12', owner: 'Ifeanyi Eze', status: 'Active' },
  { id: 'ERP-010', planName: 'Oil Spill Contingency Plan', location: 'Port Harcourt Site', reviewDue: '28/05/25', version: 'v13', owner: 'Yemi Ogunleye', status: 'Archived' },
];

export const mockHSETasks = [
  { id: 'HSE-TSK-001', task: 'Update Emergency Response Plan', assignedTo: 'Chijioke Okafor', priority: 'High', dueDate: '28/05/25', status: 'To Do' },
  { id: 'HSE-TSK-002', task: 'Verify Emergency Contact Details', assignedTo: 'Aisha Bello', priority: 'Medium', dueDate: '28/05/25', status: 'To Do' },
  { id: 'HSE-TSK-003', task: 'Review Site Emergency Procedures', assignedTo: 'Tunde Afolabi', priority: 'Medium', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'HSE-TSK-004', task: 'Update Emergency Contact List', assignedTo: 'Adaeze Eze', priority: 'High', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'HSE-TSK-005', task: 'Review Emergency Response Plan', assignedTo: 'Emeka Nwachukwu', priority: 'Low', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'HSE-TSK-006', task: 'Review HSE Policy Document', assignedTo: 'Zainab Ibrahim', priority: 'Hot', dueDate: '28/05/25', status: 'Done' },
  { id: 'HSE-TSK-007', task: 'Review Emergency Response Plan', assignedTo: 'Khalid Bello', priority: 'High', dueDate: '28/05/25', status: 'Done' },
  { id: 'HSE-TSK-008', task: 'Review Emergency Response Plan', assignedTo: 'Chinonso Uche', priority: 'Low', dueDate: '28/05/25', status: 'Done' },
  { id: 'HSE-TSK-009', task: 'Review Emergency Response Plan', assignedTo: 'Fatima Yusuf', priority: 'High', dueDate: '28/05/25', status: 'Overdue' },
  { id: 'HSE-TSK-010', task: 'Review Emergency Response Plan', assignedTo: 'Olumide Ogunleye', priority: 'Medium', dueDate: '28/05/25', status: 'Overdue' },
];

export const mockHSEDocuments = [
  { sn: 1, title: 'Permit to Work Procedure', uploadedBy: 'Chinonso Okafor', uploadDate: '28/05/25' },
  { sn: 2, title: 'Hot Work Procedure', uploadedBy: 'Fatima Ibrahim', uploadDate: '28/05/25' },
  { sn: 3, title: 'Working at Height Procedure', uploadedBy: 'Emmanuel Eze', uploadDate: '28/05/25' },
  { sn: 4, title: 'Confined Space Entry Procedure', uploadedBy: 'Zainab Mohammed', uploadDate: '28/05/25' },
  { sn: 5, title: 'Waste Management Procedure', uploadedBy: 'Adeola Olatunji', uploadDate: '28/05/25' },
  { sn: 6, title: 'Confined Space Entry Procedure', uploadedBy: 'Tunde Bakare', uploadDate: '28/05/25' },
  { sn: 7, title: 'Confined Space Entry Procedure', uploadedBy: 'Amaka Ugochukwu', uploadDate: '28/05/25' },
  { sn: 8, title: 'Confined Space Entry Procedure', uploadedBy: 'Damilola Adebayo', uploadDate: '28/05/25' },
  { sn: 9, title: 'Confined Space Entry Procedure', uploadedBy: 'Chidera Nwosu', uploadDate: '28/05/25' },
  { sn: 10, title: 'Fall Protection Procedure', uploadedBy: 'Ijeoma Chukwuma', uploadDate: '28/05/25' },
];
