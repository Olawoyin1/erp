// ─── Comprehensive Mock Data: Procurement Module ──────────────────────────────

export const mockRequisitions = [
  {
    id: 'PR-25-001',
    materials: 'Safety Helmets',
    department: 'HSE',
    requestedBy: 'Chijioke Okafor',
    priority: 'High',
    requestDate: '28/05/25',
    requiredDate: '05/06/25',
    status: 'Pending Approval',
    category: 'PPE',
    quantity: 150,
    unit: 'Pieces',
    estimatedBudget: 1500000,
    project: 'Offshore Safety Upgrade',
    justification: 'Safety helmets required for newly deployed rig site operators and HSE field staff.',
    documents: [
      { name: 'HSE_Protective_Gear_Specs.pdf', size: '12MB' },
      { name: 'Vendor_Price_Index.pdf', size: '4MB' }
    ]
  },
  {
    id: 'PR-25-002',
    materials: 'Pressure Gauges',
    department: 'Technical',
    requestedBy: 'Zainab Mohammed',
    priority: 'Medium',
    requestDate: '28/05/25',
    requiredDate: '10/06/25',
    status: 'Draft',
    category: 'Equipment',
    quantity: 20,
    unit: 'Units',
    estimatedBudget: 4200000,
    project: 'LNG Expansion Project',
    justification: 'Pressure gauges for compressor calibration at Train 2 facility.',
    documents: [
      { name: 'Calibration_Specs_Doc.pdf', size: '18MB' }
    ]
  },
  {
    id: 'PR-25-003',
    materials: 'Structural Steel Sections',
    department: 'Technical',
    requestedBy: 'Obinna Nwosu',
    priority: 'Medium',
    requestDate: '28/05/25',
    requiredDate: '12/06/25',
    status: 'Converted to RFQ',
    category: 'Materials',
    quantity: 25,
    unit: 'Tonnes',
    estimatedBudget: 12500000,
    project: 'LNG Expansion Project',
    justification: 'Steel beams are required to complete the structural framework for Area B before mechanical installation begins.',
    documents: [
      { name: 'BOQ_Revision_03.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' }
    ]
  },
  {
    id: 'PR-25-004',
    materials: 'Diesel Generator Filters',
    department: 'Technical',
    requestedBy: 'Adaobi Udo',
    priority: 'High',
    requestDate: '28/05/25',
    requiredDate: '02/06/25',
    status: 'Approved',
    category: 'Spare Parts',
    quantity: 80,
    unit: 'Pieces',
    estimatedBudget: 2800000,
    project: 'Facility Maintenance',
    justification: 'Critical scheduled maintenance for primary 1.5MVA power generation sets.',
    documents: [
      { name: 'Filter_Cross_Ref_List.pdf', size: '8MB' }
    ]
  },
  {
    id: 'PR-25-005',
    materials: 'Office Chairs',
    department: 'Administration',
    requestedBy: 'Tunde Adebayo',
    priority: 'Low',
    requestDate: '28/05/25',
    requiredDate: '15/06/25',
    status: 'Converted to RFQ',
    category: 'Office Supplies',
    quantity: 40,
    unit: 'Pieces',
    estimatedBudget: 3200000,
    project: 'HQ Facility Upgrade',
    justification: 'Ergonomic workstations seating replacement for Operations wing.',
    documents: [
      { name: 'Furniture_Requisition_Signoff.pdf', size: '5MB' }
    ]
  },
  {
    id: 'PR-25-006',
    materials: 'Diesel Generator Filters',
    department: 'Technical',
    requestedBy: 'Ngozi Eze',
    priority: 'Hot',
    requestDate: '28/05/25',
    requiredDate: '30/05/25',
    status: 'Converted to RFQ',
    category: 'Spare Parts',
    quantity: 50,
    unit: 'Pieces',
    estimatedBudget: 1950000,
    project: 'Bonny Terminal Operations',
    justification: 'Immediate replacement needed to prevent generation shutdown.',
    documents: [
      { name: 'Emergency_Maintenance_Req.pdf', size: '10MB' }
    ]
  },
  {
    id: 'PR-25-007',
    materials: 'Laptop Accessories',
    department: 'Finance',
    requestedBy: 'Femi Balogun',
    priority: 'High',
    requestDate: '28/05/25',
    requiredDate: '08/06/25',
    status: 'Approved',
    category: 'IT Equipment',
    quantity: 15,
    unit: 'Sets',
    estimatedBudget: 1450000,
    project: 'General Operations',
    justification: 'Docking stations and external monitors for audit and taxation team.',
    documents: [
      { name: 'IT_Procurement_Spec.pdf', size: '7MB' }
    ]
  },
  {
    id: 'PR-25-008',
    materials: 'Diesel Generator Filters',
    department: 'Technical',
    requestedBy: 'Yejide Ogunleye',
    priority: 'Low',
    requestDate: '28/05/25',
    requiredDate: '20/06/25',
    status: 'Approved',
    category: 'Spare Parts',
    quantity: 30,
    unit: 'Pieces',
    estimatedBudget: 1100000,
    project: 'Warehouse Stock Replenishment',
    justification: 'Stock replenishment to maintain minimum safety margin.',
    documents: [
      { name: 'Warehouse_Stock_Audit.pdf', size: '9MB' }
    ]
  },
  {
    id: 'PR-25-009',
    materials: 'Diesel Generator Filters',
    department: 'Technical',
    requestedBy: 'Ifeoma Nnaji',
    priority: 'High',
    requestDate: '28/05/25',
    requiredDate: '01/06/25',
    status: 'Rejected',
    category: 'Spare Parts',
    quantity: 20,
    unit: 'Pieces',
    estimatedBudget: 800000,
    project: 'Warri Workshop Repairs',
    justification: 'Routine stock for non-operational unit.',
    rejectionReason: 'Duplicate requisition already raised in PR-25-004 by Technical dept.',
    documents: [
      { name: 'Requisition_Justification.pdf', size: '3MB' }
    ]
  },
  {
    id: 'PR-25-010',
    materials: 'Diesel Generator Filters',
    department: 'Technical',
    requestedBy: 'Sola Oladipo',
    priority: 'Medium',
    requestDate: '28/05/25',
    requiredDate: '14/06/25',
    status: 'Draft',
    category: 'Spare Parts',
    quantity: 45,
    unit: 'Pieces',
    estimatedBudget: 1600000,
    project: 'Escravos Pipeline Facility',
    justification: 'Preparation for Q3 preventive maintenance cycles.',
    documents: [
      { name: 'Maintenance_Schedule.pdf', size: '14MB' }
    ]
  }
];

