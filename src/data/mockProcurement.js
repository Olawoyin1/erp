// ─── Mock Data: Procurement Module ───────────────────────────────────────────

// ── Purchase Requests (PRs) ───────────────────────────────────────────────────
export const mockPurchaseRequests = [
  { id: 'PR-2026-001', title: 'Safety Helmets & PPE Kits', department: 'HSE', requestedBy: 'Fatima Al-Hassan', date: '2026-09-28', requiredDate: '2026-10-15', estimatedCost: 850000, quantity: 50, unit: 'Sets', priority: 'High', status: 'Approved', poRef: 'PO-2026-008' },
  { id: 'PR-2026-002', title: 'Calibration Equipment – Pressure Gauges', department: 'Technical', requestedBy: 'Emeka Obi', date: '2026-09-25', requiredDate: '2026-10-20', estimatedCost: 2400000, quantity: 10, unit: 'Units', priority: 'High', status: 'PO Raised', poRef: 'PO-2026-009' },
  { id: 'PR-2026-003', title: 'Office Stationery & Consumables', department: 'Administration', requestedBy: 'Helen Okoye', date: '2026-09-22', requiredDate: '2026-10-05', estimatedCost: 180000, quantity: 1, unit: 'Lot', priority: 'Low', status: 'Approved', poRef: null },
  { id: 'PR-2026-004', title: 'Generator Fuel – October Supply', department: 'Administration', requestedBy: 'Admin Officer', date: '2026-10-01', requiredDate: '2026-10-07', estimatedCost: 1200000, quantity: 2000, unit: 'Litres', priority: 'High', status: 'Pending', poRef: null },
  { id: 'PR-2026-005', title: 'Laptop Computers for New Hires', department: 'IT', requestedBy: 'IT Manager', date: '2026-09-18', requiredDate: '2026-11-01', estimatedCost: 5600000, quantity: 8, unit: 'Units', priority: 'Medium', status: 'Pending HOD', poRef: null },
  { id: 'PR-2026-006', title: 'Engineering Drawing Software Licenses', department: 'Technical', requestedBy: 'Chief Engineer', date: '2026-09-15', requiredDate: '2026-10-30', estimatedCost: 3200000, quantity: 5, unit: 'Licenses', priority: 'Medium', status: 'Approved', poRef: null },
  { id: 'PR-2026-007', title: 'First Aid Supplies & Medical Kits', department: 'HSE', requestedBy: 'HSE Manager', date: '2026-10-02', requiredDate: '2026-10-12', estimatedCost: 320000, quantity: 20, unit: 'Kits', priority: 'High', status: 'Pending', poRef: null },
  { id: 'PR-2026-008', title: 'Welding Equipment – Site Use', department: 'Technical', requestedBy: 'Site Engineer', date: '2026-09-10', requiredDate: '2026-09-28', estimatedCost: 4800000, quantity: 3, unit: 'Sets', priority: 'High', status: 'PO Raised', poRef: 'PO-2026-007' },
  { id: 'PR-2026-009', title: 'Toner Cartridges – HP LaserJet', department: 'Administration', requestedBy: 'Admin Officer', date: '2026-09-05', requiredDate: '2026-09-20', estimatedCost: 95000, quantity: 6, unit: 'Units', priority: 'Low', status: 'Delivered', poRef: 'PO-2026-005' },
  { id: 'PR-2026-010', title: 'Network Switch & Cabling', department: 'IT', requestedBy: 'IT Manager', date: '2026-08-28', requiredDate: '2026-09-15', estimatedCost: 780000, quantity: 1, unit: 'Lot', priority: 'Medium', status: 'Delivered', poRef: 'PO-2026-004' },
];

