// ─── Mock Data: Administration Module ────────────────────────────────────────

// ── General Admin ────────────────────────────────────────────────────────────
export const mockNotices = [
  { id: 'NOT-001', title: 'Office Closure – Public Holiday', category: 'General', issuedBy: 'Admin Office', date: '2026-09-25', priority: 'High', status: 'Active' },
  { id: 'NOT-002', title: 'Updated Dress Code Policy', category: 'Policy', issuedBy: 'HR Department', date: '2026-09-18', priority: 'Medium', status: 'Active' },
  { id: 'NOT-003', title: 'Fire Drill – Block A', category: 'Safety', issuedBy: 'HSE Unit', date: '2026-09-10', priority: 'High', status: 'Archived' },
  { id: 'NOT-004', title: 'Canteen Menu Update', category: 'Facilities', issuedBy: 'Admin Office', date: '2026-08-30', priority: 'Low', status: 'Active' },
  { id: 'NOT-005', title: 'New Visitor Registration System', category: 'Policy', issuedBy: 'Admin Office', date: '2026-08-15', priority: 'Medium', status: 'Active' },
  { id: 'NOT-006', title: 'Staff ID Renewal Notice', category: 'General', issuedBy: 'HR Department', date: '2026-07-20', priority: 'Medium', status: 'Archived' },
];

export const mockCorrespondence = [
  { id: 'COR-001', subject: 'Q3 Operational Review – DPR Request', from: 'Department of Petroleum Resources', to: 'Management', date: '2026-09-28', type: 'Incoming', status: 'Pending' },
  { id: 'COR-002', subject: 'Response to Site Inspection Report', from: 'PGSL Admin', to: 'Total Energies', date: '2026-09-22', type: 'Outgoing', status: 'Sent' },
  { id: 'COR-003', subject: 'Contract Amendment – Project Echo', from: 'Chevron Nigeria Ltd', to: 'Business Development', date: '2026-09-14', type: 'Incoming', status: 'Reviewed' },
  { id: 'COR-004', subject: 'Staff Welfare Fund Contribution', from: 'PGSL Finance', to: 'Staff Association', date: '2026-09-08', type: 'Outgoing', status: 'Sent' },
  { id: 'COR-005', subject: 'Annual General Meeting – Agenda', from: 'Management', to: 'All Departments', date: '2026-08-29', type: 'Internal', status: 'Distributed' },
  { id: 'COR-006', subject: 'NIS Certificate Renewal', from: 'Nigerian Insurance Agency', to: 'Admin Office', date: '2026-08-19', type: 'Incoming', status: 'Pending' },
];

export const mockMeetings = [
  { id: 'MTG-001', title: 'Board Strategy Meeting', organizer: 'CEO Office', date: '2026-10-10', time: '10:00 AM', venue: 'Board Room A', attendees: 12, status: 'Scheduled' },
  { id: 'MTG-002', title: 'Q3 Departmental Review', organizer: 'Helen Okoye', date: '2026-10-07', time: '09:00 AM', venue: 'Conference Hall B', attendees: 25, status: 'Scheduled' },
  { id: 'MTG-003', title: 'HSE Monthly Stand-down', organizer: 'HSE Manager', date: '2026-09-29', time: '08:00 AM', venue: 'Training Room 1', attendees: 40, status: 'Completed' },
  { id: 'MTG-004', title: 'Technical Projects Update', organizer: 'Chief Engineer', date: '2026-09-15', time: '02:00 PM', venue: 'Ops Room', attendees: 8, status: 'Completed' },
  { id: 'MTG-005', title: 'Client Engagement – ExxonMobil', organizer: 'BD Manager', date: '2026-10-15', time: '11:00 AM', venue: 'Executive Lounge', attendees: 6, status: 'Scheduled' },
];