// ── RFQs / RFPs ─────────────────────────────────────────────────────────────
export const mockRFQs = [
  {
    id: 'P-RFQ-25-001',
    title: 'Structural Steel Supply',
    type: 'RFQ',
    category: 'Materials',
    relatedRequisition: 'PR-25-008 — Structural Steel Beams',
    linkedProject: 'LNG Expansion Project',
    issueDate: '22/05/26',
    closingDate: '29/05/26',
    deliveryLocation: 'PGSL Port Harcourt Yard',
    paymentTerms: 'Net 30',
    status: 'Under Evaluation',
    vendorsInvited: 3,
    items: [
      { item: 'Structural Steel Beam IPE300', quantity: 25, unit: 'Tonnes' }
    ],
    documents: [
      { name: 'Technical Specification.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' }
    ],
    responses: [
      {
        vendor: 'Dangote Steel Ltd.',
        quotationNo: 'DSL/QTN/2026/0417',
        date: '29/05/26',
        amount: 45200000,
        currency: 'NGN',
        deliveryPeriod: '21 Days',
        proposedTerms: 'Advance Payment',
        status: 'Compliant',
        notes: 'Vendor meets all technical requirements. Delivery schedule aligns with project timeline.',
        documents: [{ name: 'Dangote_Quotation.pdf', size: '15MB' }]
      },
      {
        vendor: 'MetalBerg Engineering Ltd.',
        quotationNo: '',
        date: '',
        amount: null,
        deliveryPeriod: '',
        status: 'Awaiting',
        notes: 'No response submitted before closure.',
        documents: []
      },
      {
        vendor: 'Prime Steel Solutions',
        quotationNo: '',
        date: '',
        amount: null,
        deliveryPeriod: '',
        status: 'Awaiting',
        notes: 'Pending final review.',
        documents: []
      },
      {
        vendor: 'African Industries Group',
        quotationNo: 'AIG/RFQ/2026-90',
        date: '28/05/26',
        amount: 46800000,
        currency: 'NGN',
        deliveryPeriod: '21 Days',
        proposedTerms: '50/50 Advance-Delivery',
        status: 'Compliant',
        notes: 'Full technical compliance verified by Technical Lead.',
        documents: [{ name: 'African_Industries_Quotation.pdf', size: '25MB' }]
      }
    ]
  },
  {
    id: 'P-RFQ-25-002',
    title: 'Fire Suppression Upgrade',
    type: 'RFP',
    category: 'Services',
    relatedRequisition: 'PR-25-001 — Fire Safety Gear',
    linkedProject: 'Offshore Terminal Bravo',
    issueDate: '28/05/25',
    closingDate: '20/06/25',
    deliveryLocation: 'Offshore Platform Bravo',
    paymentTerms: 'Milestone 40/40/20',
    status: 'Draft',
    vendorsInvited: 4,
    items: [{ item: 'Inert Gas Extinguishing System', quantity: 1, unit: 'Turnkey System' }],
    documents: [{ name: 'HSE_Fire_Specs.pdf', size: '30MB' }],
    responses: []
  },
  {
    id: 'P-RFQ-25-003',
    title: 'Industrial Pressure Gauges',
    type: 'RFQ',
    category: 'Equipment',
    relatedRequisition: 'PR-25-002 — Pressure Gauges',
    linkedProject: 'Compressor Station Refurbishment',
    issueDate: '28/05/25',
    closingDate: '12/06/25',
    deliveryLocation: 'Port Harcourt Yard',
    paymentTerms: 'Net 30',
    status: 'Issued',
    vendorsInvited: 2,
    items: [{ item: 'High Pressure Digital Gauges 0-5000psi', quantity: 20, unit: 'Units' }],
    documents: [{ name: 'Gauge_Specs.pdf', size: '12MB' }],
    responses: []
  },
  {
    id: 'P-RFQ-25-004',
    title: 'Office Furniture Supply',
    type: 'RFQ',
    category: 'Office Supplies',
    relatedRequisition: 'PR-25-005 — Office Chairs',
    linkedProject: 'Corporate Office Renovation',
    issueDate: '28/05/25',
    closingDate: '05/06/25',
    deliveryLocation: 'Lagos Headquarters',
    paymentTerms: 'Net 30',
    status: 'Awarded',
    dateAwarded: '02/06/26',
    awardedVendor: 'Universal Steel & Furniture Ltd.',
    vendorsInvited: 5,
    items: [{ item: 'Executive Mesh Ergonomic Chair', quantity: 40, unit: 'Pieces' }],
    documents: [{ name: 'Furniture_Tender_Specs.pdf', size: '10MB' }],
    responses: [
      {
        vendor: 'Universal Steel & Furniture Ltd.',
        quotationNo: 'USF-2026-88',
        date: '01/06/26',
        amount: 3200000,
        currency: 'NGN',
        deliveryPeriod: '10 Days',
        proposedTerms: 'Net 30',
        status: 'Awarded',
        notes: 'Lowest responsive compliant bid.',
        documents: []
      }
    ]
  },
  {
    id: 'P-RFQ-25-005',
    title: 'Office Furniture Supply',
    type: 'RFQ',
    category: 'Office Supplies',
    relatedRequisition: 'PR-25-005 — Office Desks',
    linkedProject: 'Warri Base Camp',
    issueDate: '28/05/25',
    closingDate: '10/06/25',
    deliveryLocation: 'Warri Operations Base',
    paymentTerms: 'Net 30',
    status: 'Under Evaluation',
    vendorsInvited: 2,
    items: [{ item: 'Modular Workstation 4-Pod', quantity: 10, unit: 'Pods' }],
    documents: [],
    responses: []
  },
  {
    id: 'P-RFQ-25-006',
    title: 'Office Furniture Supply',
    type: 'RFQ',
    category: 'Office Supplies',
    relatedRequisition: 'PR-25-005 — Conference Room Set',
    linkedProject: 'Port Harcourt Annex',
    issueDate: '28/05/25',
    closingDate: '15/06/25',
    deliveryLocation: 'Port Harcourt Annex',
    paymentTerms: 'Net 30',
    status: 'Under Evaluation',
    vendorsInvited: 4,
    items: [{ item: 'Executive Boardroom Conference Table & 16 Chairs', quantity: 1, unit: 'Set' }],
    documents: [],
    responses: []
  },
  {
    id: 'P-RFQ-25-007',
    title: 'Office Furniture Supply',
    type: 'RFQ',
    category: 'Office Supplies',
    relatedRequisition: 'PR-25-005 — Filing Cabinets',
    linkedProject: 'Abuja Liaison Office',
    issueDate: '28/05/25',
    closingDate: '01/06/25',
    deliveryLocation: 'Abuja Liaison Office',
    paymentTerms: 'Net 30',
    status: 'Awarded',
    dateAwarded: '03/06/26',
    awardedVendor: 'Prime Steel Solutions',
    vendorsInvited: 3,
    items: [{ item: 'Fireproof 4-Drawer Cabinet', quantity: 8, unit: 'Units' }],
    documents: [],
    responses: []
  },
  {
    id: 'P-RFQ-25-008',
    title: 'Office Furniture Supply',
    type: 'RFQ',
    category: 'Office Supplies',
    relatedRequisition: 'PR-25-005 — Reception Counter',
    linkedProject: 'HQ Reception',
    issueDate: '28/05/25',
    closingDate: '18/06/25',
    deliveryLocation: 'Lagos Headquarters',
    paymentTerms: 'Net 30',
    status: 'Cancelled',
    vendorsInvited: 2,
    items: [{ item: 'Custom Curved Reception Desk', quantity: 1, unit: 'Unit' }],
    documents: [],
    responses: []
  }
];