// ── Purchase Orders (POs) ─────────────────────────────────────────────────────
export const mockPurchaseOrders = [
  { id: 'PO-2026-009', prRef: 'PR-2026-002', title: 'Calibration Equipment – Pressure Gauges', vendor: 'Precision Instruments Ltd', vendorId: 'VND-004', issuedDate: '2026-09-27', deliveryDate: '2026-10-18', amount: 2520000, department: 'Technical', approvedBy: 'CFO', status: 'Confirmed', paymentStatus: 'Unpaid' },
  { id: 'PO-2026-008', prRef: 'PR-2026-001', title: 'Safety Helmets & PPE Kits', vendor: 'SafeGuard Nigeria Ltd', vendorId: 'VND-002', issuedDate: '2026-09-30', deliveryDate: '2026-10-14', amount: 875000, department: 'HSE', approvedBy: 'CFO', status: 'Confirmed', paymentStatus: 'Partial' },
  { id: 'PO-2026-007', prRef: 'PR-2026-008', title: 'Welding Equipment – Site Use', vendor: 'TechWeld Industries', vendorId: 'VND-007', issuedDate: '2026-09-12', deliveryDate: '2026-09-26', amount: 5100000, department: 'Technical', approvedBy: 'CFO', status: 'Delivered', paymentStatus: 'Paid' },
  { id: 'PO-2026-006', prRef: null, title: 'Diesel Supply – September', vendor: 'EnergyPrime Fuels', vendorId: 'VND-005', issuedDate: '2026-09-01', deliveryDate: '2026-09-07', amount: 1150000, department: 'Administration', approvedBy: 'CFO', status: 'Delivered', paymentStatus: 'Paid' },
  { id: 'PO-2026-005', prRef: 'PR-2026-009', title: 'Toner Cartridges – HP LaserJet', vendor: 'OfficePro Supplies', vendorId: 'VND-001', issuedDate: '2026-09-08', deliveryDate: '2026-09-18', amount: 98000, department: 'Administration', approvedBy: 'Admin Manager', status: 'Delivered', paymentStatus: 'Paid' },
  { id: 'PO-2026-004', prRef: 'PR-2026-010', title: 'Network Switch & Cabling', vendor: 'NetCore Technology', vendorId: 'VND-006', issuedDate: '2026-09-01', deliveryDate: '2026-09-14', amount: 812000, department: 'IT', approvedBy: 'IT Manager', status: 'Delivered', paymentStatus: 'Paid' },
  { id: 'PO-2026-003', prRef: null, title: 'Furniture – Executive Lounge Upgrade', vendor: 'Premier Interiors NG', vendorId: 'VND-008', issuedDate: '2026-08-20', deliveryDate: '2026-09-10', amount: 3450000, department: 'Administration', approvedBy: 'CFO', status: 'Delivered', paymentStatus: 'Paid' },
  { id: 'PO-2026-002', prRef: null, title: 'IT Server Room Cooling Unit', vendor: 'Daikin Nigeria Ltd', vendorId: 'VND-009', issuedDate: '2026-08-10', deliveryDate: '2026-08-28', amount: 2200000, department: 'IT', approvedBy: 'CFO', status: 'Delivered', paymentStatus: 'Paid' },
  { id: 'PO-2026-001', prRef: null, title: 'Vehicle Spare Parts – Toyota Fleet', vendor: 'AutoParts Direct NG', vendorId: 'VND-003', issuedDate: '2026-07-15', deliveryDate: '2026-07-28', amount: 680000, department: 'Administration', approvedBy: 'Admin Manager', status: 'Delivered', paymentStatus: 'Paid' },
];

// ── Vendors ───────────────────────────────────────────────────────────────────
export const VENDOR_CATEGORIES = ['Supply', 'Services', 'Logistics', 'IT', 'Maintenance', 'Construction', 'Fuel'];