// ── Facilities & Assets ───────────────────────────────────────────────────────
export const mockAssets = [
  { id: 'AST-001', name: 'Dell OptiPlex 7090 Desktop', category: 'IT Equipment', location: 'Admin Block – Office 12', assignedTo: 'Helen Okoye', purchaseDate: '2024-01-15', condition: 'Good', status: 'In Use' },
  { id: 'AST-002', name: 'HP LaserJet Pro M404', category: 'IT Equipment', location: 'Finance Office', assignedTo: 'Finance Dept', purchaseDate: '2023-07-20', condition: 'Good', status: 'In Use' },
  { id: 'AST-003', name: 'Office Generator – 500KVA', category: 'Electrical', location: 'Generator House', assignedTo: 'Facilities Team', purchaseDate: '2022-03-05', condition: 'Fair', status: 'In Use' },
  { id: 'AST-004', name: 'Conference Table Set (12-seater)', category: 'Furniture', location: 'Board Room A', assignedTo: 'Board Room', purchaseDate: '2021-11-10', condition: 'Good', status: 'In Use' },
  { id: 'AST-005', name: 'Samsung 85" Smart Board', category: 'AV Equipment', location: 'Training Room 1', assignedTo: 'HR Dept', purchaseDate: '2024-06-01', condition: 'Excellent', status: 'In Use' },
  { id: 'AST-006', name: 'Air Conditioning Unit – Daikin 3HP', category: 'HVAC', location: 'Executive Suite', assignedTo: 'Admin', purchaseDate: '2023-02-14', condition: 'Good', status: 'In Use' },
  { id: 'AST-007', name: 'Fire Extinguisher – CO2 9KG', category: 'Safety Equipment', location: 'Server Room', assignedTo: 'HSE', purchaseDate: '2025-01-08', condition: 'Excellent', status: 'In Use' },
  { id: 'AST-008', name: 'Lenovo ThinkPad E15', category: 'IT Equipment', location: 'IT Storage', assignedTo: 'Unassigned', purchaseDate: '2024-09-12', condition: 'Good', status: 'Available' },
  { id: 'AST-009', name: 'Water Dispenser – Midea 20L', category: 'Appliances', location: 'Canteen', assignedTo: 'Admin', purchaseDate: '2023-08-30', condition: 'Fair', status: 'Under Maintenance' },
  { id: 'AST-010', name: 'CCTV DVR System – 16CH', category: 'Security', location: 'Security Post', assignedTo: 'Security Team', purchaseDate: '2022-12-01', condition: 'Good', status: 'In Use' },
  { id: 'AST-011', name: 'Projector – Epson EB-X51', category: 'AV Equipment', location: 'Conference Hall B', assignedTo: 'Admin', purchaseDate: '2023-05-22', condition: 'Fair', status: 'Under Maintenance' },
  { id: 'AST-012', name: 'Server Rack – Dell PowerEdge R740', category: 'IT Equipment', location: 'Server Room', assignedTo: 'IT Dept', purchaseDate: '2021-09-18', condition: 'Good', status: 'In Use' },
];

export const mockFacilities = [
  { id: 'FAC-001', name: 'Admin Block – Ground Floor', type: 'Office Space', capacity: 45, manager: 'Admin Office', lastInspection: '2026-09-01', nextInspection: '2026-12-01', status: 'Operational' },
  { id: 'FAC-002', name: 'Board Room A', type: 'Conference Room', capacity: 12, manager: 'Admin Office', lastInspection: '2026-08-15', nextInspection: '2026-11-15', status: 'Operational' },
  { id: 'FAC-003', name: 'Training Room 1', type: 'Training Facility', capacity: 40, manager: 'HR Dept', lastInspection: '2026-07-20', nextInspection: '2026-10-20', status: 'Operational' },
  { id: 'FAC-004', name: 'Generator House', type: 'Utility', capacity: null, manager: 'Facilities Team', lastInspection: '2026-09-10', nextInspection: '2026-10-10', status: 'Under Maintenance' },
  { id: 'FAC-005', name: 'Staff Canteen', type: 'Welfare Facility', capacity: 80, manager: 'Admin Office', lastInspection: '2026-08-05', nextInspection: '2026-11-05', status: 'Operational' },
  { id: 'FAC-006', name: 'Car Park – Zone A', type: 'Parking', capacity: 60, manager: 'Security', lastInspection: '2026-06-30', nextInspection: '2026-12-30', status: 'Operational' },
];

