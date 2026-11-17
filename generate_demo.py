from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import FrameBreak

OUTPUT = r"c:\Users\HP\OneDrive\Desktop\erp\ERP_Demo_Script.pdf"

# ── Colour palette ──────────────────────────────────────────────────────────
NAVY      = colors.HexColor("#1E3A8A")
BLUE      = colors.HexColor("#2563EB")
LIGHTBLUE = colors.HexColor("#EFF6FF")
GREEN     = colors.HexColor("#166534")
LIGHTGREEN= colors.HexColor("#F0FDF4")
AMBER     = colors.HexColor("#92400E")
LIGHTAMBER= colors.HexColor("#FFFBEB")
RED       = colors.HexColor("#991B1B")
LIGHTRED  = colors.HexColor("#FEF2F2")
SLATE     = colors.HexColor("#475569")
LIGHTSLATE= colors.HexColor("#F8FAFC")
BORDER    = colors.HexColor("#E2E8F0")
BLACK     = colors.HexColor("#0F172A")
GREY      = colors.HexColor("#64748B")
WHITE     = colors.white

PAGE_W, PAGE_H = A4
L_MARGIN = R_MARGIN = 2.0 * cm
T_MARGIN = B_MARGIN = 2.0 * cm

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=L_MARGIN,
    rightMargin=R_MARGIN,
    topMargin=T_MARGIN,
    bottomMargin=B_MARGIN,
    title="ERP Demo Script — HSE, Quality System & Procurement",
    author="Kiro",
)

# ── Styles ───────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

sTitle = S("sTitle", fontSize=26, fontName="Helvetica-Bold",
           textColor=WHITE, alignment=TA_CENTER, spaceAfter=4)
sSubtitle = S("sSubtitle", fontSize=12, fontName="Helvetica",
              textColor=colors.HexColor("#BFDBFE"), alignment=TA_CENTER, spaceAfter=2)
sSmall = S("sSmall", fontSize=9, fontName="Helvetica",
           textColor=colors.HexColor("#93C5FD"), alignment=TA_CENTER)

sModuleTitle = S("sModuleTitle", fontSize=18, fontName="Helvetica-Bold",
                 textColor=WHITE, spaceBefore=4, spaceAfter=2)
sModuleSub   = S("sModuleSub", fontSize=10, fontName="Helvetica",
                 textColor=colors.HexColor("#BFDBFE"), spaceAfter=0)

sSectionHead = S("sSectionHead", fontSize=13, fontName="Helvetica-Bold",
                 textColor=NAVY, spaceBefore=14, spaceAfter=4)
sStepHead    = S("sStepHead", fontSize=11, fontName="Helvetica-Bold",
                 textColor=BLUE, spaceBefore=10, spaceAfter=3)
sBody        = S("sBody", fontSize=9.5, fontName="Helvetica",
                 textColor=BLACK, leading=14, spaceAfter=4, alignment=TA_JUSTIFY)
sBullet      = S("sBullet", fontSize=9.5, fontName="Helvetica",
                 textColor=BLACK, leading=13, leftIndent=14, spaceAfter=2)
sNote        = S("sNote", fontSize=9, fontName="Helvetica-Oblique",
                 textColor=SLATE, leading=13, leftIndent=10, spaceAfter=6)
sLabel       = S("sLabel", fontSize=8, fontName="Helvetica-Bold",
                 textColor=GREY, spaceAfter=0)
sTH          = S("sTH", fontSize=8.5, fontName="Helvetica-Bold",
                 textColor=WHITE, alignment=TA_CENTER)
sTD          = S("sTD", fontSize=8.5, fontName="Helvetica", textColor=BLACK)
sTDc         = S("sTDc", fontSize=8.5, fontName="Helvetica",
                 textColor=BLACK, alignment=TA_CENTER)
sTOCHead     = S("sTOCHead", fontSize=10, fontName="Helvetica-Bold",
                 textColor=NAVY, spaceAfter=2)
sTOCItem     = S("sTOCItem", fontSize=9.5, fontName="Helvetica",
                 textColor=BLACK, leftIndent=10, spaceAfter=1)
sQuote       = S("sQuote", fontSize=9.5, fontName="Helvetica-Oblique",
                 textColor=GREEN, leftIndent=16, rightIndent=16,
                 leading=14, spaceAfter=6)
sConseq      = S("sConseq", fontSize=9, fontName="Helvetica",
                 textColor=RED, leftIndent=10, leading=13, spaceAfter=4)

# ── Helpers ───────────────────────────────────────────────────────────────────
def hr(color=BORDER, thickness=0.75, spaceB=4, spaceA=4):
    return HRFlowable(width="100%", thickness=thickness,
                      color=color, spaceAfter=spaceA, spaceBefore=spaceB)

def coloured_header(text, sub, bg, text_col=WHITE, sub_col=None):
    sub_col = sub_col or colors.HexColor("#BFDBFE")
    data = [[Paragraph(text, S("ch", fontSize=15, fontName="Helvetica-Bold",
                                textColor=text_col)),
             Paragraph(sub,  S("cs", fontSize=9,  fontName="Helvetica",
                                textColor=sub_col))]]
    t = Table(data, colWidths=[PAGE_W - L_MARGIN - R_MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("RIGHTPADDING",  (0,0), (-1,-1), 14),
        ("ROUNDEDCORNERS", [6]),
    ]))
    return t