export const mockVendors = [
  { id: 'VND-001', name: 'OfficePro Supplies', category: 'Supply', contact: 'Tunde Adeyemi', email: 'tunde@officepro.ng', phone: '+234 803 111 2222', location: 'Lagos', registrationNo: 'RC-234512', status: 'Approved', rating: 4, totalOrders: 8, totalSpend: 1240000, lastOrder: '2026-09-08', taxClearance: '2027-01-01' },
  { id: 'VND-002', name: 'SafeGuard Nigeria Ltd', category: 'Supply', contact: 'Amara Ike', email: 'amara@safeguard.ng', phone: '+234 806 222 3333', location: 'Port Harcourt', registrationNo: 'RC-345678', status: 'Approved', rating: 5, totalOrders: 14, totalSpend: 6500000, lastOrder: '2026-09-30', taxClearance: '2027-03-15' },
  { id: 'VND-003', name: 'AutoParts Direct NG', category: 'Supply', contact: 'Biodun Olowo', email: 'biodun@autoparts.ng', phone: '+234 812 333 4444', location: 'Abuja', registrationNo: 'RC-456789', status: 'Approved', rating: 4, totalOrders: 6, totalSpend: 2100000, lastOrder: '2026-07-15', taxClearance: '2026-12-31' },
  { id: 'VND-004', name: 'Precision Instruments Ltd', category: 'Supply', contact: 'Ngozi Okafor', email: 'ngozi@precisionng.com', phone: '+234 809 444 5555', location: 'Lagos', registrationNo: 'RC-567890', status: 'Approved', rating: 5, totalOrders: 10, totalSpend: 18400000, lastOrder: '2026-09-27', taxClearance: '2027-06-30' },
  { id: 'VND-005', name: 'EnergyPrime Fuels', category: 'Fuel', contact: 'Musa Garba', email: 'musa@energyprime.ng', phone: '+234 815 555 6666', location: 'Kaduna', registrationNo: 'RC-678901', status: 'Approved', rating: 3, totalOrders: 12, totalSpend: 14500000, lastOrder: '2026-09-01', taxClearance: '2026-11-30' },
  { id: 'VND-006', name: 'NetCore Technology', category: 'IT', contact: 'Seun Banjo', email: 'seun@netcore.ng', phone: '+234 802 666 7777', location: 'Lagos', registrationNo: 'RC-789012', status: 'Approved', rating: 4, totalOrders: 5, totalSpend: 4350000, lastOrder: '2026-09-01', taxClearance: '2027-02-28' },
  { id: 'VND-007', name: 'TechWeld Industries', category: 'Services', contact: 'Chidi Nweze', email: 'chidi@techweld.ng', phone: '+234 817 777 8888', location: 'Port Harcourt', registrationNo: 'RC-890123', status: 'Approved', rating: 4, totalOrders: 7, totalSpend: 22800000, lastOrder: '2026-09-12', taxClearance: '2027-04-01' },
  { id: 'VND-008', name: 'Premier Interiors NG', category: 'Services', contact: 'Kemi Ajayi', email: 'kemi@premierinteriors.ng', phone: '+234 808 888 9999', location: 'Lagos', registrationNo: 'RC-901234', status: 'Pending Review', rating: 3, totalOrders: 2, totalSpend: 5200000, lastOrder: '2026-08-20', taxClearance: '2026-10-15' },
  { id: 'VND-009', name: 'Daikin Nigeria Ltd', category: 'Maintenance', contact: 'Emmanuel Eze', email: 'emmanuel@daikin.ng', phone: '+234 811 999 0000', location: 'Lagos', registrationNo: 'RC-012345', status: 'Approved', rating: 5, totalOrders: 9, totalSpend: 9800000, lastOrder: '2026-08-10', taxClearance: '2027-05-31' },
  { id: 'VND-010', name: 'BuildRight Construction Ltd', category: 'Construction', contact: 'Ayo Akinbode', email: 'ayo@buildright.ng', phone: '+234 803 000 1111', location: 'Abuja', registrationNo: 'RC-123456', status: 'Blacklisted', rating: 1, totalOrders: 1, totalSpend: 800000, lastOrder: '2026-06-01', taxClearance: '2026-08-31' },
];

// ── Inventory / Store Items ───────────────────────────────────────────────────
export const INVENTORY_CATEGORIES = ['PPE & Safety', 'IT Equipment', 'Office Supplies', 'Electrical', 'Mechanical', 'Chemicals', 'Fuel & Lubricants', 'Spare Parts'];

