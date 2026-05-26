"""
Render docs/prfaq.md → docs/prfaq.pdf

Hand-built ReportLab layout so we control typography, spacing, and the
brand mark instead of relying on a generic markdown-to-PDF converter.
"""
import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle,
    KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD   = os.path.join(ROOT, "docs",  "prfaq.md")
PDF  = os.path.join(ROOT, "docs",  "prfaq.pdf")
LOGO = os.path.join(ROOT, "frontend", "public", "images", "stadium-emoji-clipart-md.png")

# ── Brand palette (matches the app's design tokens) ─────────────────
ACCENT      = HexColor("#ea580c")
TEXT        = HexColor("#0f172a")
TEXT_2      = HexColor("#475569")
TEXT_3      = HexColor("#94a3b8")
BORDER      = HexColor("#e2e8f0")
BG_SOFT     = HexColor("#f8fafc")

# ── Paragraph styles ────────────────────────────────────────────────
styles = getSampleStyleSheet()

H1 = ParagraphStyle("H1", parent=styles["Heading1"],
    fontName="Helvetica-Bold", fontSize=22, leading=26,
    textColor=TEXT, spaceBefore=0, spaceAfter=6, alignment=TA_LEFT)
H2 = ParagraphStyle("H2", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=16, leading=20,
    textColor=TEXT, spaceBefore=18, spaceAfter=6, alignment=TA_LEFT)
H3 = ParagraphStyle("H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=12.5, leading=16,
    textColor=ACCENT, spaceBefore=14, spaceAfter=4, alignment=TA_LEFT)
H4 = ParagraphStyle("H4", parent=styles["Heading4"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=TEXT, spaceBefore=10, spaceAfter=3, alignment=TA_LEFT)
BODY = ParagraphStyle("Body", parent=styles["BodyText"],
    fontName="Helvetica", fontSize=10, leading=15,
    textColor=TEXT, spaceBefore=0, spaceAfter=6, alignment=TA_LEFT)
SMALL = ParagraphStyle("Small", parent=BODY,
    fontSize=8.5, leading=12, textColor=TEXT_3)
QUOTE = ParagraphStyle("Quote", parent=BODY,
    fontName="Helvetica-Oblique", fontSize=10, leading=15,
    leftIndent=14, rightIndent=14, textColor=TEXT_2,
    spaceBefore=6, spaceAfter=8)
EYEBROW = ParagraphStyle("Eyebrow", parent=BODY,
    fontName="Helvetica-Bold", fontSize=8.5, leading=11,
    textColor=ACCENT, spaceBefore=0, spaceAfter=4)

# ── Markdown helpers (we hand-walk our own MD so we get clean styling) ──
def inline_md_to_rl(text):
    """Convert a single line of markdown to ReportLab-flavored HTML."""
    # links [text](url) → <link>text</link>
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2" color="#ea580c">\1</link>', text)
    # bold **x**
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    # italic *x* (after bold)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)
    # inline code `x`
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" backColor="#f1f5f9">\1</font>', text)
    return text

def parse_table(lines, idx):
    """Parse a markdown table starting at idx. Returns (Table flowable, next_idx)."""
    rows = []
    while idx < len(lines) and "|" in lines[idx]:
        line = lines[idx].strip()
        if re.match(r"^\|[\s\-:|]+\|$", line):
            idx += 1
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append([Paragraph(inline_md_to_rl(c), BODY) for c in cells])
        idx += 1

    if not rows:
        return None, idx

    n_cols = max(len(r) for r in rows)
    for r in rows:
        while len(r) < n_cols:
            r.append(Paragraph("", BODY))

    col_w = (160 * mm) / n_cols
    t = Table(rows, colWidths=[col_w] * n_cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("TEXTCOLOR",  (0, 0), (-1, 0), TEXT),
        ("BACKGROUND", (0, 0), (-1, 0), BG_SOFT),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, BORDER),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, BORDER),
    ]))
    return t, idx