// ── Company Fleet ─────────────────────────────────────────────────────────────
export const mockFleet = [
  { id: 'FLT-001', plateNo: 'ABJ-001-GH', make: 'Toyota', model: 'Land Cruiser V8', year: 2022, type: 'SUV', assignedTo: 'Executive', driver: 'Musa Aliyu', lastService: '2026-08-01', nextService: '2026-11-01', status: 'Available', mileage: '48,200 km', insExpiry: '2027-01-15' },
  { id: 'FLT-002', plateNo: 'ABJ-002-GH', make: 'Toyota', model: 'Hiace Bus', year: 2021, type: 'Bus', assignedTo: 'Staff Shuttle', driver: 'Emeka Nwosu', lastService: '2026-07-15', nextService: '2026-10-15', status: 'In Use', mileage: '102,450 km', insExpiry: '2026-12-31' },
  { id: 'FLT-003', plateNo: 'ABJ-003-GH', make: 'Ford', model: 'Ranger Pickup', year: 2023, type: 'Pickup', assignedTo: 'Logistics', driver: 'Ibrahim Suleiman', lastService: '2026-09-01', nextService: '2026-12-01', status: 'In Use', mileage: '29,600 km', insExpiry: '2027-03-20' },
  { id: 'FLT-004', plateNo: 'ABJ-004-GH', make: 'Toyota', model: 'Corolla Sedan', year: 2020, type: 'Sedan', assignedTo: 'Admin Pool', driver: 'Unassigned', lastService: '2026-06-10', nextService: '2026-09-10', status: 'Under Maintenance', mileage: '76,300 km', insExpiry: '2026-11-05' },
  { id: 'FLT-005', plateNo: 'ABJ-005-GH', make: 'Mitsubishi', model: 'Pajero Sport', year: 2022, type: 'SUV', assignedTo: 'Technical', driver: 'Chukwuemeka Eze', lastService: '2026-09-18', nextService: '2026-12-18', status: 'In Use', mileage: '41,800 km', insExpiry: '2027-02-10' },
  { id: 'FLT-006', plateNo: 'ABJ-006-GH', make: 'Isuzu', model: 'NPR Truck', year: 2019, type: 'Truck', assignedTo: 'Site Operations', driver: 'Abubakar Garba', lastService: '2026-05-20', nextService: '2026-08-20', status: 'Overdue Service', mileage: '189,000 km', insExpiry: '2026-10-30' },
  { id: 'FLT-007', plateNo: 'ABJ-007-GH', make: 'Toyota', model: 'Fortuner', year: 2024, type: 'SUV', assignedTo: 'BD Manager', driver: 'Taiwo Adewale', lastService: '2026-09-25', nextService: '2026-12-25', status: 'Available', mileage: '12,100 km', insExpiry: '2027-06-30' },
  { id: 'FLT-008', plateNo: 'ABJ-008-GH', make: 'Toyota', model: 'Hiace Bus', year: 2020, type: 'Bus', assignedTo: 'Site Shuttle', driver: 'Nuhu Danjuma', lastService: '2026-08-28', nextService: '2026-11-28', status: 'In Use', mileage: '134,700 km', insExpiry: '2026-12-15' },
];

export const mockMaintenanceLog = [
  { id: 'MNT-001', vehicle: 'ABJ-004-GH', type: 'Engine Overhaul', date: '2026-09-15', cost: '₦450,000', mechanic: 'AutoFix Garage', status: 'In Progress' },
  { id: 'MNT-002', vehicle: 'ABJ-006-GH', type: 'Scheduled Service', date: '2026-08-20', cost: '₦85,000', mechanic: 'Toyota Nigeria Ltd', status: 'Overdue' },
  { id: 'MNT-003', vehicle: 'ABJ-001-GH', type: 'Oil Change + Filters', date: '2026-08-01', cost: '₦32,000', mechanic: 'Quick Lube Center', status: 'Completed' },
  { id: 'MNT-004', vehicle: 'ABJ-003-GH', type: 'Tyre Replacement (4)', date: '2026-09-01', cost: '₦120,000', mechanic: 'Michelin Tyres NG', status: 'Completed' },
  { id: 'MNT-005', vehicle: 'ABJ-002-GH', type: 'Brake Pad + Rotors', date: '2026-07-15', cost: '₦68,000', mechanic: 'Fleet Tech Services', status: 'Completed' },
];