// ── Purchase Order Tracking ──────────────────────────────────────────────────
export const mockPurchaseOrderTracking = [
  {
    poNo: 'PO-25-001',
    vendor: 'Dangote Steel Ltd.',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Materials',
    poValue: 45200000,
    poDate: '02/06/26',
    deliveryDue: '02/07/26',
    status: 'Awarded',
    linkedProject: 'LNG Expansion Project',
    deliveryLocation: 'PGSL Port Harcourt Yard',
    paymentTerms: '30 Days After Invoice',
    orderedItems: [
      { description: 'Structural Steel Beam H200', qty: 25, unit: 'Tonnes', unitPrice: 1200000, total: 30000000 },
      { description: 'Steel Connection Plates', qty: 450, unit: 'Pieces', unitPrice: 12000, total: 5400000 },
      { description: 'High Tensile Bolts M24', qty: 1200, unit: 'Pieces', unitPrice: 8167, total: 9800400 }
    ],
    documents: [
      { name: 'Technical Specification.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' },
      { name: 'African_Industries_Quotation.pdf', size: '25MB' },
      { name: 'Product Catalogue.pdf', size: '25MB' }
    ]
  },
  {
    poNo: 'PO-25-002',
    vendor: 'Universal Steel Ltd.',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Services',
    poValue: 18750000,
    poDate: '28/05/25',
    deliveryDue: '28/06/25',
    status: 'Awarded',
    linkedProject: 'Fabrication Yard Setup',
    deliveryLocation: 'Port Harcourt Yard',
    paymentTerms: 'Net 30',
    orderedItems: [
      { description: 'Structural Rig Welder Certification & Supply', qty: 15, unit: 'Welders', unitPrice: 1250000, total: 18750000 }
    ],
    documents: [{ name: 'Service_Contract.pdf', size: '14MB' }]
  },
  {
    poNo: 'PO-25-003',
    vendor: 'African Industries Group',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Equipment',
    poValue: 72500000,
    poDate: '28/05/25',
    deliveryDue: '15/07/25',
    status: 'Awarded',
    linkedProject: 'Offshore Heavy Lifting',
    deliveryLocation: 'Onne Free Zone',
    paymentTerms: 'Letter of Credit',
    orderedItems: [
      { description: 'Heavy Duty Crane Winches 50T', qty: 2, unit: 'Units', unitPrice: 36250000, total: 72500000 }
    ],
    documents: [{ name: 'Equipment_Spec_Brochure.pdf', size: '22MB' }]
  },
  {
    poNo: 'PO-25-004',
    vendor: 'Flowline Engineering Ltd.',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Office Supplies',
    poValue: 9800000,
    poDate: '28/05/25',
    deliveryDue: '20/06/25',
    status: 'Acknowledged',
    linkedProject: 'Pipeline Inspection Camp',
    deliveryLocation: 'Warri Facility',
    paymentTerms: 'Net 30',
    orderedItems: [
      { description: 'Surveying Transit Theodolites', qty: 4, unit: 'Sets', unitPrice: 2450000, total: 9800000 }
    ],
    documents: [{ name: 'Calibration_Cert_PO.pdf', size: '5MB' }]
  },
  {
    poNo: 'PO-25-005',
    vendor: 'Prime Steel Solutions',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Office Supplies',
    poValue: 9800000,
    poDate: '28/05/25',
    deliveryDue: '28/06/25',
    status: 'Acknowledged',
    linkedProject: 'Base Expansion',
    deliveryLocation: 'Port Harcourt Yard',
    paymentTerms: 'Net 30',
    orderedItems: [
      { description: 'Workshop Tool Cabinets', qty: 10, unit: 'Units', unitPrice: 980000, total: 9800000 }
    ],
    documents: []
  },
  {
    poNo: 'PO-25-006',
    vendor: 'Prime Steel Solutions',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Office Supplies',
    poValue: 9800000,
    poDate: '28/05/25',
    deliveryDue: '28/06/25',
    status: 'Cancelled',
    linkedProject: 'Admin Base Store',
    deliveryLocation: 'Lagos Headquarters',
    paymentTerms: 'Net 30',
    orderedItems: [
      { description: 'Warehouse Pallet Racks', qty: 20, unit: 'Racks', unitPrice: 490000, total: 9800000 }
    ],
    documents: []
  },
  {
    poNo: 'PO-25-007',
    vendor: 'Prime Steel Solutions',
    linkedRFQ: 'P-RFQ-25-001',
    category: 'Office Supplies',
    poValue: 9800000,
    poDate: '28/05/25',
    deliveryDue: '28/06/25',
    status: 'Acknowledged',
    linkedProject: 'Admin Office Refit',
    deliveryLocation: 'Port Harcourt Yard',
    paymentTerms: 'Net 30',
    orderedItems: [],
    documents: []
  }
];

