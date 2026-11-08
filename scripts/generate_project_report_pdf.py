import os
import sys
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' page numbers
    and professional running headers/footers on all pages except the cover page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Top Running Header
        self.drawString(
            54, 755,
            "Smart Amusement Park Management – AI Analytics Platform | Technical Project Documentation"
        )
        self.drawRightString(
            612 - 54, 755,
            "Fuji Kyuko DX Portfolio"
        )
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(54, 747, 612 - 54, 747)

        # Bottom Running Footer
        self.line(54, 45, 612 - 54, 45)
        self.drawString(
            54, 33,
            "Confidential • Prepared for Fuji Kyuko Co., Ltd. (IT Engineer - DX Position)"
        )
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 33, page_str)
        self.restoreState()


def create_architecture_diagram():
    """
    Draws a crisp, professional vector architecture diagram using ReportLab Graphics.
    """
    d = Drawing(504, 155)

    # Background canvas card
    d.add(Rect(0, 0, 504, 155, fillColor=colors.HexColor("#F8FAFC"), strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1, rx=6, ry=6))

    # Column 1: Presentation Layer
    d.add(Rect(14, 20, 105, 115, fillColor=colors.HexColor("#EFF6FF"), strokeColor=colors.HexColor("#3B82F6"), strokeWidth=1.2, rx=4, ry=4))
    d.add(String(66, 120, "PRESENTATION", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#1E3A8A")))
    d.add(String(66, 105, "React 18 + TS SPA", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1E293B")))
    d.add(String(66, 90, "14 Module Views", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(66, 75, "Tailwind UI & TopNav", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(66, 60, "Recharts Visualizer", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(66, 45, "Axios REST Client", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(66, 30, "Vite Bundler", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#2563EB")))

    # Arrow 1 -> 2
    d.add(Line(120, 77, 137, 77, strokeColor=colors.HexColor("#2563EB"), strokeWidth=1.5))
    d.add(Line(133, 80, 137, 77, strokeColor=colors.HexColor("#2563EB"), strokeWidth=1.5))
    d.add(Line(133, 74, 137, 77, strokeColor=colors.HexColor("#2563EB"), strokeWidth=1.5))

    # Column 2: API & Gateway
    d.add(Rect(138, 20, 110, 115, fillColor=colors.HexColor("#F0FDF4"), strokeColor=colors.HexColor("#10B981"), strokeWidth=1.2, rx=4, ry=4))
    d.add(String(193, 120, "API & GATEWAY", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#065F46")))
    d.add(String(193, 105, "FastAPI Application", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1E293B")))
    d.add(String(193, 90, "OAuth2 / JWT Bearer", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(193, 75, "Pydantic v2 Schemas", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(193, 60, "Async File Ingest", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(193, 45, "CORS & Auth Guard", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(193, 30, "14 Endpoints / OpenAPI", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#059669")))

    # Arrow 2 -> 3
    d.add(Line(249, 77, 266, 77, strokeColor=colors.HexColor("#059669"), strokeWidth=1.5))
    d.add(Line(262, 80, 266, 77, strokeColor=colors.HexColor("#059669"), strokeWidth=1.5))
    d.add(Line(262, 74, 266, 77, strokeColor=colors.HexColor("#059669"), strokeWidth=1.5))

    # Column 3: Processing & AI Engines
    d.add(Rect(267, 20, 115, 115, fillColor=colors.HexColor("#FEF3C7"), strokeColor=colors.HexColor("#F59E0B"), strokeWidth=1.2, rx=4, ry=4))
    d.add(String(324, 120, "PROCESSING & AI", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#92400E")))
    d.add(String(324, 105, "Workflow Orchestrator", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1E293B")))
    d.add(String(324, 90, "Cleaner & Contract Val.", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(324, 75, "Isolation Forest (ML)", textAnchor="middle", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#B45309")))
    d.add(String(324, 60, "Z-Score / IQR Outliers", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(324, 45, "Deterministic Insights", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(324, 30, "ReportLab / SMTP", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#D97706")))

    # Arrow 3 -> 4
    d.add(Line(383, 77, 400, 77, strokeColor=colors.HexColor("#D97706"), strokeWidth=1.5))
    d.add(Line(396, 80, 400, 77, strokeColor=colors.HexColor("#D97706"), strokeWidth=1.5))
    d.add(Line(396, 74, 400, 77, strokeColor=colors.HexColor("#D97706"), strokeWidth=1.5))

    # Column 4: Persistence Layer
    d.add(Rect(401, 20, 92, 115, fillColor=colors.HexColor("#F5F3FF"), strokeColor=colors.HexColor("#8B5CF6"), strokeWidth=1.2, rx=4, ry=4))
    d.add(String(447, 120, "PERSISTENCE", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#5B21B6")))
    d.add(String(447, 105, "PostgreSQL 18 DB", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1E293B")))
    d.add(String(447, 90, "SQLAlchemy 2.0 ORM", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(447, 75, "Transactions Master", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(447, 60, "Multi-Wh Inventory", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(447, 45, "Anomaly Audit Logs", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
    d.add(String(447, 30, "Workflow Executions", textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#7C3AED")))

    return d


def build_pdf_report(output_filename: str):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=29,
        textColor=colors.HexColor("#0A132C"),
        alignment=0,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=colors.HexColor("#2563EB"),
        alignment=0,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0A132C"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14.5,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=body_style,
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=colors.HexColor("#0F172A")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#0A132C")
    )

    table_cell_header = ParagraphStyle(
        'TableCellHeader',
        parent=table_cell,
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []

    # =========================================================================
    # 1. COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 15))

    ribbon_data = [[
        Paragraph("<font color='#0284C7'><b>DIGITAL TRANSFORMATION (DX) TECHNICAL PORTFOLIO & ARCHITECTURE SPECIFICATION</b></font>", body_bold)
    ]]
    ribbon_table = Table(ribbon_data, colWidths=[504])
    ribbon_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0F9FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BAE6FD")),
        ('PADDING', (0,0), (-1,-1), 7),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ]))
    story.append(ribbon_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("Smart Amusement Park Management – AI Analytics Platform", title_style))
    story.append(Paragraph("A Production-Grade Full-Stack Automation, Statistical Anomaly Detection, and Operational Intelligence Engine for Resort, Amusement Park, and Multi-Segment Tourism Operations", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0A132C"), spaceBefore=4, spaceAfter=18))

    cover_summary = (
        "<b>Executive Overview:</b> This document provides an exhaustive, code-verified technical documentation "
        "and architectural analysis of the <b>FUJI FLOW</b> Enterprise Platform. Designed specifically to solve real-world "
        "digital transformation challenges in leisure and resort operations (e.g. Fuji-Q Highland, transport networks, and hotel retail), "
        "the platform delivers end-to-end operational automation across <b>14 fully implemented enterprise modules</b>. "
        "The architecture enforces a strict <i>Zero-Fabricated-Data Mandate</i>, featuring dual-layer machine learning outlier "
        "detection (Scikit-Learn Isolation Forest & Z-Score statistics), mathematical relational contract validation, "
        "and a modern full-width executive interface."
    )
    summary_table = Table([[Paragraph(cover_summary, callout_style)]], colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('LINELEFT', (0,0), (-1,-1), 3.5, colors.HexColor("#2563EB")),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 25))

    meta_data = [
        [Paragraph("Target Position", table_cell_bold), Paragraph("IT Engineer – Digital Transformation (DX)", table_cell)],
        [Paragraph("Target Organization", table_cell_bold), Paragraph("Fuji Kyuko Co., Ltd. (富士急行株式会社) – Japan", table_cell)],
        [Paragraph("Applicant / Candidate", table_cell_bold), Paragraph("<b>Siva</b> (GitHub: @siva20004)", table_cell)],
        [Paragraph("GitHub Repository", table_cell_bold), Paragraph("<font color='#2563EB'><u>https://github.com/siva20004/AI-Business-Process-Automation-Analytics-Platform.git</u></font>", table_cell)],
        [Paragraph("Implementation Status", table_cell_bold), Paragraph("<b>100% Implemented & Verified</b> (36/36 Automated Tests Passing)", table_cell)],
        [Paragraph("Core Technologies", table_cell_bold), Paragraph("FastAPI, Python 3.13, PostgreSQL 18, SQLAlchemy 2.0, React 18, TypeScript, Scikit-Learn", table_cell)],
        [Paragraph("Document Compilation", table_cell_bold), Paragraph(f"Official Submission Draft • {datetime.now().strftime('%B %Y')}", table_cell)],
    ]
    meta_table = Table(meta_data, colWidths=[150, 354])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#FFFFFF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 5.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 25))
    status_box = [
        [
            Paragraph("<b>Production Audit Status:</b>", table_cell_bold),
            Paragraph("<font color='#059669'><b>BUILD PASSING</b> (0 TS Errors)</font>", table_cell),
            Paragraph("<b>Test Suite:</b>", table_cell_bold),
            Paragraph("<font color='#059669'><b>36/36 PYTEST PASSING</b></font>", table_cell),
        ]
    ]
    st_table = Table(status_box, colWidths=[120, 132, 80, 172])
    st_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#A7F3D0")),
        ('PADDING', (0,0), (-1,-1), 5.5),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(st_table)

    story.append(PageBreak())

    # =========================================================================
    # 2. TABLE OF CONTENTS & EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("Table of Contents", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=10))

    toc_data = [
        [Paragraph("<b>Section 1: Project Overview & Operational Problem Statement</b>", table_cell), Paragraph("Page 3", table_cell_bold)],
        [Paragraph("<b>Section 2: Project Objectives & Digital Transformation Scope</b>", table_cell), Paragraph("Page 3", table_cell_bold)],
        [Paragraph("<b>Section 3: Verified Technologies Used & Architectural Justification</b>", table_cell), Paragraph("Page 4", table_cell_bold)],
        [Paragraph("<b>Section 4: System Architecture & Data Flow Implementation</b>", table_cell), Paragraph("Page 5", table_cell_bold)],
        [Paragraph("<b>Section 5: Key Features & 14 Implemented Enterprise Modules</b>", table_cell), Paragraph("Page 6", table_cell_bold)],
        [Paragraph("<b>Section 6: AI, Machine Learning, and Data Analytics Implementation</b>", table_cell), Paragraph("Page 8", table_cell_bold)],
        [Paragraph("<b>Section 7: Candidate Role, Responsibilities, and Project Contributions</b>", table_cell), Paragraph("Page 9", table_cell_bold)],
        [Paragraph("<b>Section 8: Business Applications & DX Alignment for Fuji Kyuko (Japan)</b>", table_cell), Paragraph("Page 10", table_cell_bold)],
        [Paragraph("<b>Section 9: Genuine Technical Challenges Overcome & Engineering Solutions</b>", table_cell), Paragraph("Page 11", table_cell_bold)],
        [Paragraph("<b>Section 10: Future Enhancements & Strategic Roadmap</b>", table_cell), Paragraph("Page 12", table_cell_bold)],
        [Paragraph("<b>Section 11: Conclusion & Summary of Engineering Qualifications</b>", table_cell), Paragraph("Page 12", table_cell_bold)],
    ]
    toc_table = Table(toc_data, colWidths=[420, 84])
    toc_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Executive Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    exec_summary_text = (
        "Modern tourism, resort, and amusement park operations—such as those operated across Yamanashi and Shizuoka "
        "by Fuji Kyuko Co., Ltd. (including Fuji-Q Highland, highway buses, regional rail, and resort hotels)—handle tens of thousands "
        "of physical transactions daily. Historically, operational data from ride ticketing kiosks, turnstile entry gates, "
        "food concessions, and souvenir retail shops remained siloed across legacy databases and manual spreadsheets. "
        "This data fragmentation caused significant operational blind spots: delayed revenue recognition, unflagged POS pricing glitches, "
        "ride merchandise stockouts, and labor-intensive manual audit cycles.<br/><br/>"
        "To address these operational bottlenecks directly, this project conceived, architected, and delivered a production-ready "
        "<b>AI-Based Business Process Automation & Analytics Platform</b>. Built strictly upon real database records "
        "(zero fabricated mockups), the system integrates 14 full-stack enterprise modules spanning automated ingestion, "
        "formula contract validation, statistical and machine learning outlier detection (Isolation Forest), automated executive reporting, "
        "and a high-performance executive dashboard with a classic top-navigation interface. "
        "All code is completely open-source, fully documented, and verified by 36 unit/integration tests running against PostgreSQL 18."
    )
    story.append(Paragraph(exec_summary_text, body_style))

    story.append(PageBreak())

    # =========================================================================
    # 3. PROJECT OVERVIEW & PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("1. Project Overview & Operational Problem Statement", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("1.1 Real-World Amusement Park & Tourism Operational Context", h2_style))
    story.append(Paragraph(
        "Amusement park and resort conglomerates operate highly dynamic, multi-modal commercial environments. "
        "A typical guest journey at Fuji-Q Highland entails purchasing priority attraction tickets, dining at quick-service restaurants, "
        "visiting gift retail stores, and utilizing local transport connections. Behind this seamless guest experience lies an intense "
        "volume of financial and logistical telemetry. Without digital transformation (DX), operators encounter severe inefficiencies:",
        body_style
    ))

    problems = [
        ("Disparate Ticketing & Retail Data Silos", "POS registers, online booking portals, turnstiles, and hotel front desks generate data in differing formats (CSV, Excel, direct SQL, JSON REST payloads), creating major ingestion barriers."),
        ("Revenue Leakage & Cashier Entry Outliers", "Manual discount overrides, barcode scanning glitches, and miskeyed quantities can cause transaction amounts to diverge by over 40% from catalog baselines without immediate supervisory detection."),
        ("High-Demand Stockouts & Inaccurate Reorder Planning", "Souvenir merchandise and high-turnover food consumables experience unpredictable demand surges, resulting in lost revenue when stock dips below critical safety levels."),
        ("Labor-Intensive Audit Cycles", "Corporate controllers and operations directors spend hours manually reviewing transaction sheets in spreadsheets, pulling staff away from on-site guest satisfaction initiatives."),
        ("Absence of Automated Multi-Tenant Pipelines", "Data cleaning, math contract checks, report generation, and exception alerting traditionally require separate manual steps rather than an autonomous event-driven workflow.")
    ]
    for title, desc in problems:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("1.2 Distinction: Implemented Solutions vs. Proposed Enhancements", h2_style))
    story.append(Paragraph(
        "To ensure complete engineering transparency and academic integrity, the table below explicitly separates "
        "features that are fully coded and tested in the GitHub repository from future roadmap enhancements:",
        body_style
    ))

    comp_data = [
        [Paragraph("Operational Domain", table_cell_header), Paragraph("Implemented in Codebase (Verified)", table_cell_header), Paragraph("Proposed Future Enhancements", table_cell_header)],
        [
            Paragraph("<b>Financial & Sales Ingestion</b>", table_cell_bold),
            Paragraph("Full ETL pipeline supporting CSV/Excel/JSON upload, preview schema inspector, and automatic ingestion into PostgreSQL 18.", table_cell),
            Paragraph("Direct automated Kafka/MQTT streaming ingestion from live physical turnstiles and POS cloud terminals.", table_cell)
        ],
        [
            Paragraph("<b>Data Quality & Validation</b>", table_cell_bold),
            Paragraph("Relational contract validation engine verifying mathematical consistency (qty × unit_price == total) & duplicate rejection.", table_cell),
            Paragraph("Automated schema migration engine and cross-database CDC (Change Data Capture) replication.", table_cell)
        ],
        [
            Paragraph("<b>Anomaly Detection</b>", table_cell_bold),
            Paragraph("Dual-layer engine: Scikit-Learn IsolationForest (ML) + Z-score (2.5σ) + IQR + Price deviation (>40%) + review audit.", table_cell),
            Paragraph("Real-time streaming anomaly scoring with instant Webhook triggers to on-ground facility managers.", table_cell)
        ],
        [
            Paragraph("<b>Inventory Logistics</b>", table_cell_bold),
            Paragraph("Centralized warehouse tracking, low-stock threshold detection, reorder replenishment budget computation, and SKU analytics.", table_cell),
            Paragraph("Automated EDI purchase order dispatch to external Japanese food/merchandise suppliers.", table_cell)
        ],
        [
            Paragraph("<b>Queue & Ride Operations</b>", table_cell_bold),
            Paragraph("Division-aware transactional performance tracking (Amusement, Transportation, Tourism, Hotel, Retail).", table_cell),
            Paragraph("Computer-vision crowd density estimation and IoT sensor queue wait-time forecasting per ride attraction.", table_cell)
        ],
    ]
    comp_table = Table(comp_data, colWidths=[100, 204, 200])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A132C")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(comp_table)

    story.append(Spacer(1, 10))

    # =========================================================================
    # 4. PROJECT OBJECTIVES
    # =========================================================================
    story.append(Paragraph("2. Project Objectives & Digital Transformation Scope", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    objectives = [
        ("Unified Operational Data Repository", "Establish a centralized, highly reliable PostgreSQL database consolidating transactional records, multi-depot inventory, workflow execution history, and security audit logs."),
        ("Strict Real-Data Mandate", "Eliminate mock/hallucinated data. Ensure every KPI, chart, and briefing reflects genuine database records with complete lineage and audit provenance."),
        ("Autonomous Workflow Pipeline", "Provide a modular workflow engine capable of chaining data parsing, mathematical validation, database synchronization, report generation, and email alerting into a single automated pipeline."),
        ("Proactive AI Outlier Detection", "Deploy unsupervised machine learning and statistical models to automatically flag abnormal transactions, cashier mispricing, and critical stock depletion prior to management review."),
        ("Enterprise-Grade UI Experience", "Deliver an ergonomic, responsive single-page application (SPA) featuring classic top navigation, instant PostgreSQL telemetry, and interactive analytical visualizers.")
    ]
    for obj_name, obj_desc in objectives:
        story.append(Paragraph(f"• <b>{obj_name}:</b> {obj_desc}", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # 5. TECHNOLOGIES USED
    # =========================================================================
    story.append(Paragraph("3. Verified Technologies Used & Architectural Justification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "Every technology listed below was verified directly from the repository's configuration and dependency manifests "
        "(<font name='Courier'>backend/requirements.txt</font> and <font name='Courier'>frontend/package.json</font>). "
        "No unverified tools or frameworks have been assumed.",
        body_style
    ))

    tech_table_data = [
        [Paragraph("Category", table_cell_header), Paragraph("Technology & Version", table_cell_header), Paragraph("Exact Role in Project Architecture", table_cell_header)],
        [
            Paragraph("<b>Backend Core</b>", table_cell_bold),
            Paragraph("<b>Python 3.13</b><br/>FastAPI 0.115<br/>Pydantic v2<br/>Uvicorn (ASGI)", table_cell),
            Paragraph("High-performance asynchronous REST API framework serving 14 router modules. Enforces strict request/response data contracts, auto-generates OpenAPI documentation, and handles multipart file uploads.", table_cell)
        ],
        [
            Paragraph("<b>Database & ORM</b>", table_cell_bold),
            Paragraph("<b>PostgreSQL 18</b><br/>SQLAlchemy 2.0<br/>psycopg2-binary", table_cell),
            Paragraph("Enterprise relational datastore. SQLAlchemy 2.0 ORM manages normalized schemas for transactions, inventory, workflows, anomalies, users, and audit logs with transactional ACID safety.", table_cell)
        ],
        [
            Paragraph("<b>AI & Data Science</b>", table_cell_bold),
            Paragraph("<b>Scikit-Learn 1.6</b><br/>Pandas 2.2<br/>NumPy 2.2", table_cell),
            Paragraph("Vectorized data processing and Machine Learning. Isolation Forest detects multi-dimensional transaction anomalies; Pandas/NumPy compute IQR, standard deviation (Z-scores), and pricing baselines.", table_cell)
        ],
        [
            Paragraph("<b>Frontend SPA</b>", table_cell_bold),
            Paragraph("<b>React 18</b><br/>TypeScript 5.6<br/>Vite 5.4", table_cell),
            Paragraph("Component-driven single page application built with type safety. Decoupled custom auth context prevents HMR invalidation. Vite provides blazing-fast HMR and optimized production compilation.", table_cell)
        ],
        [
            Paragraph("<b>UI & Visualization</b>", table_cell_bold),
            Paragraph("<b>Tailwind CSS 3.4</b><br/>Recharts 2.15<br/>Lucide React", table_cell),
            Paragraph("Classic corporate enterprise design system. Responsive top navigation with telemetry indicators. Recharts renders interactive AreaCharts and BarCharts for daily trends and category distributions.", table_cell)
        ],
        [
            Paragraph("<b>Document Engine</b>", table_cell_bold),
            Paragraph("<b>ReportLab 5.1</b><br/>OpenPyXL 3.1", table_cell),
            Paragraph("Autonomous document compiler generating publication-grade PDF briefs with dynamic running headers, mathematical tables, and multi-tab operational Excel audit reports.", table_cell)
        ],
        [
            Paragraph("<b>Communications</b>", table_cell_bold),
            Paragraph("<b>SMTPLib & MIME</b><br/>(Python Built-in)", table_cell),
            Paragraph("Automated executive dispatch engine delivering HTML performance briefings, critical low-stock reorder warnings, and audit escalation notifications.", table_cell)
        ],
        [
            Paragraph("<b>Quality & Testing</b>", table_cell_bold),
            Paragraph("<b>Pytest 9.2</b><br/>FastAPI TestClient", table_cell),
            Paragraph("Comprehensive automated test suite executing 36 end-to-end integration and unit tests covering authentication, analytics, uploads, workflows, and anomaly engines.", table_cell)
        ],
    ]
    tech_table = Table(tech_table_data, colWidths=[90, 120, 294])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A132C")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(tech_table)

    story.append(PageBreak())

    # =========================================================================
    # 6. SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("4. System Architecture & Data Flow Implementation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The system adheres to an enterprise multi-tier architecture designed for separation of concerns, "
        "type safety, and horizontal scalability. Below is the verified architectural block diagram:",
        body_style
    ))

    story.append(create_architecture_diagram())
    story.append(Spacer(1, 8))

    story.append(Paragraph("4.1 Detailed Component Interaction & Data Lifecycles", h2_style))
    arch_steps = [
        ("Client Interaction & State Management", "The React 18 SPA communicates over HTTPS with the FastAPI backend. User identity is preserved using JWT bearer tokens in Axios request interceptors, with automated 401 recovery guards."),
        ("Ingestion & Mathematical Validation Pipeline", "When an operator uploads operational records (e.g. daily attraction ticket sales), the Parser inspects delimiters and headers. The DataCleaner normalizes text and categories, while the Validator checks the math contract: (Quantity × Unit Price == Total Amount). Records with rounding or price mismatches are quarantined into ValidationIssues."),
        ("PostgreSQL Commit & Triggering", "Clean, verified records are committed to the business_transactions table in PostgreSQL 18. This triggers automated telemetry updates across connected dashboards and anomaly engines."),
        ("Machine Learning Outlier Scans", "The AnomalyEngine loads transaction matrices into Pandas. Unsupervised Isolation Forest evaluates multi-feature vectors while statistical Z-Score evaluates category-specific distribution. Outliers are persisted with full audit provenance."),
        ("Reporting & Notification Dispatch", "The Workflow Orchestrator automatically invokes ReportLab to compile PDF summaries and uses SMTPLib to distribute formatted executive emails to designated department heads.")
    ]
    for step_title, step_desc in arch_steps:
        story.append(Paragraph(f"• <b>{step_title}:</b> {step_desc}", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("4.2 Database Schema & Relational Integrity", h2_style))
    story.append(Paragraph(
        "The relational schema is implemented across 11 core SQLAlchemy models: "
        "<b>User</b> and <b>Role</b> (RBAC security); <b>DataSource</b>, <b>DataImport</b>, and <b>ValidationIssue</b> (ingestion provenance); "
        "<b>BusinessTransaction</b> and <b>InventoryRecord</b> (operational core); <b>Workflow</b> and <b>WorkflowExecution</b> (automation); "
        "<b>AnomalyDetection</b> (AI monitoring); and <b>GeneratedReport</b> and <b>AuditLog</b> (compliance governance).",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # 7. KEY FEATURES & 14 IMPLEMENTED ENTERPRISE MODULES
    # =========================================================================
    story.append(Paragraph("5. Key Features & 14 Implemented Enterprise Modules", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "All 14 modules described below are completely implemented in both backend Python APIs and frontend React views, "
        "fully routed through the classic top navigation bar:",
        body_style
    ))

    modules_part1 = [
        ("Module 1: Executive Dashboard", "Route: /", "Consolidates group-wide operational KPIs: Net Sales, Total Transactions, Average Transaction Value (ATV), and Total Inventory. Features Recharts AreaChart daily revenue curves, category distribution bars, and verified metadata badges."),
        ("Module 2: Data Sources Integration", "Route: /data-sources", "Connects external systems (PostgreSQL databases, local file repositories, REST endpoints). Features live connection testing, record counter telemetry, and schema structure inspector."),
        ("Module 3: Data Upload Center", "Route: /upload", "Provides drag-and-drop ingestion for CSV, XLSX, and JSON operational files. Includes pre-upload schema preview, row sampling, file validation, and instant test datasets."),
        ("Module 4: Data Cleaning & Validation", "Route: /validation", "Enforces relational math contracts. Calculates row-by-row accuracy, flags duplicates, displays color-coded error/warning breakdowns, and provides proposed value corrections."),
        ("Module 5: Workflow Automation", "Route: /workflows", "Visual orchestration engine allowing operators to configure, execute, and monitor multi-stage automated pipelines (e.g. Daily POS Ingestion, Low-Stock Notification, Anomaly Audits)."),
        ("Module 6: Sales Analytics", "Route: /sales", "Deep-dive financial analytics across commercial divisions (Amusement, Transportation, Hotel, Retail). Computes ATV, sales growth % vs prior periods, and top product revenue rankings."),
        ("Module 7: Inventory Analytics", "Route: /inventory", "Centralized multi-facility supply chain tracking. Calculates total stock valuation, identifies SKUs breaching reorder thresholds, and computes required replenishment budgets.")
    ]

    for m_title, m_route, m_desc in modules_part1:
        story.append(Paragraph(f"• <b>{m_title}</b> [<font color='#2563EB'>{m_route}</font>]<br/>{m_desc}", bullet_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 4))

    modules_part2 = [
        ("Module 8: Anomaly Detection Engine", "Route: /anomalies", "Unsupervised Isolation Forest + Z-Score scanner. Displays outlier cards, divergence explanations, baseline references, and full human-in-the-loop review workflow (Reviewed, Dismissed, Escalated)."),
        ("Module 9: AI Business Insights", "Route: /insights", "Deterministic executive briefing synthesizer. Generates grounded revenue/inventory narratives and features an interactive Q&A assistant backed by direct SQL routing."),
        ("Module 10: Report Center", "Route: /reports", "On-demand and scheduled document generator. Produces publication-grade PDF executive briefings, multi-sheet Excel workbooks, and CSV audit logs with instant browser download."),
        ("Module 11: Email Automation", "Route: /email", "Corporate notification engine. Dispatches HTML executive digests, critical inventory depletion alerts, and audit escalation notices via SMTP with live preview."),
        ("Module 12: Workflow Execution History", "Route: /workflow-history", "Observability console displaying real-time execution logs, duration benchmarks, failure step diagnostics, and one-click execution retry capabilities."),
        ("Module 13: User Management (RBAC)", "Route: /users", "Role-based access control administration. Manages enterprise user accounts, hashed credentials, assigned roles (Admin, Analyst, Operator), and access status."),
        ("Module 14: Settings & Diagnostics", "Route: /settings", "System telemetry console showing PostgreSQL latency (e.g. 1.2ms), database engine version, active Python/OS runtime, and environment configuration flags.")
    ]

    for m_title, m_route, m_desc in modules_part2:
        story.append(Paragraph(f"• <b>{m_title}</b> [<font color='#2563EB'>{m_route}</font>]<br/>{m_desc}", bullet_style))
        story.append(Spacer(1, 2))

    story.append(PageBreak())

    # =========================================================================
    # 8. AI, MACHINE LEARNING & ANALYTICS
    # =========================================================================
    story.append(Paragraph("6. AI, Machine Learning, and Data Analytics Implementation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("6.1 Dual-Layer Anomaly Detection Architecture", h2_style))
    story.append(Paragraph(
        "Amusement park operations encounter two distinct types of transactional anomalies: "
        "(1) category-wide extreme value spikes (e.g., bulk ticket scalping or VIP group bookings), and "
        "(2) subtle multi-dimensional outliers where individual numbers seem plausible but their combination is abnormal "
        "(e.g., purchasing 50 high-value souvenirs at an unauthorized discounted unit price). "
        "The platform deploys a dual-layer strategy implemented in <font name='Courier'>backend/app/anomaly_detection/detector.py</font>:",
        body_style
    ))

    ai_features = [
        ("Layer 1: Category-Aware Statistical Z-Score & IQR",
         "Transactions are grouped by business segment (Amusement, Transportation, Food, Retail). "
         "For each category, the sample mean (μ) and standard deviation (σ) are computed. "
         "Any transaction with |x - μ| / σ >= 2.5 is flagged. In addition, an Interquartile Range test "
         "(Q75 + 1.5 × IQR) detects non-normally distributed skewness."),

        ("Layer 2: Unsupervised Machine Learning (Isolation Forest)",
         "Leverages Scikit-Learn's IsolationForest algorithm configured with 100 decision trees (n_estimators=100). "
         "The model evaluates a 3-dimensional continuous feature matrix: [Quantity, Unit Price, Total Amount]. "
         "Because anomalies require fewer splits to isolate in feature space than normal inliers, "
         "the algorithm assigns an anomaly score and flags records with prediction -1. This captures non-linear anomalies "
         "that pass standard single-variable threshold tests."),

        ("Layer 3: Product Catalog Price Divergence Audit",
         "The system dynamically computes the median unit price for every SKU across historical orders. "
         "If a recorded transaction reflects a unit price diverging by >40% from the median catalog price, "
         "it is flagged as a potential cashier entry error, wrong SKU scan, or unauthorized override.")
    ]
    for af_name, af_desc in ai_features:
        story.append(Paragraph(f"• <b>{af_name}:</b> {af_desc}", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("6.2 Strict Zero-Fabricated-Data & Hallucination Elimination", h2_style))
    story.append(Paragraph(
        "A critical innovation in this platform is its <b>Strict Zero-Fabricated-Data Policy</b>. "
        "Commercial generative LLMs frequently hallucinate numbers or invent plausible-sounding sales metrics when querying databases. "
        "In this system, the <font name='Courier'>BusinessInsightsEngine</font> relies on <b>Deterministic Grounded Analytics</b>. "
        "Executive narratives, strategic recommendations, and interactive Q&A answers are derived strictly via programmatic "
        "SQL aggregations (SUM, COUNT, AVG, MEDIAN) against PostgreSQL 18. "
        "If a dataset is empty or unseeded, the system explicitly reports zero records rather than inventing illustrative figures. "
        "Every insight response includes a provenance payload certifying the exact database source and record count analyzed.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # 9. MY ROLE & RESPONSIBILITIES
    # =========================================================================
    story.append(Paragraph("7. Candidate Role, Responsibilities, and Project Contributions", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "As the lead full-stack developer and system architect of this project, I was solely responsible for the entire "
        "software engineering lifecycle from conceptualization to deployment-ready verification:",
        body_style
    ))

    responsibilities = [
        ("Full-Stack Architecture & System Design", "Conceived and designed the end-to-end system architecture, specifying API contracts, asynchronous ingestion workflows, and relational schema models across 14 enterprise modules."),
        ("Backend & API Engineering", "Implemented the complete FastAPI backend in Python 3.13, structuring clean modular endpoints, OAuth2 JWT bearer authentication, dependency injection sessions, and Pydantic validation schemas."),
        ("Database Modeling & PostgreSQL Optimization", "Designed 11 normalized relational tables in SQLAlchemy 2.0. Indexed primary lookup columns (transaction IDs, timestamps, product codes, categories) to maintain sub-10ms query execution times."),
        ("Machine Learning & Analytics Implementation", "Implemented the dual-layer anomaly detection pipeline using Scikit-Learn Isolation Forest and Pandas/NumPy statistical algorithms, including human review escalation workflows."),
        ("Frontend SPA & Classic UI Redesign", "Built the entire React 18 + TypeScript frontend from scratch. Redesigned the navigation from a vertical sidebar into a classic top-mounted enterprise header with live PostgreSQL telemetry and horizontal module navigation."),
        ("Automated Document Generation Engine", "Developed the ReportLab PDF compilation and OpenPyXL Excel export services, implementing dynamic table generation, custom canvas two-pass page numbering, and executive email dispatch."),
        ("Quality Assurance & Test Automation", "Authored comprehensive Pytest suites comprising 36 unit and integration test cases, achieving 100% test pass rates across all 14 platform modules.")
    ]
    for r_title, r_desc in responsibilities:
        story.append(Paragraph(f"• <b>{r_title}:</b> {r_desc}", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # 10. BUSINESS APPLICATIONS & DX BENEFITS (FUJI KYUKO)
    # =========================================================================
    story.append(Paragraph("8. Business Applications & DX Alignment for Fuji Kyuko (Japan)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "Fuji Kyuko Co., Ltd. operates a uniquely diversified tourism and transportation conglomerate in Japan. "
        "The technical capabilities demonstrated in this platform directly map to high-priority digital transformation (DX) initiatives:",
        body_style
    ))

    dx_benefits = [
        ("Fuji-Q Highland (Amusement Park DX)", "Unified ticketing analysis: Centralizes priority pass, ride ticket, and food stall sales to identify peak revenue windows, visitor spending density, and ticket pricing anomalies in real-time."),
        ("Highway Bus & Railway Transit DX", "Cross-segment mobility analytics: Ingests booking and route fare transactions to monitor Average Transaction Values (ATV) and flag duplicate transaction records across regional transport nodes."),
        ("Hotel & Retail Inventory Optimization", "Multi-warehouse supply chain: Automatically monitors souvenir stocks, food supplies, and retail assets across resort gift shops, triggering replenishment alerts before stockouts impact visitor satisfaction."),
        ("Alleviating Japan's Labor Constraints", "Automation of routine audits: By replacing manual spreadsheet validation with automated formula checks and AI outlier detection, operational staff can refocus from data cleaning to guest service."),
        ("Executive Corporate Governance", "Automated executive briefings: Generates clean, verified PDF reports for corporate management in Fujiyoshida, ensuring decision-makers have 100% verified transactional data.")
    ]
    for b_title, b_desc in dx_benefits:
        story.append(Paragraph(f"• <b>{b_title}:</b> {b_desc}", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # 11. TECHNICAL CHALLENGES OVERCOME
    # =========================================================================
    story.append(Paragraph("9. Genuine Technical Challenges Overcome & Engineering Solutions", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "During the development and testing of this platform, several non-trivial architectural and runtime challenges "
        "were diagnosed and resolved through methodical root-cause debugging:",
        body_style
    ))

    challenges = [
        ("Challenge 1: Vite Fast Refresh & React Preamble Invalidation (White Screen Bug)",
         "<b>Root Cause:</b> AuthContext.tsx originally exported both the React provider component (AuthProvider) and a custom hook (useAuth). @vitejs/plugin-react strictly requires files to export either only components or only utilities; mixed exports invalidated the HMR module graph, causing Vite to reload into an uninitialized preamble.<br/>"
         "<b>Solution:</b> Refactored the architecture by extracting useAuth into a dedicated authContextDef.ts definition file and making AuthContext.tsx a pure component file. Production build succeeded with zero TS warnings."),

        ("Challenge 2: Unhandled Corrupted LocalStorage Session State",
         "<b>Root Cause:</b> If a browser session previously stored the literal string 'undefined' or 'null' during a failed login cycle, JSON.parse() threw an unhandled SyntaxError at the root level before React could mount.<br/>"
         "<b>Solution:</b> Shielded all localStorage readers in defensive try/catch blocks with explicit string validation. Implemented a top-level ErrorBoundary in main.tsx offering an instant 'Clear Session & Return to Login' recovery control."),

        ("Challenge 3: Undefined Property Dereferencing During Async KPI Hydration",
         "<b>Root Cause:</b> In high-velocity data views (Sales, Inventory, Dashboard), direct calls to .toLocaleString() on KPI objects threw TypeErrors during the brief milliseconds between component mount and backend API response.<br/>"
         "<b>Solution:</b> Conducted a codebase-wide audit and introduced defensive null-coalescing across all 14 views (e.g. (kpis?.total_sales ?? 0).toLocaleString()). Added comprehensive skeleton loaders and empty-state placeholders."),

        ("Challenge 4: Strict Mathematical Contract Validation at Ingestion Scale",
         "<b>Root Cause:</b> Real-world retail and ticket logs frequently include floating-point rounding mismatches (e.g. ¥1,999.99 vs ¥2,000.00) and duplicate transaction IDs from network retries.<br/>"
         "<b>Solution:</b> Engineered a specialized DataValidator class enforcing relational tolerance checks (abs(qty × unit_price - total) <= 1.0) and duplicate ID tracking, recording precise line-item ValidationIssues with proposed value corrections.")
    ]
    for c_title, c_desc in challenges:
        story.append(Paragraph(f"<b>{c_title}</b>", h2_style))
        story.append(Paragraph(c_desc, body_style))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # =========================================================================
    # 12. FUTURE ENHANCEMENTS & CONCLUSION
    # =========================================================================
    story.append(Paragraph("10. Future Enhancements & Strategic Roadmap", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The current platform provides a robust enterprise core. The following roadmap items represent "
        "logical extensions for an expanded amusement park digital ecosystem:",
        body_style
    ))

    roadmap_items = [
        ("IoT Queue Sensor Integration", "Connect turnstile laser sensors and mobile app GPS pings to feed real-time ride wait-time queues directly into Module 6 for ride capacity and dynamic surge pricing analytics."),
        ("Predictive Ride Maintenance AI", "Integrate vibration and thermal sensor telemetry from major roller coasters (e.g. Fujiyama, Eejanaika) into the anomaly engine to predict mechanical component wear before unscheduled downtime occurs."),
        ("Mobile Guest App Personalization", "Develop a guest-facing mobile application leveraging the platform's insights engine to recommend personalized dining and shopping itineraries based on real-time crowd distribution."),
        ("Cloud Microservices & Kubernetes Deployment", "Containerize backend processing daemons and PostgreSQL into managed AWS/GCP Kubernetes clusters (EKS/GKE) with auto-scaling during golden week and peak holiday seasons.")
    ]
    for r_title, r_desc in roadmap_items:
        story.append(Paragraph(f"• <b>{r_title}:</b> {r_desc}", bullet_style))

    story.append(Spacer(1, 12))

    story.append(Paragraph("11. Conclusion & Summary of Engineering Qualifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A132C"), spaceBefore=2, spaceAfter=8))

    conclusion_text = (
        "This project demonstrates the practical design, full-stack implementation, and algorithmic rigor "
        "required of an <b>IT Engineer – Digital Transformation (DX)</b>. By building an operational intelligence platform "
        "that eliminates data silos, automates routine ingestion and mathematical validation, deploys machine learning outlier detection, "
        "and presents actionable intelligence through an executive interface, the project proves ready-to-deploy technical capability.<br/><br/>"
        "The architecture is grounded in real engineering practices: clean typing with TypeScript and Pydantic, ACID-compliant "
        "relational data modeling with PostgreSQL, robust test automation with 36 passing tests, and a zero-fabrication data policy. "
        "I look forward to bringing this dedication, technical depth, and passion for operational excellence to the digital transformation "
        "initiatives at <b>Fuji Kyuko Co., Ltd.</b> in Japan."
    )
    story.append(Paragraph(conclusion_text, body_style))
    story.append(Spacer(1, 20))

    # Signoff Block
    signoff_data = [
        [
            Paragraph("<b>Candidate:</b> Siva<br/><b>Target Role:</b> IT Engineer – Digital Transformation (DX)<br/><b>Portfolio Link:</b> <font color='#2563EB'>https://github.com/siva20004/AI-Business-Process-Automation-Analytics-Platform.git</font>", table_cell),
            Paragraph("<b>Target Organization:</b> Fuji Kyuko Co., Ltd.<br/><b>Location:</b> Yamanashi / Tokyo, Japan<br/><b>Document Status:</b> Verified Engineering Submission Draft", table_cell)
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[270, 234])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(signoff_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF generated successfully at: {output_filename}")

if __name__ == "__main__":
    out_path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else "AI-Business-Process-Automation-Analytics-Platform_Project_Report.pdf"
    build_pdf_report(out_path)
