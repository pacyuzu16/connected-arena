"""Render docs/architecture.svg to docs/architecture.png at high quality."""
import os
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG  = os.path.join(ROOT, "docs", "architecture.svg")
PNG  = os.path.join(ROOT, "docs", "architecture.png")

drawing = svg2rlg(SVG)
drawing.scale(2.0, 2.0)
drawing.width  *= 2
drawing.height *= 2
renderPM.drawToFile(drawing, PNG, fmt="PNG", dpi=144)
print(f"✓ Wrote {PNG}")
print(f"  Size: {os.path.getsize(PNG)//1024} KB")