// ── Expediting & Delivery ───────────────────────────────────────────────────
export const mockDeliveries = [
  {
    deliveryRef: 'DEL-25-001',
    poNo: 'PO-25-001',
    vendor: 'Dangote Steel Ltd.',
    material: 'Structural Steel',
    expectedDelivery: '28/05/25',
    status: 'In Transit',
    linkedRFQ: 'P-RFQ-25-004',
    linkedProject: 'LNG Expansion Project',
    quantity: '120 Pieces',
    deliveryLocation: 'PGSL Port Harcourt Yard',
    timeline: [
      { status: 'Purchase Order Issued', date: '28/05/2025 • 9:45', done: true },
      { status: 'Vendor Acknowledged', date: '28/05/2025 • 9:45', done: true },
      { status: 'In Production', date: '28/05/2025 • 9:45', done: true },
      { status: 'Ready for Shipment', date: '28/05/2025 • 9:45', done: true },
      { status: 'In Transit', date: '28/05/2025 • 9:45', active: true },
      { status: 'Customs Clearance', date: 'Pending', pending: true },
      { status: 'Delivered', date: 'Pending', pending: true }
    ],
    documents: [
      { name: 'Technical Specification.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' },
      { name: 'African_Industries_Quotation.pdf', size: '25MB' },
      { name: 'Product Catalogue.pdf', size: '25MB' }
    ]
  },
  {
    deliveryRef: 'DEL-25-002',
    poNo: 'PO-25-002',
    vendor: 'Universal Steel Ltd.',
    material: 'Reinforcement Bars',
    expectedDelivery: '28/05/25',
    status: 'Delivered',
    linkedRFQ: 'P-RFQ-25-002',
    linkedProject: 'Foundation Piling Jetty 3',
    quantity: '500 Pieces',
    deliveryLocation: 'Main Warehouse',
    timeline: [
      { status: 'Purchase Order Issued', date: '10/05/2025', done: true },
      { status: 'Vendor Acknowledged', date: '12/05/2025', done: true },
      { status: 'In Transit', date: '22/05/2025', done: true },
      { status: 'Delivered', date: '28/05/2025 • 14:10', done: true }
    ],
    documents: [{ name: 'Delivery_Waybill_Universal.pdf', size: '8MB' }]
  },
  {
    deliveryRef: 'DEL-25-003',
    poNo: 'PO-25-003',
    vendor: 'Dangote Industries',
    material: 'Cement',
    expectedDelivery: '28/05/25',
    status: 'In Production',
    linkedRFQ: 'P-RFQ-25-001',
    linkedProject: 'Civil Infrastructure Works',
    quantity: '1,000 Bags',
    deliveryLocation: 'Port Harcourt Yard',
    timeline: [
      { status: 'Purchase Order Issued', date: '20/05/2025', done: true },
      { status: 'In Production', date: '28/05/2025', active: true },
      { status: 'In Transit', date: 'Pending', pending: true },
      { status: 'Delivered', date: 'Pending', pending: true }
    ],
    documents: [{ name: 'Production_Batch_Notice.pdf', size: '4MB' }]
  },
  {
    deliveryRef: 'DEL-25-004',
    poNo: 'PO-25-004',
    vendor: 'Flowline Engineering Ltd.',
    material: 'Reinforcement Bars',
    expectedDelivery: '28/05/25',
    status: 'Delayed',
    linkedRFQ: 'P-RFQ-25-003',
    linkedProject: 'Warri Facility Upgrade',
    quantity: '250 Pieces',
    deliveryLocation: 'Warri Yard A',
    timeline: [
      { status: 'Purchase Order Issued', date: '05/05/2025', done: true },
      { status: 'Delayed', date: '28/05/2025 — Factory re-tooling backlog', delayed: true },
      { status: 'Delivered', date: 'Pending', pending: true }
    ],
    documents: [{ name: 'Delay_Notification_Notice.pdf', size: '2MB' }]
  },
  {
    deliveryRef: 'DEL-25-005',
    poNo: 'PO-25-005',
    vendor: 'Prime Steel Solutions',
    material: 'Reinforcement Bars',
    expectedDelivery: '28/05/25',
    status: 'Ready for Shipment',
    linkedRFQ: 'P-RFQ-25-001',
    linkedProject: 'LNG Expansion Project',
    quantity: '300 Pieces',
    deliveryLocation: 'Main Warehouse',
    timeline: [
      { status: 'Ready for Shipment', date: '28/05/2025', active: true }
    ],
    documents: []
  }
];