export const mockInventory = [
  { id: 'INV-001', name: 'Safety Helmets (Yellow)', category: 'PPE & Safety', unit: 'Units', quantityInStock: 38, reorderLevel: 20, quantityOnOrder: 0, unitCost: 8500, location: 'Store A – Shelf 1', supplier: 'SafeGuard Nigeria Ltd', lastRestocked: '2026-09-15', status: 'In Stock' },
  { id: 'INV-002', name: 'Safety Boots (Size 42-44)', category: 'PPE & Safety', unit: 'Pairs', quantityInStock: 12, reorderLevel: 15, quantityOnOrder: 20, unitCost: 18000, location: 'Store A – Shelf 2', supplier: 'SafeGuard Nigeria Ltd', lastRestocked: '2026-08-20', status: 'Low Stock' },
  { id: 'INV-003', name: 'Laptop Computer – HP EliteBook', category: 'IT Equipment', unit: 'Units', quantityInStock: 3, reorderLevel: 5, quantityOnOrder: 8, unitCost: 720000, location: 'IT Store – Cabinet 1', supplier: 'NetCore Technology', lastRestocked: '2026-07-10', status: 'Low Stock' },
  { id: 'INV-004', name: 'A4 Printing Paper (500 sheets/ream)', category: 'Office Supplies', unit: 'Reams', quantityInStock: 145, reorderLevel: 50, quantityOnOrder: 0, unitCost: 3500, location: 'Store B – Shelf 3', supplier: 'OfficePro Supplies', lastRestocked: '2026-09-22', status: 'In Stock' },
  { id: 'INV-005', name: 'Diesel Fuel', category: 'Fuel & Lubricants', unit: 'Litres', quantityInStock: 850, reorderLevel: 500, quantityOnOrder: 2000, unitCost: 1250, location: 'Fuel Depot', supplier: 'EnergyPrime Fuels', lastRestocked: '2026-09-01', status: 'In Stock' },
  { id: 'INV-006', name: 'Toner Cartridge – HP 85A', category: 'Office Supplies', unit: 'Units', quantityInStock: 2, reorderLevel: 4, quantityOnOrder: 0, unitCost: 16500, location: 'Store B – Shelf 1', supplier: 'OfficePro Supplies', lastRestocked: '2026-09-18', status: 'Critical' },
  { id: 'INV-007', name: 'Welding Electrodes (3.2mm)', category: 'Mechanical', unit: 'KG', quantityInStock: 120, reorderLevel: 50, quantityOnOrder: 0, unitCost: 4800, location: 'Workshop Store', supplier: 'TechWeld Industries', lastRestocked: '2026-09-26', status: 'In Stock' },
  { id: 'INV-008', name: 'Fire Extinguisher – CO2 9KG', category: 'PPE & Safety', unit: 'Units', quantityInStock: 8, reorderLevel: 10, quantityOnOrder: 5, unitCost: 45000, location: 'Store A – Shelf 4', supplier: 'SafeGuard Nigeria Ltd', lastRestocked: '2026-08-05', status: 'Low Stock' },
  { id: 'INV-009', name: 'Engine Oil – Shell Rimula 15W40', category: 'Fuel & Lubricants', unit: 'Litres', quantityInStock: 240, reorderLevel: 100, quantityOnOrder: 0, unitCost: 3200, location: 'Fuel Depot', supplier: 'EnergyPrime Fuels', lastRestocked: '2026-08-28', status: 'In Stock' },
  { id: 'INV-010', name: 'UTP Cat6 Cable (305m)', category: 'IT Equipment', unit: 'Rolls', quantityInStock: 4, reorderLevel: 3, quantityOnOrder: 0, unitCost: 55000, location: 'IT Store – Cabinet 2', supplier: 'NetCore Technology', lastRestocked: '2026-09-14', status: 'In Stock' },
  { id: 'INV-011', name: 'Pressure Gauges – 0-100 PSI', category: 'Mechanical', unit: 'Units', quantityInStock: 0, reorderLevel: 5, quantityOnOrder: 10, unitCost: 240000, location: 'Technical Store', supplier: 'Precision Instruments Ltd', lastRestocked: '2026-06-01', status: 'Out of Stock' },
  { id: 'INV-012', name: 'Hand Gloves – Nitrile (Box/100)', category: 'PPE & Safety', unit: 'Boxes', quantityInStock: 22, reorderLevel: 10, quantityOnOrder: 0, unitCost: 7500, location: 'Store A – Shelf 3', supplier: 'SafeGuard Nigeria Ltd', lastRestocked: '2026-09-10', status: 'In Stock' },
];

// ── Procurement Reports summary data ─────────────────────────────────────────
export const mockProcurementSummary = {
  monthlySpend: [
    { month: 'Apr', spend: 4200000 }, { month: 'May', spend: 6800000 }, { month: 'Jun', spend: 5100000 },
    { month: 'Jul', spend: 3900000 }, { month: 'Aug', spend: 8200000 }, { month: 'Sep', spend: 11500000 }, { month: 'Oct', spend: 3400000 },
  ],
  categorySpend: [
    { category: 'PPE & Safety', amount: 7375000, pct: 24 },
    { category: 'Technical Equipment', amount: 7620000, pct: 25 },
    { category: 'IT Equipment', amount: 5012000, pct: 16 },
    { category: 'Fuel & Lubricants', amount: 5650000, pct: 18 },
    { category: 'Office Supplies', amount: 1540000, pct: 5 },
    { category: 'Services & Works', amount: 3700000, pct: 12 },
  ],
  topVendors: [
    { name: 'TechWeld Industries', amount: 22800000 },
    { name: 'Precision Instruments Ltd', amount: 18400000 },
    { name: 'EnergyPrime Fuels', amount: 14500000 },
    { name: 'Daikin Nigeria Ltd', amount: 9800000 },
    { name: 'SafeGuard Nigeria Ltd', amount: 6500000 },
  ],
};
