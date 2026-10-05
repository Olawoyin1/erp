// ─── Mock Data: Business Development Module ───────────────────────────────────

// ── Client Pipeline ───────────────────────────────────────────────────────────
export const PIPELINE_STAGES = ['Prospect', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export const mockPipeline = [
  { id: 'OPP-001', title: 'Subsea Pipeline Inspection – Block OML 58', client: 'Total Energies', value: 185000000, stage: 'Negotiation', owner: 'Chidi Okonkwo', probability: 75, dueDate: '2026-11-30', sector: 'Oil & Gas', lastActivity: '2026-09-28' },
  { id: 'OPP-002', title: 'FPSO Maintenance Contract – Q4 2026', client: 'Shell Nigeria', value: 320000000, stage: 'Proposal Sent', owner: 'Amaka Eze', probability: 55, dueDate: '2026-10-20', sector: 'Oil & Gas', lastActivity: '2026-09-22' },
  { id: 'OPP-003', title: 'Mechanical Engineering Services – Bonny Terminal', client: 'NAOC Nigeria', value: 95000000, stage: 'Won', owner: 'Emeka Obi', probability: 100, dueDate: '2026-10-01', sector: 'Oil & Gas', lastActivity: '2026-10-01' },
  { id: 'OPP-004', title: 'HSE Consulting – Offshore Platform Alpha', client: 'Chevron Nigeria', value: 42000000, stage: 'Qualified', owner: 'Chidi Okonkwo', probability: 40, dueDate: '2026-12-15', sector: 'Oil & Gas', lastActivity: '2026-09-15' },
  { id: 'OPP-005', title: 'Civil Works – Port Harcourt Refinery Upgrade', client: 'NNPCL', value: 510000000, stage: 'Prospect', owner: 'Bayo Adeleke', probability: 20, dueDate: '2027-01-31', sector: 'Oil & Gas', lastActivity: '2026-09-05' },
  { id: 'OPP-006', title: 'Instrumentation & Control – Train 4', client: 'ExxonMobil Nigeria', value: 228000000, stage: 'Negotiation', owner: 'Amaka Eze', probability: 80, dueDate: '2026-10-31', sector: 'Oil & Gas', lastActivity: '2026-09-30' },
  { id: 'OPP-007', title: 'Tank Farm Inspection & Integrity Assessment', client: 'Dangote Petrochemical', value: 68000000, stage: 'Proposal Sent', owner: 'Emeka Obi', probability: 50, dueDate: '2026-11-10', sector: 'Petrochemical', lastActivity: '2026-09-18' },
  { id: 'OPP-008', title: 'Electrical Systems Audit – Warri Complex', client: 'Agip Energy Nigeria', value: 35000000, stage: 'Qualified', owner: 'Bayo Adeleke', probability: 45, dueDate: '2026-12-01', sector: 'Oil & Gas', lastActivity: '2026-09-10' },
  { id: 'OPP-009', title: 'Project Management Support – Gas Compression', client: 'Seplat Energy', value: 145000000, stage: 'Won', owner: 'Chidi Okonkwo', probability: 100, dueDate: '2026-09-15', sector: 'Oil & Gas', lastActivity: '2026-09-15' },
  { id: 'OPP-010', title: 'Pipeline Integrity Management – Delta North', client: 'Heritage Energy', value: 78000000, stage: 'Lost', owner: 'Amaka Eze', probability: 0, dueDate: '2026-09-01', sector: 'Oil & Gas', lastActivity: '2026-09-01' },
  { id: 'OPP-011', title: 'Structural Engineering – Jetty Extension', client: 'Notore Chemical Industries', value: 120000000, stage: 'Prospect', owner: 'Emeka Obi', probability: 15, dueDate: '2027-02-28', sector: 'Chemical', lastActivity: '2026-08-20' },
  { id: 'OPP-012', title: 'Vendor Pre-qualification Support', client: 'TotalEnergies EP Nigeria', value: 22000000, stage: 'Proposal Sent', owner: 'Bayo Adeleke', probability: 60, dueDate: '2026-10-25', sector: 'Oil & Gas', lastActivity: '2026-09-25' },
];

// ── RFQs & Tenders ────────────────────────────────────────────────────────────
export const mockTenders = [
  { id: 'TND-001', ref: 'TEN/TOT/2026/047', title: 'Supply of Subsea Equipment & Installation Services', client: 'Total Energies', issuedDate: '2026-09-01', deadline: '2026-10-15', submittedDate: '2026-10-10', estimatedValue: 280000000, category: 'Engineering', status: 'Submitted', owner: 'Chidi Okonkwo' },
  { id: 'TND-002', ref: 'SHE/ENG/2026/112', title: 'FPSO Topside Maintenance – Annual Framework', client: 'Shell Nigeria', issuedDate: '2026-08-20', deadline: '2026-10-05', submittedDate: null, estimatedValue: 420000000, category: 'Maintenance', status: 'Missed', owner: 'Amaka Eze' },
  { id: 'TND-003', ref: 'CVX/HSE/2026/031', title: 'Safety Management System Implementation', client: 'Chevron Nigeria', issuedDate: '2026-09-10', deadline: '2026-10-30', submittedDate: null, estimatedValue: 55000000, category: 'HSE', status: 'In Progress', owner: 'Emeka Obi' },
  { id: 'TND-004', ref: 'EXX/CI/2026/005', title: 'Civil & Infrastructure Works – Eket Terminal', client: 'ExxonMobil Nigeria', issuedDate: '2026-07-15', deadline: '2026-09-01', submittedDate: '2026-08-28', estimatedValue: 175000000, category: 'Civil', status: 'Awarded', owner: 'Chidi Okonkwo' },
  { id: 'TND-005', ref: 'NNP/ME/2026/088', title: 'Mechanical Engineering – PHC Refinery Upgrade', client: 'NNPCL', issuedDate: '2026-09-20', deadline: '2026-11-20', submittedDate: null, estimatedValue: 610000000, category: 'Engineering', status: 'Received', owner: 'Bayo Adeleke' },
  { id: 'TND-006', ref: 'NAO/IT/2026/019', title: 'Instrumentation & Calibration Services', client: 'NAOC Nigeria', issuedDate: '2026-08-01', deadline: '2026-09-15', submittedDate: '2026-09-12', estimatedValue: 38000000, category: 'Instrumentation', status: 'Lost', owner: 'Amaka Eze' },
  { id: 'TND-007', ref: 'SEP/PM/2026/022', title: 'Project Management Services – Gas Plant Expansion', client: 'Seplat Energy', issuedDate: '2026-09-25', deadline: '2026-11-10', submittedDate: null, estimatedValue: 95000000, category: 'Project Management', status: 'In Progress', owner: 'Chidi Okonkwo' },
  { id: 'TND-008', ref: 'DPE/ST/2026/061', title: 'Storage Tank Inspection & Repair', client: 'Dangote Petrochemical', issuedDate: '2026-10-01', deadline: '2026-11-05', submittedDate: null, estimatedValue: 62000000, category: 'Inspection', status: 'Received', owner: 'Emeka Obi' },
];

// ── Proposals ─────────────────────────────────────────────────────────────────
export const mockProposals = [
  { id: 'PRP-001', title: 'Subsea Pipeline Inspection – Block OML 58', client: 'Total Energies', ref: 'TEN/TOT/2026/047', preparedBy: 'Chidi Okonkwo', sentDate: '2026-10-10', value: 185000000, validity: '2026-12-10', version: 'v2.1', status: 'Under Review' },
  { id: 'PRP-002', title: 'Safety Management System Implementation', client: 'Chevron Nigeria', ref: 'CVX/HSE/2026/031', preparedBy: 'Emeka Obi', sentDate: null, value: 55000000, validity: null, version: 'v1.0', status: 'Draft' },
  { id: 'PRP-003', title: 'Civil & Infrastructure Works – Eket Terminal', client: 'ExxonMobil Nigeria', ref: 'EXX/CI/2026/005', preparedBy: 'Chidi Okonkwo', sentDate: '2026-08-28', value: 175000000, validity: '2026-10-28', version: 'v3.0', status: 'Won' },
  { id: 'PRP-004', title: 'Mechanical Engineering – PHC Refinery Upgrade', client: 'NNPCL', ref: 'NNP/ME/2026/088', preparedBy: 'Bayo Adeleke', sentDate: null, value: 510000000, validity: null, version: 'v1.0', status: 'Draft' },
  { id: 'PRP-005', title: 'Instrumentation & Calibration Services', client: 'NAOC Nigeria', ref: 'NAO/IT/2026/019', preparedBy: 'Amaka Eze', sentDate: '2026-09-12', value: 38000000, validity: '2026-11-12', version: 'v2.0', status: 'Lost' },
  { id: 'PRP-006', title: 'FPSO Maintenance Contract – Q4 2026', client: 'Shell Nigeria', ref: 'SHE/ENG/2026/112', preparedBy: 'Amaka Eze', sentDate: '2026-09-22', value: 320000000, validity: '2026-11-22', version: 'v1.2', status: 'Sent' },
  { id: 'PRP-007', title: 'Instrumentation & Control – Train 4', client: 'ExxonMobil Nigeria', ref: 'EXX/IC/2026/009', preparedBy: 'Amaka Eze', sentDate: '2026-09-30', value: 228000000, validity: '2026-11-30', version: 'v2.0', status: 'Under Review' },
  { id: 'PRP-008', title: 'Tank Farm Inspection & Integrity Assessment', client: 'Dangote Petrochemical', ref: 'DPE/ST/2026/061', preparedBy: 'Emeka Obi', sentDate: '2026-09-18', value: 68000000, validity: '2026-11-18', version: 'v1.0', status: 'Sent' },
  { id: 'PRP-009', title: 'Project Management Support – Gas Compression', client: 'Seplat Energy', ref: 'SEP/PM/2026/022', preparedBy: 'Chidi Okonkwo', sentDate: '2026-08-20', value: 145000000, validity: '2026-10-20', version: 'v2.2', status: 'Won' },
];

// ── CRM Contacts ──────────────────────────────────────────────────────────────
export const CONTACT_CATEGORIES = ['Client', 'Lead', 'Partner', 'Regulator', 'Vendor'];

export const mockContacts = [
  { id: 'CRM-001', name: 'Adewale Ogunleye', title: 'Head of Contracts', company: 'Total Energies EP Nigeria', email: 'a.ogunleye@totalenergies.com', phone: '+234 803 456 7890', category: 'Client', sector: 'Oil & Gas', location: 'Lagos', lastContact: '2026-09-28', owner: 'Chidi Okonkwo', status: 'Active' },
  { id: 'CRM-002', name: 'Ngozi Eze', title: 'Procurement Manager', company: 'Shell Nigeria Exploration', email: 'n.eze@shell.com', phone: '+234 802 345 6789', category: 'Client', sector: 'Oil & Gas', location: 'Port Harcourt', lastContact: '2026-09-22', owner: 'Amaka Eze', status: 'Active' },
  { id: 'CRM-003', name: 'Kenneth Obi', title: 'VP Engineering', company: 'ExxonMobil Nigeria', email: 'k.obi@exxon.com', phone: '+234 701 234 5678', category: 'Client', sector: 'Oil & Gas', location: 'Lagos', lastContact: '2026-09-30', owner: 'Chidi Okonkwo', status: 'Active' },
  { id: 'CRM-004', name: 'Fatima Al-Hassan', title: 'HSE Director', company: 'Chevron Nigeria Ltd', email: 'f.alhassan@chevron.com', phone: '+234 808 901 2345', category: 'Client', sector: 'Oil & Gas', location: 'Lagos', lastContact: '2026-09-15', owner: 'Emeka Obi', status: 'Active' },
  { id: 'CRM-005', name: 'Samuel Adeyemi', title: 'Commercial Manager', company: 'NNPCL – Upstream', email: 's.adeyemi@nnpc.com.ng', phone: '+234 805 678 9012', category: 'Lead', sector: 'Oil & Gas', location: 'Abuja', lastContact: '2026-09-05', owner: 'Bayo Adeleke', status: 'Active' },
  { id: 'CRM-006', name: 'Chukwuemeka Eze', title: 'Operations Director', company: 'Seplat Energy', email: 'c.eze@seplatenergy.com', phone: '+234 816 789 0123', category: 'Client', sector: 'Oil & Gas', location: 'Lagos', lastContact: '2026-09-18', owner: 'Chidi Okonkwo', status: 'Active' },
  { id: 'CRM-007', name: 'Yetunde Lawson', title: 'Project Director', company: 'NAOC Nigeria', email: 'y.lawson@naoc.com', phone: '+234 703 456 7890', category: 'Client', sector: 'Oil & Gas', location: 'Port Harcourt', lastContact: '2026-08-30', owner: 'Amaka Eze', status: 'Active' },
  { id: 'CRM-008', name: 'Ibrahim Suleiman', title: 'Technical Manager', company: 'Dangote Petrochemical', email: 'i.suleiman@dangote.com', phone: '+234 814 567 8901', category: 'Client', sector: 'Petrochemical', location: 'Lekki', lastContact: '2026-09-10', owner: 'Emeka Obi', status: 'Active' },
  { id: 'CRM-009', name: 'Hauwa Yusuf', title: 'Regulatory Affairs Lead', company: 'Nigerian Upstream Petroleum Regulatory Commission', email: 'h.yusuf@nuprc.gov.ng', phone: '+234 809 012 3456', category: 'Regulator', sector: 'Government', location: 'Abuja', lastContact: '2026-08-15', owner: 'Bayo Adeleke', status: 'Active' },
  { id: 'CRM-010', name: 'Emeka Nwofor', title: 'Business Development Manager', company: 'Agip Energy Nigeria', email: 'e.nwofor@agip.com', phone: '+234 817 890 1234', category: 'Lead', sector: 'Oil & Gas', location: 'Port Harcourt', lastContact: '2026-09-20', owner: 'Chidi Okonkwo', status: 'Active' },
  { id: 'CRM-011', name: 'Taiwo Adewale', title: 'Supply Chain Director', company: 'Heritage Energy Operational Services', email: 't.adewale@heritage.com', phone: '+234 802 123 4567', category: 'Client', sector: 'Oil & Gas', location: 'Lagos', lastContact: '2026-09-01', owner: 'Amaka Eze', status: 'Inactive' },
  { id: 'CRM-012', name: 'Musa Aliyu', title: 'Partner', company: 'PetroTech Associates Nigeria', email: 'm.aliyu@petrotech.ng', phone: '+234 811 345 6789', category: 'Partner', sector: 'Consulting', location: 'Abuja', lastContact: '2026-08-20', owner: 'Emeka Obi', status: 'Active' },
];