def parse_md(path):
    """Walk the markdown line-by-line and emit ReportLab flowables."""
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()

    story = []
    i = 0
    in_list = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Horizontal rule → thin grey divider with vertical room
        if stripped == "---":
            story.append(Spacer(1, 8))
            story.append(Table([[""]], colWidths=[170*mm], rowHeights=[0.4],
                          style=TableStyle([("LINEABOVE", (0,0), (-1,0), 0.4, BORDER)])))
            story.append(Spacer(1, 8))
            i += 1
            continue

        # Tables
        if "|" in stripped and i + 1 < len(lines) and re.match(r"^\|[\s\-:|]+\|$", lines[i+1].strip()):
            t, i = parse_table(lines, i)
            if t: story.append(t)
            story.append(Spacer(1, 6))
            continue

        # Headings
        if stripped.startswith("#### "):
            story.append(Paragraph(inline_md_to_rl(stripped[5:]), H4))
            i += 1; continue
        if stripped.startswith("### "):
            story.append(Paragraph(inline_md_to_rl(stripped[4:]), H3))
            i += 1; continue
        if stripped.startswith("## "):
            story.append(Paragraph(inline_md_to_rl(stripped[3:]), H2))
            i += 1; continue
        if stripped.startswith("# "):
            story.append(Paragraph(inline_md_to_rl(stripped[2:]), H1))
            i += 1; continue

        # Blockquote
        if stripped.startswith("> "):
            block = []
            while i < len(lines) and lines[i].strip().startswith("> "):
                block.append(lines[i].strip()[2:])
                i += 1
            story.append(Paragraph(inline_md_to_rl(" ".join(block)), QUOTE))
            continue

        # Bullet list
        if re.match(r"^[\*\-] ", stripped):
            items = []
            while i < len(lines) and re.match(r"^[\*\-] ", lines[i].strip()):
                items.append(lines[i].strip()[2:])
                i += 1
            for it in items:
                story.append(Paragraph("• " + inline_md_to_rl(it), BODY))
            continue

        # Numbered list
        if re.match(r"^\d+\. ", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\. ", lines[i].strip()):
                # keep the leading number for emphasis
                num, _, rest = lines[i].strip().partition(". ")
                items.append((num, rest))
                i += 1
            for num, it in items:
                story.append(Paragraph(f"<b>{num}.</b> {inline_md_to_rl(it)}", BODY))
            continue

        # Italic-only line (centered, like the team byline)
        if stripped.startswith("*") and stripped.endswith("*") and "**" not in stripped:
            story.append(Paragraph(inline_md_to_rl(stripped), SMALL))
            i += 1; continue

        # Blank line
        if not stripped:
            story.append(Spacer(1, 4))
            i += 1; continue

        # Plain paragraph
        story.append(Paragraph(inline_md_to_rl(stripped), BODY))
        i += 1

    return story

# ── Page template with header (logo + brand bar) and footer ─────────
def draw_chrome(canvas, doc):
    canvas.saveState()
    page_w, page_h = A4

    # Header bar
    if os.path.exists(LOGO):
        canvas.drawImage(LOGO, 18*mm, page_h - 22*mm, width=10*mm, height=10*mm,
                         mask="auto", preserveAspectRatio=True)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(TEXT)
    canvas.drawString(31*mm, page_h - 17*mm, "Connected Arena")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(TEXT_3)
    canvas.drawString(31*mm, page_h - 21*mm, "PRFAQ · AWS Sports AI Innovation Cup 2026")

    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(18*mm, page_h - 25*mm, page_w - 18*mm, page_h - 25*mm)

    # Footer
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(TEXT_3)
    canvas.drawString(18*mm, 12*mm, "github.com/pacyuzu16/connected-arena")
    canvas.drawRightString(page_w - 18*mm, 12*mm, f"Page {doc.page}")

    canvas.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        PDF, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=30*mm, bottomMargin=18*mm,
        title="Connected Arena — PRFAQ",
        author="Carine UMUGABEKAZE, ISHIMWE Ami Paradis, CYUZUZO Pacifique",
    )
    story = parse_md(MD)
    doc.build(story, onFirstPage=draw_chrome, onLaterPages=draw_chrome)
    size_kb = os.path.getsize(PDF) // 1024
    print(f"✓ Wrote {PDF}")
    print(f"  Size: {size_kb} KB")

if __name__ == "__main__":
    build_pdf()