def form_table(rows, accent=BLUE):
    """rows = list of (field_label, example_value)"""
    tdata = [[Paragraph("Field", sTH), Paragraph("Example Value", sTH)]]
    for label, val in rows:
        tdata.append([
            Paragraph(label, S("fl", fontSize=8.5, fontName="Helvetica-Bold",
                                textColor=SLATE)),
            Paragraph(str(val), sTD),
        ])
    cw = [(PAGE_W - L_MARGIN - R_MARGIN) * f for f in (0.35, 0.65)]
    t = Table(tdata, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), accent),
        ("BACKGROUND",    (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHTSLATE]),
        ("GRID",          (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t

def summary_table(rows):
    """rows = list of (stage, screen, output) for the pipeline summary"""
    tdata = [[Paragraph(h, sTH) for h in ("Stage", "Screen", "Key Output")]]
    for r in rows:
        tdata.append([Paragraph(c, sTD) for c in r])
    cw = [(PAGE_W - L_MARGIN - R_MARGIN) * f for f in (0.28, 0.38, 0.34)]
    t = Table(tdata, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), NAVY),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHTSLATE]),
        ("GRID",          (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t

def kpi_table(rows, accent=BLUE):
    """rows = list of (label, value, description)"""
    tdata = [[Paragraph(h, sTH) for h in ("KPI Tile", "Display Value", "Description")]]
    for r in rows:
        tdata.append([Paragraph(c, sTD) for c in r])
    cw = [(PAGE_W - L_MARGIN - R_MARGIN) * f for f in (0.30, 0.20, 0.50)]
    t = Table(tdata, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), accent),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHTSLATE]),
        ("GRID",          (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t

def note_box(text, tone="blue"):
    bg   = {"blue": LIGHTBLUE, "green": LIGHTGREEN,
            "amber": LIGHTAMBER, "red": LIGHTRED}.get(tone, LIGHTBLUE)
    tc   = {"blue": BLUE, "green": GREEN,
            "amber": AMBER, "red": RED}.get(tone, BLUE)
    sty  = S("nb", fontSize=9, fontName="Helvetica-Oblique",
              textColor=tc, leading=13)
    t = Table([[Paragraph(text, sty)]],
              colWidths=[PAGE_W - L_MARGIN - R_MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), bg),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("BOX",           (0,0), (-1,-1), 0.5, tc),
        ("ROUNDEDCORNERS",[5]),
    ]))
    return t

def bullet(text):
    return Paragraph(f"• {text}", sBullet)

def step(number, title):
    return Paragraph(f"Step {number} — {title}", sStepHead)

def section(title):
    return Paragraph(title, sSectionHead)

def body(text):
    return Paragraph(text, sBody)

def SP(n=6):
    return Spacer(1, n)


# ═══════════════════════════════════════════════════════════════════════════════
# BUILD STORY
# ═══════════════════════════════════════════════════════════════════════════════
story = []

# ── COVER PAGE ────────────────────────────────────────────────────────────────
cover_w = PAGE_W - L_MARGIN - R_MARGIN
cover = Table(
    [[Paragraph("ERP SYSTEM", S("ct", fontSize=11, fontName="Helvetica-Bold",
                                 textColor=colors.HexColor("#93C5FD"),
                                 alignment=TA_CENTER))],
     [Paragraph("Demo Script", S("ct2", fontSize=30, fontName="Helvetica-Bold",
                                   textColor=WHITE, alignment=TA_CENTER))],
     [Spacer(1, 6)],
     [Paragraph("HSE Module  •  Quality System Module  •  Procurement Module",
                S("ct3", fontSize=12, fontName="Helvetica",
                  textColor=colors.HexColor("#BFDBFE"), alignment=TA_CENTER))],
     [Spacer(1, 20)],
     [Paragraph("Complete walkthrough with descriptive narrative and form input examples",
                S("ct4", fontSize=10, fontName="Helvetica-Oblique",
                  textColor=colors.HexColor("#93C5FD"), alignment=TA_CENTER))],
    ],
    colWidths=[cover_w],
)
cover.setStyle(TableStyle([
    ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
    ("TOPPADDING",    (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("LEFTPADDING",   (0, 0), (-1, -1), 24),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 24),
    ("ROUNDEDCORNERS",[10]),
]))
story.append(Spacer(1, 2*cm))
story.append(cover)
story.append(Spacer(1, 1*cm))

# meta strip
meta_rows = [
    ("Audience", "Client stakeholders, management, end users"),
    ("Total Duration", "~75 – 90 minutes (all three modules)"),
    ("Format", "Live walkthrough on the running application"),
    ("Scenario", "Pipetech Engineering Services Ltd — Offshore inspection programme"),
]
meta_data = [[Paragraph(k, S("mk", fontSize=8.5, fontName="Helvetica-Bold",
                               textColor=SLATE)),
              Paragraph(v, S("mv", fontSize=8.5, fontName="Helvetica",
                               textColor=BLACK))]
             for k, v in meta_rows]
mt = Table(meta_data, colWidths=[cover_w*0.30, cover_w*0.70])
mt.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), LIGHTSLATE),
    ("GRID",          (0,0), (-1,-1), 0.4, BORDER),
    ("TOPPADDING",    (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
]))
story.append(mt)
story.append(Spacer(1, 0.6*cm))
story.append(body(
    "This document provides a complete, descriptive walkthrough of three ERP modules: "
    "Health, Safety & Environment (HSE); Quality Management System (QMS); and Procurement. "
    "Each section covers the purpose of the screen, the user journey step by step, and "
    "realistic form input examples drawn from an offshore engineering services context."
))
story.append(PageBreak())

# ── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
story.append(Paragraph("Table of Contents", sSectionHead))
story.append(hr(NAVY, 1.2))
story.append(SP(4))
toc = [
    ("PART 1 — HSE MODULE", [
        "1.1  Offshore Travel Documents",
        "1.2  Emergency Preparedness",
        "1.3  HSE Documents",
        "1.4  HSE Tasks",
        "1.5  HSE Reports",
    ]),
    ("PART 2 — QUALITY SYSTEM MODULE", [
        "2.1  Audit Management",
        "2.2  Calibration Records",
        "2.3  Materials Inspection",
        "2.4  QMS Documents",
        "2.5  Quality Tasks",
        "2.6  Quality Reports",
    ]),
    ("PART 3 — PROCUREMENT MODULE", [
        "3.1  Vendor Management",
        "3.2  Purchase Requests (Requisition Tracker)",
        "3.3  RFQ / RFP Management",
        "3.4  Purchase Orders",
        "3.5  Expediting Delivery",
        "3.6  Inventory & Warehouse — Material Receiving",
        "3.7  Quality → Materials Inspection",
        "3.8  Procurement Reports",
    ]),
]
for head, items in toc:
    story.append(Paragraph(head, sTOCHead))
    for item in items:
        story.append(Paragraph(item, sTOCItem))
    story.append(SP(4))