// ── Vendor Management (Prequalification & AVL) ──────────────────────────────
export const mockVendorPrequalification = [
  {
    id: 'VEN-001',
    vendor: 'EnviroSafe Nigeria Ltd',
    rcNumber: 'RC-4187',
    category: 'Waste Disposal',
    score: '9/10',
    numericScore: 9,
    status: 'Approved',
    assessmentType: 'Full Prequalification',
    evaluator: 'Chinonso Okafor',
    email: 'procurement@ecowaste.com',
    phone: '+234 803 456 7890',
    address: '12 Industrial Estate Road, Ikeja, Lagos',
    screeningDate: '12/02/26',
    approvalDate: '28/05/25',
    productsServices: 'Licensed environmental services company specializing in industrial waste collection, transportation, recycling, and disposal.',
    approvalRemarks: 'Vendor meets all required qualification criteria. Approved for inclusion in the Approved Vendor List.',
    documents: [
      { name: 'CAC_Certificate.pdf', size: '25MB' },
      { name: 'Vendor_Quality_Assessment_Report.pdf', size: '25MB' },
      { name: 'HSE_Compliance_Assessment.pdf', size: '25MB' }
    ],
    procurementHistory: [
      { ref: 'RFQ-2026-031', description: 'Lagos Terminal Upgrade', date: '22/06/26', status: 'Awarded' },
      { ref: 'PO-2026-0142', description: 'Escravos Flow Station', date: '22/06/26', status: 'Delivered' },
      { ref: 'PO-2026-0118', description: 'Bonny Gas Expansion', date: '24/07/26', status: 'Closed' }
    ]
  },
  {
    id: 'VEN-002',
    vendor: 'Dangote Industries',
    rcNumber: 'RC-11029',
    category: 'Cement Supplier',
    score: '9/10',
    numericScore: 9,
    status: 'Pending Approval',
    assessmentType: 'Full Prequalification',
    evaluator: 'Chinonso Okafor',
    email: 'sales@dangoteindustries.com',
    phone: '+234 1 448 0815',
    address: '1 Alfred Rewane Road, Ikoyi, Lagos',
    screeningDate: '18/03/26',
    approvalDate: '',
    productsServices: 'Manufacturer and bulk distributor of certified 42.5R Portland cement for deep marine and civil construction.',
    approvalRemarks: '',
    documents: [
      { name: 'CAC_Certificate.pdf', size: '20MB' },
      { name: 'ISO_Quality_Certificate.pdf', size: '15MB' }
    ],
    procurementHistory: []
  },
  {
    id: 'VEN-003',
    vendor: 'SafetyPlus Ltd',
    rcNumber: 'RC-89240',
    category: 'Steel Supplier',
    score: '9/10',
    numericScore: 9,
    status: 'Approved',
    assessmentType: 'Full Prequalification',
    evaluator: 'Zainab Mohammed',
    email: 'info@safetyplus.ng',
    phone: '+234 802 333 4455',
    address: 'Plot 4 Trans Amadi Industrial Layout, Port Harcourt',
    screeningDate: '05/01/26',
    approvalDate: '28/05/25',
    productsServices: 'Supplier of structural I-beams, piping supports, offshore scaffolding, and heavy steel fabrication sections.',
    approvalRemarks: 'Quality audits verified. High reliability score.',
    documents: [
      { name: 'CAC_Certificate.pdf', size: '18MB' }
    ],
    procurementHistory: []
  },
  {
    id: 'VEN-004',
    vendor: 'Delta Tech Services',
    rcNumber: 'RC-55421',
    category: 'Equipment Supplier',
    score: '9/10',
    numericScore: 9,
    status: 'Pending Approval',
    assessmentType: 'Desktop Assessment',
    evaluator: 'Chinonso Okafor',
    email: 'contact@deltatech.ng',
    phone: '+234 814 778 9900',
    address: 'Effurun Roundabout, Warri, Delta State',
    screeningDate: '20/04/26',
    approvalDate: '',
    productsServices: 'Rotating equipment, industrial air compressor parts, and OEM spares distribution.',
    approvalRemarks: '',
    documents: [],
    procurementHistory: []
  },
  {
    id: 'VEN-005',
    vendor: 'Delta Tech Services',
    rcNumber: 'RC-55421-B',
    category: 'Calibration Services',
    score: '9/10',
    numericScore: 9,
    status: 'Pending Approval',
    assessmentType: 'Full Prequalification',
    evaluator: 'Zainab Mohammed',
    email: 'calib@deltatech.ng',
    phone: '+234 814 778 9901',
    address: 'Warri, Delta State',
    screeningDate: '22/04/26',
    approvalDate: '',
    productsServices: 'Onsite gauge calibration and laboratory pressure test validation.',
    approvalRemarks: '',
    documents: [],
    procurementHistory: []
  },
  {
    id: 'VEN-006',
    vendor: 'Delta Tech Services',
    rcNumber: 'RC-55421-C',
    category: 'Waste Disposal',
    score: '6/10',
    numericScore: 6,
    status: 'Rejected',
    assessmentType: 'Desktop Assessment',
    evaluator: 'Chinonso Okafor',
    email: 'waste@deltatech.ng',
    phone: '+234 814 778 9902',
    address: 'Warri, Delta State',
    screeningDate: '10/05/26',
    approvalDate: '',
    productsServices: 'Waste evacuation and oil sludge treatment.',
    approvalRemarks: '',
    rejectionReason: 'Failed EPA and state ministry environmental licensing compliance audit.',
    documents: [],
    procurementHistory: []
  },
  {
    id: 'VEN-007',
    vendor: 'Delta Tech Services',
    rcNumber: 'RC-55421-D',
    category: 'Inspection & Certification',
    score: '9/10',
    numericScore: 9,
    status: 'Approved',
    assessmentType: 'Full Prequalification',
    evaluator: 'Chinonso Okafor',
    email: 'inspect@deltatech.ng',
    phone: '+234 814 778 9903',
    address: 'Warri, Delta State',
    screeningDate: '01/02/26',
    approvalDate: '28/05/25',
    productsServices: 'NDT inspection, lifting gear certification, and wall thickness measurement.',
    approvalRemarks: 'Certified by DPR and NUPRC.',
    documents: [],
    procurementHistory: []
  }
];

export const mockApprovedVendors = [
  {
    id: 'VEN-001',
    vendor: 'EnviroSafe Nigeria Ltd',
    category: 'Waste Disposal',
    approvalDate: '28/05/25',
    status: 'Active',
    rcNumber: 'RC-4187',
    evaluator: 'Chinonso Okafor',
    phone: '+234 803 456 7890',
    email: 'procurement@ecowaste.com',
    address: '12 Industrial Estate Road, Ikeja, Lagos'
  },
  {
    id: 'VEN-002',
    vendor: 'Dangote Industries',
    category: 'Cement Supplier',
    approvalDate: '28/05/25',
    status: 'Suspended',
    rcNumber: 'RC-11029',
    evaluator: 'Chinonso Okafor',
    phone: '+234 1 448 0815',
    email: 'sales@dangoteindustries.com',
    address: '1 Alfred Rewane Road, Ikoyi, Lagos'
  },
  {
    id: 'VEN-003',
    vendor: 'SafetyPlus Ltd',
    category: 'Steel Supplier',
    approvalDate: '28/05/25',
    status: 'Active',
    rcNumber: 'RC-89240',
    evaluator: 'Zainab Mohammed',
    phone: '+234 802 333 4455',
    email: 'info@safetyplus.ng',
    address: 'Plot 4 Trans Amadi Industrial Layout, Port Harcourt'
  },
  {
    id: 'VEN-004',
    vendor: 'Delta Tech Services',
    category: 'Equipment Supplier',
    approvalDate: '28/05/25',
    status: 'Active',
    rcNumber: 'RC-55421',
    evaluator: 'Chinonso Okafor',
    phone: '+234 814 778 9900',
    email: 'contact@deltatech.ng',
    address: 'Effurun Roundabout, Warri, Delta State'
  },
  {
    id: 'VEN-005',
    vendor: 'Delta Tech Services',
    category: 'Calibration Services',
    approvalDate: '28/05/25',
    status: 'Suspended',
    rcNumber: 'RC-55421-B',
    evaluator: 'Zainab Mohammed',
    phone: '+234 814 778 9901',
    email: 'calib@deltatech.ng',
    address: 'Warri, Delta State'
  },
  {
    id: 'VEN-006',
    vendor: 'Delta Tech Services',
    category: 'Waste Disposal',
    approvalDate: '28/05/25',
    status: 'Suspended',
    rcNumber: 'RC-55421-C',
    evaluator: 'Chinonso Okafor',
    phone: '+234 814 778 9902',
    email: 'waste@deltatech.ng',
    address: 'Warri, Delta State'
  },
  {
    id: 'VEN-007',
    vendor: 'Delta Tech Services',
    category: 'Inspection & Certification',
    approvalDate: '28/05/25',
    status: 'Active',
    rcNumber: 'RC-55421-D',
    evaluator: 'Chinonso Okafor',
    phone: '+234 814 778 9903',
    email: 'inspect@deltatech.ng',
    address: 'Warri, Delta State'
  },
  {
    id: 'VEN-008',
    vendor: 'Delta Tech Services',
    category: 'Electrical & Instrumentation',
    approvalDate: '28/05/25',
    status: 'Inactive',
    rcNumber: 'RC-55421-E',
    evaluator: 'Chinonso Okafor',
    phone: '+234 814 778 9904',
    email: 'ei@deltatech.ng',
    address: 'Warri, Delta State'
  }
];