// ── Visitor Logs ──────────────────────────────────────────────────────────────
export const mockVisitors = [
  { id: 'VIS-001', name: 'Adewale Ogunleye', company: 'ExxonMobil Nigeria', purpose: 'Contract Discussion', host: 'BD Manager', hostDept: 'Business Development', checkIn: '08:45 AM', checkOut: '10:30 AM', date: '2026-10-05', badge: 'VB-0451', status: 'Checked Out' },
  { id: 'VIS-002', name: 'Chidinma Nwofor', company: 'DPR – Lagos Office', purpose: 'Regulatory Inspection', host: 'Compliance Officer', hostDept: 'Quality System', checkIn: '10:15 AM', checkOut: null, date: '2026-10-05', badge: 'VB-0452', status: 'On Premises' },
  { id: 'VIS-003', name: 'Samuel Adeyemi', company: 'AutoFix Garage', purpose: 'Vehicle Maintenance', host: 'Fleet Coordinator', hostDept: 'Administration', checkIn: '11:00 AM', checkOut: null, date: '2026-10-05', badge: 'VB-0453', status: 'On Premises' },
  { id: 'VIS-004', name: 'Ngozi Eze', company: 'Total Energies', purpose: 'Project Briefing', host: 'Chief Engineer', hostDept: 'Technical', checkIn: '09:00 AM', checkOut: '12:45 PM', date: '2026-10-04', badge: 'VB-0449', status: 'Checked Out' },
  { id: 'VIS-005', name: 'Bayo Adeleke', company: 'Oracle Nigeria Ltd', purpose: 'ERP System Demo', host: 'IT Manager', hostDept: 'Administration', checkIn: '02:00 PM', checkOut: '04:30 PM', date: '2026-10-04', badge: 'VB-0450', status: 'Checked Out' },
  { id: 'VIS-006', name: 'Fatima Al-Hassan', company: 'Shell Nigeria', purpose: 'HSE Audit Support', host: 'HSE Manager', hostDept: 'HSE', checkIn: '08:00 AM', checkOut: '05:00 PM', date: '2026-10-03', badge: 'VB-0447', status: 'Checked Out' },
  { id: 'VIS-007', name: 'Kenneth Obi', company: 'NUPRC', purpose: 'Compliance Review', host: 'CEO', hostDept: 'Management', checkIn: '09:30 AM', checkOut: '01:00 PM', date: '2026-10-03', badge: 'VB-0448', status: 'Checked Out' },
  { id: 'VIS-008', name: 'Hauwa Yusuf', company: 'Dangote Industries', purpose: 'Supply Chain Meeting', host: 'Procurement Manager', hostDept: 'Procurement', checkIn: '10:00 AM', checkOut: null, date: '2026-10-05', badge: 'VB-0454', status: 'Expected' },
  { id: 'VIS-009', name: 'Emeka Okafor', company: 'NAOC Nigeria', purpose: 'Technical Assessment', host: 'Project Manager', hostDept: 'Technical', checkIn: '01:00 PM', checkOut: null, date: '2026-10-05', badge: 'VB-0455', status: 'Expected' },
  { id: 'VIS-010', name: 'Yetunde Lawson', company: 'Access Bank Plc', purpose: 'Credit Facility Discussion', host: 'CFO', hostDept: 'Finance', checkIn: '03:00 PM', checkOut: '04:15 PM', date: '2026-10-02', badge: 'VB-0446', status: 'Checked Out' },
];