story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# PART 1 — HSE
# ══════════════════════════════════════════════════════════════════════════════
story.append(coloured_header(
    "PART 1 — HEALTH, SAFETY & ENVIRONMENT (HSE)",
    "Offshore certificate tracking • Emergency preparedness • HSE documents & tasks • Performance reports",
    NAVY,
))
story.append(SP(8))
story.append(body(
    "The HSE module gives the HSE team a single place to manage regulatory compliance for offshore "
    "personnel, maintain emergency response plans and contacts, control the HSE document library, "
    "assign and track workstream tasks, and monitor overall performance through a live report dashboard."
))
story.append(SP(4))

# 1.1 Offshore Travel Documents
story.append(section("1.1  Offshore Travel Documents"))
story.append(body(
    "Every employee who travels offshore must hold valid, verified safety certificates. This screen "
    "tracks those certificates across all employees, enforces verification before travel, and "
    "automatically flags certificates that are approaching expiry or have already expired."
))
story.append(SP(4))
story.append(Paragraph("Supported document types:", sLabel))
story.append(bullet("BOSIET (Basic Offshore Safety Induction & Emergency Training)"))
story.append(bullet("Offshore Safety Permit (OSP)"))
story.append(bullet("Offshore Safety Training Certificate"))
story.append(SP(6))
story.append(Paragraph("Status lifecycle:", sLabel))
story.append(bullet("Pending Verification  →  Valid  →  Expiring Soon  →  Expired"))
story.append(bullet("Any certificate can be Rejected (with a recorded reason)"))
story.append(SP(8))
story.append(Paragraph("Form Input Example — Adding a New Certificate", sStepHead))
story.append(form_table([
    ("Employee",          "Chidi Nwachukwu"),
    ("Department",        "Offshore Operations (auto-filled from employee record)"),
    ("Document type",     "BOSIET"),
    ("Certificate no",    "BOS-2025-NG-04481"),
    ("Issuing body",      "Falck Safety Services Nigeria"),
    ("Issue date",        "15 January 2025"),
    ("Expiry date",       "14 January 2028"),
    ("Attachment",        "Scanned certificate PDF — BOSIET_ChidiNwachukwu_2025.pdf"),
], BLUE))
story.append(SP(6))
story.append(note_box(
    "Demonstration tip: After creating the record it lands in Pending Verification. "
    "Show the Verify action — an HSE officer confirms the document is legitimate and the status "
    "moves to Valid. Then show the Reject flow with a reason: 'Certificate number does not match "
    "the issuing body register.' The rejection reason is permanently logged.",
    "blue"
))
story.append(SP(6))
story.append(Paragraph("Key things to highlight:", sLabel))
story.append(bullet("Choosing an employee auto-populates their department — no duplicate entry."))
story.append(bullet("Expiry logic is automatic: the system flips status to Expiring Soon (30 days before) then Expired with no manual action."))
story.append(bullet("Filter by status (e.g. all Expired) and export to Excel or PDF for management review."))
story.append(bullet("No valid certificate = travel blocked. The system enforces this gate."))
story.append(SP(4))