// ── Inventory & Warehouse ───────────────────────────────────────────────────
export const mockGoodsReceipts = [
  {
    mrnNo: 'MRN-25-001',
    poNo: 'PO-25-001',
    vendor: 'Dangote Steel Ltd.',
    material: 'Structural Steel',
    warehouse: 'Port Harcourt Yard',
    receiptDate: '28/05/25',
    inspectionStatus: 'Passed',
    deliveryRef: 'DEL-25-001',
    linkedRFQ: 'P-RFQ-25-004',
    linkedProject: 'LNG Expansion Project',
    quantity: '120 Pieces',
    inspectionNotes: 'Quantity and quality verified against the PO and delivery documents. All items met the required specifications with no defects or non-conformities identified. Delivery approved for storage',
    materialsReceived: [
      { description: 'Structural Steel Beam H200', orderedQty: 25, receivedQty: 25 },
      { description: 'Steel Connection Plates', orderedQty: 450, receivedQty: 450 },
      { description: 'High Tensile Bolts M24', orderedQty: 1200, receivedQty: 1200 }
    ],
    documents: [
      { name: 'Delivery_Document_DD-2026-0814.pdf', size: '20MB' },
      { name: 'Packing_List_PO-25-004.pdf', size: '12MB' },
      { name: 'Waybill_WB-2026-214.pdf', size: '15MB' },
      { name: 'Purchase_Order_PO-25-004.pdf', size: '18MB' },
      { name: 'Award_Letter_PO-25-004.pdf', size: '8MB' }
    ]
  },
  {
    mrnNo: 'MRN-25-002',
    poNo: 'PO-25-001',
    vendor: 'Universal Steel Ltd.',
    material: 'Reinforcement Bars',
    warehouse: 'Main Warehouse',
    receiptDate: '28/05/25',
    inspectionStatus: 'Passed',
    deliveryRef: 'DEL-25-002',
    linkedRFQ: 'P-RFQ-25-002',
    linkedProject: 'LNG Expansion Project',
    quantity: '500 Pieces',
    inspectionNotes: 'Tensile yield test passed with full compliance to British Standard BS4449.',
    materialsReceived: [
      { description: 'High Yield Rebar 16mm x 12m', orderedQty: 500, receivedQty: 500 }
    ],
    documents: [{ name: 'Inspection_Pass_Tag.pdf', size: '3MB' }]
  },
  {
    mrnNo: 'MRN-25-003',
    poNo: 'PO-25-001',
    vendor: 'Dangote Industries',
    material: 'Cement',
    warehouse: 'Port Harcourt Yard',
    receiptDate: '28/05/25',
    inspectionStatus: 'Pending',
    deliveryRef: 'DEL-25-003',
    linkedRFQ: 'P-RFQ-25-001',
    linkedProject: 'Concrete Batching Plant',
    quantity: '1,000 Bags',
    inspectionNotes: 'Awaiting 7-day cube compressive strength report from QHSE laboratory.',
    materialsReceived: [
      { description: 'Dangote Falcon Cement 42.5R', orderedQty: 1000, receivedQty: 1000 }
    ],
    documents: []
  },
  {
    mrnNo: 'MRN-25-004',
    poNo: 'PO-25-001',
    vendor: 'Flowline Engineering Ltd.',
    material: 'Reinforcement Bars',
    warehouse: 'Port Harcourt Yard',
    receiptDate: '28/05/25',
    inspectionStatus: 'Failed',
    deliveryRef: 'DEL-25-004',
    linkedRFQ: 'P-RFQ-25-003',
    linkedProject: 'Warri Facility Upgrade',
    quantity: '250 Pieces',
    inspectionNotes: 'Dimensional tolerance exceedance observed on 40% of steel bundles. Surface rust beyond acceptable limit. NCR issued.',
    materialsReceived: [
      { description: 'Rebar 20mm x 12m', orderedQty: 250, receivedQty: 250 }
    ],
    documents: [{ name: 'QHSE_NCR_Report_042.pdf', size: '9MB' }]
  }
];

export const mockInventoryStock = [
  {
    itemCode: 'MAT-001',
    itemName: 'Structural Steel',
    category: 'Construction Materials',
    availableStock: 42,
    reorderLevel: 20,
    warehouse: 'Port Harcourt Yard',
    unit: 'Tonnes',
    lastRestocked: '28/05/25',
    status: 'In Stock',
    history: [
      { date: '22/06/26', activity: 'Goods Receipt', reference: 'GRN-25-002', qty: '+500', updatedBy: 'Amina Yusuf' },
      { date: '22/06/26', activity: 'Material Issue', reference: 'MI-25-011', qty: '-20', updatedBy: 'Amina Yusuf' },
      { date: '24/07/26', activity: 'Stock Adjustment', reference: 'SA-25-003', qty: '-8', updatedBy: 'James Okoro' }
    ],
    attachments: [
      { name: 'Material_Specification_Reinforcement_Bars.pdf', size: '10MB' },
      { name: 'Manufacturer_Data_Sheet_Reinforcement_Bars.pdf', size: '14MB' },
      { name: 'Purchase_Order_PO-25-004.pdf', size: '18MB' },
      { name: 'Goods_Receipt_Note_GRN-25-002.pdf', size: '8MB' }
    ]
  },
  {
    itemCode: 'MAT-002',
    itemName: 'Reinforcement Bars',
    category: 'Construction Materials',
    availableStock: 450,
    reorderLevel: 200,
    warehouse: 'Main Warehouse',
    unit: 'Pieces',
    lastRestocked: '28/05/25',
    status: 'Low Stock',
    history: [
      { date: '28/05/25', activity: 'Goods Receipt', reference: 'MRN-25-002', qty: '+500', updatedBy: 'Chinedu Eze' }
    ],
    attachments: []
  },
  {
    itemCode: 'MAT-003',
    itemName: 'Cement',
    category: 'Civil Works',
    availableStock: 56,
    reorderLevel: 15,
    warehouse: 'Port Harcourt Yard',
    unit: 'Pieces',
    lastRestocked: '28/05/25',
    status: 'In Stock',
    history: [],
    attachments: []
  },
  {
    itemCode: 'MAT-004',
    itemName: 'Pressure Relief Valves',
    category: 'Valves & Piping',
    availableStock: 0,
    reorderLevel: 10,
    warehouse: 'Main Warehouse',
    unit: 'Pieces',
    lastRestocked: '12/04/25',
    status: 'Out of stock',
    history: [],
    attachments: []
  }
];

export const mockStockMovements = [
  {
    movementNo: 'SM-25-001',
    itemName: 'Structural Steel',
    movementType: 'Material Issue',
    from: 'Port Harcourt Yard',
    to: 'LNG Pipeline Project',
    qty: 42,
    unit: 'Tonnes',
    movementDate: '28/05/25',
    status: 'Completed',
    reorderLevel: '200 Pieces',
    remarks: 'Issued reinforcement bars for foundation works at the LNG Pipeline Project.',
    attachments: [
      { name: 'Material_Issue_Voucher_MI-25-011.pdf', size: '12MB' },
      { name: 'Approved_Material_Request_Form.pdf', size: '6MB' }
    ]
  },
  {
    movementNo: 'SM-25-002',
    itemName: 'Reinforcement Bars',
    movementType: 'Warehouse Transfer',
    from: 'Main Warehouse',
    to: 'Port Harcourt Yard',
    qty: 450,
    unit: 'Pieces',
    movementDate: '28/05/25',
    status: 'Pending',
    reorderLevel: '150 Pieces',
    remarks: 'Inter-warehouse logistics transfer for jetty construction staging.',
    attachments: []
  },
  {
    movementNo: 'SM-25-003',
    itemName: 'Cement',
    movementType: 'Material Return',
    from: 'Port Harcourt Yard',
    to: 'Main Warehouse',
    qty: 56,
    unit: 'Pieces',
    movementDate: '28/05/25',
    status: 'Completed',
    reorderLevel: '50 Pieces',
    remarks: 'Surplus bagged cement returned from completed foundation slab.',
    attachments: []
  },
  {
    movementNo: 'SM-25-004',
    itemName: 'Reinforcement Bars',
    movementType: 'Material Issue',
    from: 'Port Harcourt Yard',
    to: 'Project Site A',
    qty: 42,
    unit: 'Pieces',
    movementDate: '28/05/25',
    status: 'Completed',
    reorderLevel: '200 Pieces',
    remarks: 'Dispatched for pile cap casting.',
    attachments: []
  },
  {
    movementNo: 'SM-25-005',
    itemName: 'Reinforcement Bars',
    movementType: 'Material Issue',
    from: 'Warri Yard A',
    to: 'Warri Yard A',
    qty: 42,
    unit: 'Pieces',
    movementDate: '28/05/25',
    status: 'Pending',
    reorderLevel: '200 Pieces',
    remarks: 'Internal transfer between bay 1 and bay 4.',
    attachments: []
  }
];

// ── Procurement Documents ───────────────────────────────────────────────────
export const mockProcurementDocuments = [
  {
    docNo: 'PD-001',
    documentTitle: 'Purchase Requisition Form',
    category: 'Requisition',
    uploadedBy: 'Chinonso Okafor',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'Standard form used for internal purchase requests across all operational units.',
    accessLevel: 'All Staff',
    fileName: 'Purchase_Requisition_Form_v1.0.pdf',
    fileSize: '25MB'
  },
  {
    docNo: 'PD-002',
    documentTitle: 'Vendor Prequalification Form',
    category: 'Vendor Management',
    uploadedBy: 'Fatima Ibrahim',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'Standard form used for vendor prequalification before approval into the Approved Vendor List.',
    accessLevel: 'Procurement Team',
    fileName: 'Vendor_Prequalification_Questionnaire_v1.0.pdf',
    fileSize: '25MB'
  },
  {
    docNo: 'PD-003',
    documentTitle: 'Request for Quotation (RFQ) Template',
    category: 'Tendering',
    uploadedBy: 'Emmanuel Eze',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'Standardized RFQ invitation template with technical and commercial evaluation matrices.',
    accessLevel: 'Procurement Team',
    fileName: 'RFQ_Standard_Template_2026.docx',
    fileSize: '18MB'
  },
  {
    docNo: 'PD-004',
    documentTitle: 'Bid Evaluation Form',
    category: 'Tendering',
    uploadedBy: 'Zainab Mohammed',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'Commercial and technical bid scoring matrix used during tender board meetings.',
    accessLevel: 'Procurement Managers',
    fileName: 'Bid_Evaluation_Scoring_Sheet.xlsx',
    fileSize: '14MB'
  },
  {
    docNo: 'PD-005',
    documentTitle: 'Purchase Order Request Form',
    category: 'Purchasing',
    uploadedBy: 'Adeola Olatunji',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'PO commitment document sent to approved vendors upon bid award.',
    accessLevel: 'All Staff',
    fileName: 'Purchase_Order_Template_2026.docx',
    fileSize: '20MB'
  },
  {
    docNo: 'PD-006',
    documentTitle: 'Supplier Performance Evaluation Form',
    category: 'Vendor Management',
    uploadedBy: 'Tunde Bakare',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'Quarterly supplier KPI review form covering delivery adherence, quality, and QHSE score.',
    accessLevel: 'Procurement Team',
    fileName: 'Supplier_Performance_Audit_v2.pdf',
    fileSize: '15MB'
  },
  {
    docNo: 'PD-007',
    documentTitle: 'Material Return Form',
    category: 'Inventory',
    uploadedBy: 'Amaka Ugochukwu',
    version: 'V1.0',
    lastUpdated: '28/05/25',
    description: 'Warehouse store form for returning unused materials or rejected supplies from project sites.',
    accessLevel: 'All Staff',
    fileName: 'Material_Return_Voucher_Template.pdf',
    fileSize: '11MB'
  }
];