# 1.2 Emergency Preparedness
story.append(section("1.2  Emergency Preparedness"))
story.append(body(
    "Two tabs: Emergency Plans and Contact Register. Plans capture what the company will do in "
    "each emergency scenario. The Contact Register holds the people to call, available 24/7."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — New Emergency Plan", sStepHead))
story.append(form_table([
    ("Title",           "Oil Spill Response Plan — Port Harcourt Base"),
    ("Category",        "Environmental"),
    ("Status",          "Active"),
    ("Effective date",  "1 March 2025"),
    ("Review date",     "28 February 2026"),
    ("Attachment",      "OilSpillResponsePlan_v3.pdf"),
], colors.HexColor("#B45309")))
story.append(SP(6))
story.append(Paragraph("Form Input Example — New Emergency Contact", sStepHead))
story.append(form_table([
    ("Name",            "Dr. Amaka Eze"),
    ("Role",            "Company Medical Officer"),
    ("Phone",           "+234 803 456 7890"),
    ("Available 24/7",  "Yes"),
    ("Category",        "Medical"),
], colors.HexColor("#B45309")))
story.append(SP(6))
story.append(note_box(
    "Demonstration tip: Show the review scheduling — plans with a review date in the past "
    "are flagged 'Due for Review' automatically. Point out how the Contact Register is "
    "grouped by category so responders find the right contact instantly under pressure.",
    "amber"
))
story.append(SP(4))

# 1.3 HSE Documents
story.append(section("1.3  HSE Documents"))
story.append(body(
    "A controlled document library for all HSE compliance material — Permit to Work procedures, "
    "safety data sheets, JSAs, method statements. Documents are soft-retrieved rather than "
    "permanently deleted, maintaining a full record that the document existed."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Uploading a Document", sStepHead))
story.append(form_table([
    ("Title",         "Permit to Work — Hot Work Procedure"),
    ("Category",      "HSE Document (default)"),
    ("Attachment",    "PTW_HotWork_Procedure_Rev4.pdf"),
], BLUE))
story.append(SP(4))
story.append(bullet("All employees with access can download the latest version at any time."))
story.append(bullet("Retrieve action removes the document from circulation without permanently deleting it."))
story.append(SP(4))

# 1.4 HSE Tasks
story.append(section("1.4  HSE Tasks"))
story.append(body(
    "A task tracker scoped to the HSE team for corrective actions, certificate renewal follow-ups, "
    "incident close-outs, and any other HSE workstream items."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Creating an HSE Task", sStepHead))
story.append(form_table([
    ("Title",       "Chase BOSIET renewal — Chidi Nwachukwu"),
    ("Assignee",    "Ngozi Ibe (HSE Officer)"),
    ("Priority",    "High"),
    ("Start date",  "Today"),
    ("Due date",    "10 days from today"),
    ("Attachment",  "Expiry notification email screenshot"),
], BLUE))
story.append(SP(4))
story.append(bullet("Overdue tasks are highlighted in red in the list view."))
story.append(bullet("Tasks feed into the HSE Reports dashboard (resolved vs. total vs. overdue)."))
story.append(SP(4))

# 1.5 HSE Reports
story.append(section("1.5  HSE Reports"))
story.append(body(
    "A live performance dashboard summarising the entire HSE module — certificate compliance, "
    "emergency preparedness, and team task health — in one screen."
))
story.append(SP(4))
story.append(kpi_table([
    ("Certificate Compliance Rate", "92%",   "% of offshore travel certificates currently valid"),
    ("Expired Certificates",        "3",     "Count shown in red when non-zero"),
    ("Active Emergency Plans",      "7",     "Plans currently in force"),
    ("Team Tasks Resolved",         "18/22", "4 overdue shown in red"),
], BLUE))
story.append(SP(6))
story.append(bullet("Monthly Certificates chart: submitted vs. verified over the last 6 months."))
story.append(bullet("Certificate status breakdown by type (BOSIET, OSP, etc.) and by status."))
story.append(bullet("Verification funnel: how many submitted certificates reach Valid and where they stall."))
story.append(bullet("Emergency Preparedness summary: active plans, plans due for review, contacts on file."))
story.append(bullet("Export to Excel or PDF available directly from the page."))
story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# PART 2 — QUALITY SYSTEM
# ══════════════════════════════════════════════════════════════════════════════
story.append(coloured_header(
    "PART 2 — QUALITY MANAGEMENT SYSTEM (QMS)",
    "Audit management • Calibration records • Materials inspection • QMS documents & reports",
    colors.HexColor("#065F46"),
))
story.append(SP(8))
story.append(body(
    "The Quality System module provides the tools to plan and close out quality audits, maintain "
    "a register of calibrated instruments, inspect materials arriving from vendors, and manage the "
    "QMS document library — all with a full audit trail and built-in consequence logic."
))
story.append(SP(4))

# 2.1 Audit Management
story.append(section("2.1  Audit Management"))
story.append(body(
    "Schedules and tracks quality audits from planning through close-out. Supports Internal Quality "
    "Audits, External Client Audits, Supplier/Vendor Audits, and ISO Audits."
))
story.append(SP(4))
story.append(Paragraph("Audit status lifecycle:", sLabel))
story.append(bullet("Scheduled  →  In Progress  →  Completed  →  Closed"))
story.append(bullet("Overdue (auto-set when end date passes without completion)"))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Scheduling a New Audit", sStepHead))
story.append(form_table([
    ("Audit type",      "Internal Quality Audit"),
    ("Audit title",     "Q3 2025 Internal Audit — Offshore Operations Dept"),
    ("Department",      "Offshore Operations"),
    ("Location",        "Port Harcourt Base"),
    ("Lead auditor",    "Taiwo Adeyemi (QA Manager)"),
    ("Start date",      "14 July 2025"),
    ("End date",        "18 July 2025"),
    ("Audit objective", "Verify compliance with ISO 9001:2015 Clause 8 — Operations control, "
                        "including inspection procedures, calibration records, and non-conformance "
                        "management for the offshore inspection programme."),
    ("Related vendor",  "— (not applicable for internal audit)"),
    ("Attachment",      "Q3_2025_Audit_Checklist_Operations.xlsx"),
], colors.HexColor("#065F46")))
story.append(SP(6))
story.append(note_box(
    "Demonstration tip: After creating (status = Scheduled), click Start — status moves to "
    "In Progress. When fieldwork is done, click Complete. This unlocks the Upload Audit Report "
    "action — attach the final report PDF. After findings are closed out, click Close. "
    "Show that Completed audits without a report attached still appear in the reports page "
    "as a gap in the audit funnel.",
    "green"
))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Supplier Audit", sStepHead))
story.append(form_table([
    ("Audit type",      "Supplier/Vendor Audit"),
    ("Audit title",     "Supplier Quality Audit — SGS Nigeria Ltd"),
    ("Department",      "Quality Assurance"),
    ("Location",        "SGS Nigeria Facility, Victoria Island, Lagos"),
    ("Lead auditor",    "Taiwo Adeyemi (QA Manager)"),
    ("Start date",      "5 August 2025"),
    ("End date",        "6 August 2025"),
    ("Audit objective", "Assess SGS Nigeria Ltd's calibration laboratory procedures and "
                        "quality management system prior to framework contract renewal."),
    ("Related vendor",  "SGS Nigeria Ltd"),
    ("Attachment",      "SGS_Supplier_Audit_Checklist.pdf"),
], colors.HexColor("#065F46")))
story.append(SP(4))

# 2.2 Calibration Records
story.append(section("2.2  Calibration Records"))
story.append(body(
    "A permanent register of every measuring and testing instrument owned by the company. "
    "You register each instrument once, then log calibration events against it over time. "
    "The system tracks the calibration schedule and flags instruments automatically."
))
story.append(SP(4))
story.append(Paragraph("Instrument status lifecycle:", sLabel))
story.append(bullet("Valid (green) — calibration is current"))
story.append(bullet("Due Soon (amber) — next due date is within the warning window"))
story.append(bullet("Overdue (red) — next due date has passed"))
story.append(bullet("Out of Service (slate) — removed from active use with a recorded reason"))
story.append(SP(4))
story.append(Paragraph("Supported instrument types:", sLabel))
story.append(bullet(
    "Pressure Gauge • Temperature Gauge • Ultrasonic Thickness Gauge • Torque Wrench • "
    "Multimeter • Coating Thickness Gauge • Gas Detector • Hardness Tester"
))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Registering a New Instrument", sStepHead))
story.append(form_table([
    ("Instrument type",      "Ultrasonic Thickness Gauge"),
    ("Instrument name",      "Olympus 38DL Plus — Unit 1"),
    ("Serial number",        "38DLP-SN-20250074"),
    ("Manufacturer / model", "Olympus / 38DL Plus"),
    ("Storage location",     "Offshore Operations Warehouse, Port Harcourt"),
    ("Custodian",            "Emeka Okafor (Inspection Lead)"),
    ("Calibration frequency","Annual"),
    ("Last calibrated",      "20 June 2025"),
    ("Next due",             "20 June 2026 (auto-calculated)"),
], colors.HexColor("#065F46")))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Logging a Calibration Event", sStepHead))
story.append(form_table([
    ("Instrument",        "38DLP-SN-20250074 — Olympus 38DL Plus Unit 1 (searched and selected)"),
    ("Calibration date",  "20 June 2025"),
    ("Calibrated by",     "SGS Nigeria Calibration Laboratory, Lagos"),
    ("Next due date",     "20 June 2026 (suggested from Annual frequency, editable)"),
    ("Certificate no",    "SGS-CAL-2025-0892"),
    ("Calibration result","Pass"),
    ("Certificate file",  "SGS_CalibrationCert_38DLP_SN20250074_Jun2025.pdf"),
], colors.HexColor("#065F46")))
story.append(SP(6))
story.append(note_box(
    "When to create a calibration record: register a new instrument whenever a measuring or "
    "testing instrument is purchased and put into service. Think of it as the company's permanent "
    "equipment list — you register it once and log every calibration event against it going forward.",
    "green"
))
story.append(SP(4))

# 2.3 Materials Inspection
story.append(section("2.3  Materials Inspection"))
story.append(body(
    "Records are created automatically in the Procurement module when a Goods Receipt (MRN) is "
    "logged. The Quality team then inspects the goods and records a Pass or Fail decision. "
    "This screen is the Quality team's view of those same records."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Recording an Inspection Decision", sStepHead))
story.append(form_table([
    ("Receipt (auto-filled)",    "MRN-2025-0074 — PO-2025-0128"),
    ("Vendor (auto-filled)",     "SGS Nigeria Ltd"),
    ("Line 1 description",       "Olympus 38DL Plus Ultrasonic Thickness Gauge"),
    ("Ordered qty",              "5 (from PO, locked)"),
    ("Received qty",             "5 (inspector confirms)"),
    ("Inspection status",        "Passed"),
    ("Inspection notes",         "All 5 units received intact. Serial numbers verified against "
                                  "SGS packing list (SGS-PL-2025-0107). No physical damage "
                                  "observed. Units will be registered in Calibration Records "
                                  "before offshore deployment."),
    ("Delivery document",        "SGS_PackingList_DeliveryNote_MRN20250074.pdf"),
], colors.HexColor("#065F46")))
story.append(SP(6))
story.append(note_box(
    "Pass consequence: received quantities are booked into stock automatically for all lines "
    "linked to an inventory item.\n\n"
    "Fail consequence: nothing goes to stock — the vendor's failed-inspection count increments "
    "on the Approved Vendor List, any open invoices for the PO are put on payment hold, and a "
    "follow-up task is raised for whoever created the PO. Once decided, the record is locked.",
    "amber"
))
story.append(SP(4))

# 2.4 QMS Documents
story.append(section("2.4  QMS Documents"))
story.append(body(
    "A controlled document library for ISO evidence, internal procedures, quality plans, work "
    "instructions, and other QMS records. Same soft-retrieve pattern as HSE Documents."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Uploading a QMS Document", sStepHead))
story.append(form_table([
    ("Title",      "Internal Audit Procedure — QP-AUD-001 Rev 2"),
    ("Category",   "QMS Document (default)"),
    ("Attachment", "QP_AUD_001_Rev2_InternalAuditProcedure.pdf"),
], colors.HexColor("#065F46")))
story.append(SP(4))

# 2.5 Quality Tasks
story.append(section("2.5  Quality Tasks"))
story.append(body(
    "Task tracker scoped to the Quality team — audit follow-up actions, non-conformance "
    "close-outs, instrument calibration reminders, and inspection reviews."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Creating a Quality Task", sStepHead))
story.append(form_table([
    ("Title",       "Register 5 new UT gauges in Calibration Records"),
    ("Assignee",    "Taiwo Adeyemi (QA Manager)"),
    ("Priority",    "High"),
    ("Start date",  "Today"),
    ("Due date",    "3 days from today"),
    ("Attachment",  "SGS_CalibrationCerts_5units.pdf"),
], colors.HexColor("#065F46")))
story.append(SP(4))

# 2.6 Quality Reports
story.append(section("2.6  Quality Reports"))
story.append(kpi_table([
    ("Audit Completion Rate",      "85%",   "% of scheduled audits that reached Completed or Closed"),
    ("Calibration Compliance Rate","94%",   "% of registered instruments currently Valid"),
    ("Inspection Pass Rate",       "97%",   "% of inspected goods receipts that passed"),
    ("Team Tasks Resolved",        "14/16", "2 overdue shown in red"),
], colors.HexColor("#065F46")))
story.append(SP(6))
story.append(bullet("Monthly Audits chart: scheduled vs. completed over the last 6 months."))
story.append(bullet("Audit Lifecycle funnel: Scheduled → In Progress → Completed → Closed by type."))
story.append(bullet("Materials Inspection status distribution and overall pass rate."))
story.append(bullet("Export to Excel or PDF from the page header."))
story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# PART 3 — PROCUREMENT
# ══════════════════════════════════════════════════════════════════════════════
story.append(coloured_header(
    "PART 3 — PROCUREMENT MODULE",
    "Vendor management • Requisitions • RFQ/RFP • Purchase orders • Delivery • Receiving • Reports",
    colors.HexColor("#78350F"),
))
story.append(SP(8))
story.append(body(
    "The Procurement module covers the complete purchasing cycle: a department raises a purchase "
    "request, procurement sources it competitively, issues a formal order, tracks delivery, "
    "and receives goods — feeding directly into Quality inspection and Inventory stock. "
    "Every step is recorded, every approval is enforced, and the full trail is exportable."
))
story.append(SP(6))

story.append(Paragraph("End-to-end procurement flow:", sLabel))
story.append(SP(4))
story.append(summary_table([
    ("Vendor screening",   "Vendor Management",             "Approved Vendor List (AVL)"),
    ("Department request", "Requisition Tracker",           "Approved requisition"),
    ("Competitive sourcing","RFQ / RFP Management",         "Awarded RFQ"),
    ("Formal order",       "Purchase Orders",               "Acknowledged PO"),
    ("Delivery tracking",  "Expediting Delivery",           "Delivery confirmed"),
    ("Goods receiving",    "Inventory & Warehouse",         "MRN — Pending inspection"),
    ("Quality gate",       "Quality → Materials Inspection","Stock updated / vendor flagged"),
    ("Performance view",   "Procurement Reports",           "Live analytics dashboard"),
]))
story.append(SP(8))

# 3.1 Vendor Management
story.append(section("3.1  Vendor Management"))
story.append(body(
    "Maintains the Approved Vendor List. Only vendors who have passed a prequalification "
    "assessment and been approved appear on the AVL and can be invited to quote on RFQs."
))
story.append(SP(4))
story.append(Paragraph("Prequalification status lifecycle:", sLabel))
story.append(bullet("Pending Approval  →  Approved (joins AVL)  or  Rejected"))
story.append(bullet("AVL vendor status: Active  |  Suspended  |  Inactive"))
story.append(SP(6))
story.append(Paragraph("Form Input Example — New Vendor Prequalification", sStepHead))
story.append(form_table([
    ("Vendor name",          "SGS Nigeria Ltd"),
    ("RC number",            "RC-4187"),
    ("Vendor category",      "Inspection & Certification"),
    ("Assessment type",      "Full Prequalification"),
    ("Evaluator",            "Emeka Okafor (Procurement Officer)"),
    ("Email",                "procurement@sgsng.com"),
    ("Phone",                "08012345678"),
    ("Physical address",     "14 Admiralty Way, Lekki Phase 1, Lagos"),
    ("Products / services",  "Calibration Services, NDT Inspection, Ultrasonic Thickness Gauging"),
    ("Score",                "8  (out of 10)"),
    ("Screening date",       "Today's date"),
    ("Attachments",          "CAC Certificate, Tax Clearance, Capability Statement (3 files)"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(note_box(
    "A second prequalification with the same RC number adds an approved category to the same vendor "
    "rather than creating a duplicate. Failed inspection records accumulate on the vendor profile — "
    "the AVL is a live risk register, not a static list.",
    "amber"
))
story.append(SP(6))

# 3.2 Purchase Requests
story.append(section("3.2  Purchase Requests (Requisition Tracker)"))
story.append(body(
    "Any department can raise a purchase requisition. It must be approved by a different user "
    "before procurement can act on it. The person who raises a requisition cannot approve it — "
    "the system enforces this automatically."
))
story.append(SP(4))
story.append(Paragraph("Requisition status lifecycle:", sLabel))
story.append(bullet("Draft  →  Pending Approval  →  Approved  →  Converted to RFQ"))
story.append(bullet("Or: Pending Approval  →  Rejected (with recorded reason)"))
story.append(SP(6))
story.append(Paragraph("Form Input Example — New Purchase Requisition", sStepHead))
story.append(form_table([
    ("Requested material/service", "Ultrasonic Thickness Gauge — Olympus 38DL Plus, 5 units"),
    ("Category",                   "Equipment"),
    ("Department",                 "Offshore Operations"),
    ("Quantity",                   "5"),
    ("Unit",                       "Units"),
    ("Estimated budget (₦)",       "12,500,000"),
    ("Project",                    "PRJ-2025-07: Bonga FPSO Maintenance"),
    ("Priority",                   "High"),
    ("Requested by",               "Chidi Nwachukwu (Lead Inspector)"),
    ("Request date",               "Auto-set by the system"),
    ("Required date",              "60 days from today"),
    ("Justification",              "Current gauges are beyond calibration life and two are out of "
                                   "service. Offshore inspection programme starts in 8 weeks and "
                                   "cannot proceed without compliant instruments."),
    ("Attachment (optional)",      "Current calibration status report — CalibrationStatus_Jun2025.pdf"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(note_box(
    "Save as Draft first to review, then Submit Requisition. Approver sees it under "
    "Pending Approval and clicks Approve. If rejected, the reason is recorded and the requester "
    "must raise a new requisition — a rejected one cannot be resubmitted.",
    "amber"
))
story.append(SP(4))

# 3.3 RFQ / RFP
story.append(section("3.3  RFQ / RFP Management"))
story.append(body(
    "Converts an approved requisition into a competitive sourcing event. The system sends the "
    "requirements to multiple vendors, records every quotation received, and tracks evaluation "
    "and award — creating a permanent, auditable sourcing record."
))
story.append(SP(4))
story.append(Paragraph("RFQ status lifecycle:", sLabel))
story.append(bullet("Draft  →  Issued  →  Under Evaluation  →  Awarded   |   Cancelled"))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Creating the RFQ (from approved requisition)", sStepHead))
story.append(form_table([
    ("RFQ title",           "Supply of Ultrasonic Thickness Gauges — Q3 2025"),
    ("RFQ or RFP",          "RFQ"),
    ("Procurement category","Equipment"),
    ("Related requisition", "PRQ-2025-041 (auto-linked from conversion)"),
    ("Linked project",      "PRJ-2025-07: Bonga FPSO Maintenance"),
    ("Issue date",          "Today"),
    ("Closing date",        "14 days from today"),
    ("Invited vendors",     "SGS Nigeria Ltd, Dynalog Technical Services Ltd, Mactec Nigeria Ltd"),
    ("Delivery location",   "Offshore Operations Warehouse, Port Harcourt"),
    ("Payment terms",       "30% advance on PO, 70% on delivery"),
    ("Line 1 — item",       "Olympus 38DL Plus Ultrasonic Thickness Gauge"),
    ("Line 1 — qty",        "5"),
    ("Line 1 — unit",       "Units"),
    ("Attachment",          "Technical_Specification_38DL_Plus.pdf"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Logging Vendor Quotation 1 (SGS Nigeria Ltd)", sStepHead))
story.append(form_table([
    ("Vendor",                  "SGS Nigeria Ltd"),
    ("Vendor quotation no",     "SGS-QTN-2025-0892"),
    ("Quotation date",          "5 days after RFQ issue"),
    ("Quoted amount (₦)",       "11,750,000"),
    ("Currency",                "NGN"),
    ("Delivery period",         "21 days"),
    ("Proposed payment terms",  "30% advance, 70% net 30"),
    ("Technical compliance",    "Compliant with the specification"),
    ("Procurement notes",       "Includes 1-year warranty and on-site commissioning for all 5 units"),
    ("Attachment",              "SGS_Quotation_SGS-QTN-2025-0892.pdf"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Logging Vendor Quotation 2 (Dynalog Technical)", sStepHead))
story.append(form_table([
    ("Vendor",                  "Dynalog Technical Services Ltd"),
    ("Vendor quotation no",     "DYN-Q-2025-114"),
    ("Quotation date",          "7 days after RFQ issue"),
    ("Quoted amount (₦)",       "13,200,000"),
    ("Currency",                "NGN"),
    ("Delivery period",         "28 days"),
    ("Proposed payment terms",  "50% advance, 50% on delivery"),
    ("Technical compliance",    "Compliant"),
    ("Procurement notes",       "—"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(note_box(
    "After both quotations are logged: Close Bidding (status → Under Evaluation). "
    "Open the Vendor Responses tab to see quotes side by side. "
    "Award SGS Nigeria Ltd — lower price (₦11.75M vs ₦13.2M), shorter delivery (21 vs 28 days), "
    "warranty included. The award is recorded permanently with the vendor, amount, and decision.",
    "amber"
))
story.append(SP(4))

# 3.4 Purchase Orders
story.append(section("3.4  Purchase Orders"))
story.append(body(
    "Issues the formal binding order to the awarded vendor. Can be created from an awarded RFQ "
    "(recommended) or as a direct order without an RFQ (requires a written justification and "
    "must stay within the configured direct-order value limit)."
))
story.append(SP(4))
story.append(Paragraph("PO status lifecycle:", sLabel))
story.append(bullet("Awarded  →  Issued  →  Acknowledged  |  Cancelled"))
story.append(bullet("Once Acknowledged: vendor, project, category, and all line items are locked."))
story.append(SP(6))
story.append(Paragraph("Form Input Example — Creating the Purchase Order (from awarded RFQ)", sStepHead))
story.append(form_table([
    ("PO number",               "PO-2025-0128 (assigned automatically)"),
    ("Linked RFQ",              "RFQ-2025-033: Supply of Ultrasonic Thickness Gauges (auto-filled)"),
    ("Vendor",                  "SGS Nigeria Ltd (locked — from RFQ award)"),
    ("Linked project",          "PRJ-2025-07: Bonga FPSO Maintenance"),
    ("Procurement category",    "Equipment"),
    ("PO date",                 "Today"),
    ("Expected delivery date",  "21 days from today"),
    ("Delivery location",       "Offshore Operations Warehouse, Port Harcourt"),
    ("Payment terms",           "30% advance on PO, 70% on delivery"),
    ("Line 1 — item",           "Olympus 38DL Plus Ultrasonic Thickness Gauge"),
    ("Line 1 — qty",            "5"),
    ("Line 1 — unit",           "Units"),
    ("Line 1 — unit price (₦)", "2,350,000"),
    ("PO total (auto-calc)",    "₦11,750,000"),
    ("Attachment (optional)",   "SGS_AwardedQuotation_SGS-QTN-2025-0892.pdf"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(note_box(
    "After creating: status is Issued — the PO is sent to the vendor. "
    "When SGS Nigeria Ltd confirms acceptance, click Acknowledge. "
    "From that point, vendor, project, category, and lines are locked. "
    "Only delivery date, location, and payment terms can still change.",
    "amber"
))
story.append(SP(4))

# 3.5 Expediting Delivery
story.append(section("3.5  Expediting Delivery"))
story.append(body(
    "Tracks the physical shipment from the vendor's premises to the receiving warehouse, "
    "giving the procurement team real-time visibility of delivery status without leaving the ERP."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Logging a Delivery", sStepHead))
story.append(form_table([
    ("Purchase order",         "PO-2025-0128 — SGS Nigeria Ltd"),
    ("Delivery reference",     "SGS-DEL-2025-0107"),
    ("Material description",   "5× Olympus 38DL Plus Ultrasonic Thickness Gauges"),
    ("Expected delivery date", "5 days from today"),
    ("Status",                 "In Transit"),
    ("Attachment",             "SGS_Waybill_DEL20250107.pdf"),
], colors.HexColor("#92400E")))
story.append(SP(4))
story.append(bullet("Update status to Delivered when goods arrive at the warehouse."))
story.append(bullet("The PO view shows a Deliveries tab — buyer sees shipment status without leaving the PO screen."))
story.append(SP(4))

# 3.6 Material Receiving
story.append(section("3.6  Inventory & Warehouse — Material Receiving"))
story.append(body(
    "Records the physical receipt of goods into the warehouse and triggers the Quality "
    "inspection process. Only acknowledged POs can receive goods. The receipt starts as "
    "Pending until the Quality team completes their inspection."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Logging a Goods Receipt", sStepHead))
story.append(form_table([
    ("Purchase order",          "PO-2025-0128: SGS Nigeria Ltd (only acknowledged POs appear)"),
    ("Material",                "Olympus 38DL Plus Ultrasonic Thickness Gauges"),
    ("Total quantity received",  "5"),
    ("Warehouse",               "Offshore Operations Warehouse, Port Harcourt"),
    ("Receipt date",            "Today"),
    ("Line 1 — description",    "Olympus 38DL Plus Gauge"),
    ("Line 1 — ordered qty",    "5"),
    ("Line 1 — received qty",   "5"),
    ("Line 1 — inventory item", "UT-GAUGE-38DL (linked to existing stock item in this warehouse)"),
    ("Attachment (optional)",   "SGS_PackingList_MRN20250074.pdf"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(note_box(
    "Result: MRN-2025-0074 is created with Inspection Status = Pending. "
    "The same record is immediately visible in Quality → Materials Inspection for the QA team "
    "to action. No separate entry is needed in both modules.",
    "amber"
))
story.append(SP(4))

# 3.7 Quality Materials Inspection (from Procurement context)
story.append(section("3.7  Quality → Materials Inspection (Outcome)"))
story.append(body(
    "The Quality team records the inspection decision. The outcome has automatic consequences "
    "across Inventory, Finance (invoicing), and the Approved Vendor List."
))
story.append(SP(4))
story.append(Paragraph("Form Input Example — Recording the Inspection (from either module)", sStepHead))
story.append(form_table([
    ("Receipt (auto-filled)",   "MRN-2025-0074 — PO-2025-0128 — SGS Nigeria Ltd"),
    ("Line 1 received qty",     "5 (inspector confirms physical count)"),
    ("Inspection status",       "Passed"),
    ("Inspection notes",        "All 5 units received intact. Serial numbers verified against "
                                 "SGS packing list SGS-PL-2025-0107. No physical damage. "
                                 "Units to be registered in Calibration Records before deployment."),
    ("Delivery document",       "SGS_PackingList_DeliveryNote_MRN20250074.pdf  (required)"),
], colors.HexColor("#065F46")))
story.append(SP(6))
story.append(Paragraph("Automatic consequences by decision:", sLabel))
story.append(SP(4))
pass_fail = Table([
    [Paragraph("PASSED", S("pf", fontSize=9, fontName="Helvetica-Bold", textColor=GREEN)),
     Paragraph("FAILED", S("pf2", fontSize=9, fontName="Helvetica-Bold", textColor=RED))],
    [Paragraph("• Received quantities booked into inventory stock for all lines linked to an inventory item\n"
               "• Record locked — cannot be revised\n"
               "• Notes and delivery document linked to the goods receipt and delivery for full traceability",
               S("pft", fontSize=8.5, fontName="Helvetica", textColor=GREEN, leading=12)),
     Paragraph("• Nothing booked into stock\n"
               "• Vendor's failed-inspection count increments on the Approved Vendor List\n"
               "• All open invoices for the PO are put on payment hold\n"
               "• A follow-up task is raised automatically for whoever created the PO\n"
               "• Record locked — cannot be revised",
               S("pff", fontSize=8.5, fontName="Helvetica", textColor=RED, leading=12))],
], colWidths=[(PAGE_W - L_MARGIN - R_MARGIN)/2 - 4,
              (PAGE_W - L_MARGIN - R_MARGIN)/2 - 4])
pass_fail.setStyle(TableStyle([
    ("BACKGROUND",    (0, 0), (0, -1), LIGHTGREEN),
    ("BACKGROUND",    (1, 0), (1, -1), LIGHTRED),
    ("BOX",           (0, 0), (0, -1), 0.5, GREEN),
    ("BOX",           (1, 0), (1, -1), 0.5, RED),
    ("TOPPADDING",    (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING",   (0, 0), (-1, -1), 10),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING",   (1, 0), (1, -1), 14),
]))
story.append(pass_fail)
story.append(SP(8))

# 3.8 Procurement Reports
story.append(section("3.8  Procurement Reports"))
story.append(kpi_table([
    ("Total PO Value",        "₦847M",  "Combined value of all non-cancelled POs; open requisition count shown below"),
    ("RFQ Award Rate",        "78%",    "% of issued RFQs that reached an award decision"),
    ("On-Time Delivery Rate", "88%",    "% of deliveries completed on or before the expected date"),
    ("Team Tasks Resolved",   "31/35",  "4 overdue shown in red"),
], colors.HexColor("#92400E")))
story.append(SP(6))
story.append(bullet("Monthly PO Value chart: acknowledged vs. awaiting acknowledgement over the last 6 months."))
story.append(bullet("RFQ Performance panel: submitted RFQs, total awarded value, status distribution."))
story.append(bullet("Procurement Pipeline Funnel: how many requisitions progress through to PO, acknowledgement, and delivery."))
story.append(bullet("PO value by category and Requisitions by category — horizontal bar charts."))
story.append(bullet("Export as CSV or Excel from the page header."))
story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# CLOSING — KEY PLATFORM FEATURES
# ══════════════════════════════════════════════════════════════════════════════
story.append(coloured_header(
    "KEY PLATFORM FEATURES — ACROSS ALL THREE MODULES",
    "Consistent capabilities that apply regardless of which screen the user is on",
    NAVY,
))
story.append(SP(8))

cross_rows = [
    ("Full audit trail",           "Every create, update, approve, and action is logged with the user, timestamp, and reason. Viewable on each record's History tab."),
    ("Role-based access control",  "Permissions are granted by role. Each button (create, approve, export, decide) only appears if the user's role includes that permission."),
    ("Self-approval prevention",   "A user who raises a requisition cannot approve it. The system hides the Approve button for their own records."),
    ("File attachments",           "Documents, certificates, photos, and reports can be attached to any record and downloaded at any time."),
    ("Soft retrieval (Documents)", "Documents are retrieved, not deleted. The record that the document existed is preserved in the audit log."),
    ("Auto status transitions",    "Certificate expiry, calibration due dates, and audit overdue flags update automatically — no manual chasing."),
    ("Cross-module data sharing",  "Employees (from HR), vendors, projects (from BizDev), POs, and warehouses feed into HSE and Quality automatically — no duplicate entry."),
    ("Export",                     "Every list screen and report can be exported to CSV, Excel, or PDF."),
    ("Consequence logic",          "Failed inspections: payment hold on invoices + vendor flag + auto task. Direct PO over limit: blocked by the system."),
    ("Search and filter",          "Every list has a live search bar and a filter drawer (status, date range, department, category, etc.)."),
]
ct = Table(
    [[Paragraph(f, S("cf", fontSize=8.5, fontName="Helvetica-Bold", textColor=NAVY)),
      Paragraph(d, sTD)] for f, d in cross_rows],
    colWidths=[(PAGE_W - L_MARGIN - R_MARGIN)*0.28,
               (PAGE_W - L_MARGIN - R_MARGIN)*0.72],
)
ct.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, LIGHTSLATE]),
    ("GRID",           (0,0), (-1,-1), 0.4, BORDER),
    ("TOPPADDING",     (0,0), (-1,-1), 6),
    ("BOTTOMPADDING",  (0,0), (-1,-1), 6),
    ("LEFTPADDING",    (0,0), (-1,-1), 10),
    ("RIGHTPADDING",   (0,0), (-1,-1), 10),
    ("VALIGN",         (0,0), (-1,-1), "TOP"),
]))
story.append(ct)
story.append(SP(16))

story.append(note_box(
    "Closing statement — HSE, Quality, and Procurement are live, fully connected, and require no "
    "duplicate entry. HR, BizDev, and Operations all feed into these modules automatically. "
    "Everything you have seen is role-controlled — each user sees and does only what their "
    "position authorises. The audit trail on every record means you are permanently ready for "
    "any client, regulatory, or ISO inspection.",
    "blue"
))

# ── BUILD ─────────────────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF written to {OUTPUT}")