// ── Procurement Tasks ───────────────────────────────────────────────────────
export const mockProcurementTasks = [
  {
    taskId: 'PRO-TSK-001',
    task: 'Review RFQ submissions',
    assignedTo: 'Chinonso Eze',
    relatedTo: 'RFQ-2026-031',
    priority: 'High',
    dueDate: '28/05/25',
    startDate: '12/02/25',
    status: 'To Do',
    description: 'Review vendor quotations and prepare recommendation for evaluation.',
    documents: [
      { name: 'RFQ_2026_031_Steel_Supply.pdf', size: '18MB' },
      { name: 'RFQ_Bid_Submission_Guidelines.pdf', size: '8MB' }
    ]
  },
  {
    taskId: 'PRO-TSK-002',
    task: 'Prepare Purchase Order',
    assignedTo: 'Femi Adeyemi',
    relatedTo: 'PR-2026-042',
    priority: 'Medium',
    dueDate: '28/05/25',
    startDate: '20/05/25',
    status: 'To Do',
    description: 'Generate and dispatch official PO following budget committee approval.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-003',
    task: 'Complete vendor prequalification',
    assignedTo: 'Zainab Mohammed',
    relatedTo: 'VEN-018',
    priority: 'Medium',
    dueDate: '28/05/25',
    startDate: '15/05/25',
    status: 'In Progress',
    description: 'Review CAC, DPR permits and financial audit statements for new marine vendor.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-004',
    task: 'Follow up supplier delivery',
    assignedTo: 'Tolu Afolabi',
    relatedTo: 'PO-2026-0142',
    priority: 'High',
    dueDate: '28/05/25',
    startDate: '10/05/25',
    status: 'In Progress',
    description: 'Expedite shipment status with logistics agent for offshore delivery to Platform B.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-005',
    task: 'Follow up supplier delivery',
    assignedTo: 'Kelechi Okafor',
    relatedTo: 'PO-2026-0142',
    priority: 'Low',
    dueDate: '28/05/25',
    startDate: '12/05/25',
    status: 'In Progress',
    description: 'Track vessel loading schedule at Port Harcourt quayside.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-006',
    task: 'Follow up supplier delivery',
    assignedTo: 'Amira Bello',
    relatedTo: 'PO-2026-0142',
    priority: 'Hot',
    dueDate: '28/05/25',
    startDate: '01/05/25',
    status: 'Done',
    description: 'Delivery received and signed off at terminal storage warehouse.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-007',
    task: 'Follow up supplier delivery',
    assignedTo: 'Ifeoma Nwosu',
    relatedTo: 'PO-2026-0142',
    priority: 'High',
    dueDate: '28/05/25',
    startDate: '08/05/25',
    status: 'Done',
    description: 'Clearance completed through customs with bonded agent.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-008',
    task: 'Follow up supplier delivery',
    assignedTo: 'Sadiq Yusuf',
    relatedTo: 'PO-2026-0142',
    priority: 'Low',
    dueDate: '28/05/25',
    startDate: '10/05/25',
    status: 'Done',
    description: 'Archived delivery docket into EDMS system.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-009',
    task: 'Follow up supplier delivery',
    assignedTo: 'Olamide Adeshina',
    relatedTo: 'PO-2026-0142',
    priority: 'High',
    dueDate: '28/05/25',
    startDate: '05/05/25',
    status: 'Overdue',
    description: 'Vendor delayed notification notice pending executive escalation.',
    documents: []
  },
  {
    taskId: 'PRO-TSK-010',
    task: 'Follow up supplier delivery',
    assignedTo: 'Fatimah Ibrahim',
    relatedTo: 'PO-2026-0142',
    priority: 'Medium',
    dueDate: '28/05/25',
    startDate: '04/05/25',
    status: 'Overdue',
    description: 'Expedite overdue replacement of defective heat exchanger tubes.',
    documents: []
  }
];

// ── Procurement Reports & Analytics ─────────────────────────────────────────
export const mockProcurementAnalytics = {
  kpis: {
    totalPipelineValue: '₦2.62B',
    pipelineGrowth: '+8% vs last year',
    opportunityConversion: '61%',
    conversionGrowth: '+4.2% vs Q1 average',
    rfqProposalSuccess: '57%',
    proposalPrecision: '+1.5% higher drawing precision',
    teamTasksResolved: '12/20',
    taskAlert: '1 critical bidding delays'
  },
  monthlyRevenueWon: [
    { month: 'Jan', awarded: 35, pipeline: 65 },
    { month: 'Feb', awarded: 75, pipeline: 110 },
    { month: 'Mar', awarded: 95, pipeline: 155 },
    { month: 'Apr', awarded: 185, pipeline: 85 },
    { month: 'May', awarded: 60, pipeline: 130 },
    { month: 'Jun', awarded: 145, pipeline: 55 }
  ],
  rfqPerformance: {
    submittedRfqs: 42,
    rfqValueYtd: '₦52.6M',
    statusDistribution: [
      { label: 'Pending Assessment', count: 1, value: '₦12M' },
      { label: 'In Formulation', count: 2, value: '₦12M' },
      { label: 'Under Review', count: 3, value: '₦12M' },
      { label: 'Submitted & Active', count: 1, value: '₦12M' }
    ]
  },
  commercialConversion: [
    { stage: 'Lead Intake (100%)', count: 32, pct: 100, color: '#1E40AF' },
    { stage: 'Qualified (75%)', count: 24, pct: 75, color: '#7C3AED' },
    { stage: 'Proposal Sent (45%)', count: 14, pct: 45, color: '#2563EB' },
    { stage: 'Negotiation (27%)', count: 9, pct: 27, color: '#D97706' },
    { stage: 'Won (16%)', count: 5, pct: 16, color: '#16A34A' },
    { stage: 'Lost (2%)', count: 1, pct: 2, color: '#DC2626' }
  ],
  tenderOutcome: {
    overallBidsWon: 4,
    totalBidsTracked: 10,
    awaitingDecision: 1,
    categories: [
      { label: 'Under Review (2)', amount: '₦20.6M', color: '#3B82F6' },
      { label: 'Submitted (2)', amount: '₦59.0M', color: '#8B5CF6' },
      { label: 'Awaiting Decision (4)', amount: '₦10.8M', color: '#F59E0B' },
      { label: 'Awarded (2)', amount: '₦47.0M', color: '#10B981' },
      { label: 'Lost (1)', amount: '₦12.2M', color: '#EF4444' }
    ]
  }
};
