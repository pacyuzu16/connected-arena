"""
Render the architecture diagram.

Strategy: build the SVG visuals via svglib → PNG, then paste the real
stadium logo PNG on top using PIL. This guarantees the actual brand
logo is in the final image instead of a text monogram, without
fighting svglib's inconsistent handling of embedded base64 images.

Output: docs/architecture.png
"""
import os
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG  = os.path.join(ROOT, "docs",     "architecture.svg")
PNG  = os.path.join(ROOT, "docs",     "architecture.png")
LOGO = os.path.join(ROOT, "frontend", "public", "images", "stadium-emoji-clipart-md.png")

# ── 1. Render SVG → PNG. svglib + reportlab's combined behaviour with
#    scale() + dpi yields a 4x scale (not 2x), so the final PNG is
#    4800x3280 from a 1200x820 viewBox. We bake that in below. ──────
drawing = svg2rlg(SVG)
drawing.scale(2, 2)
drawing.width  *= 2
drawing.height *= 2
renderPM.drawToFile(drawing, PNG, fmt="PNG", dpi=144)

base = Image.open(PNG).convert("RGBA")
SVG_W, SVG_H = 1200, 820
PNG_W, PNG_H = base.size                  # actually 4800x3280
PX_PER_SVG   = PNG_W / SVG_W              # = 4.0

# ── 2. Composite the real stadium logo over the "CA" mark ───────────
# Brand mark in SVG coords: rect at (40, 36) size 44x44.
from PIL import ImageDraw
sx, sy, sz = 40, 36, 44                   # SVG coords
LOGO_X    = round(sx * PX_PER_SVG)
LOGO_Y    = round(sy * PX_PER_SVG)
LOGO_SIZE = round(sz * PX_PER_SVG)
logo = Image.open(LOGO).convert("RGBA")
logo_resized = logo.resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)

# White out the orange "CA" rectangle so the logo's transparent
# background blends into the page color, not the orange square.
draw = ImageDraw.Draw(base)
draw.rounded_rectangle(
    [LOGO_X, LOGO_Y, LOGO_X + LOGO_SIZE, LOGO_Y + LOGO_SIZE],
    radius=round(11 * PX_PER_SVG), fill=(248, 250, 252, 255),
)

# Paste logo with alpha
base.paste(logo_resized, (LOGO_X, LOGO_Y), logo_resized)
base.convert("RGB").save(PNG, "PNG", optimize=True)

size_kb = os.path.getsize(PNG) // 1024
print(f"✓ Wrote {PNG}")
print(f"  Size: {size_kb} KB")
print(f"  Logo: {LOGO_SIZE}x{LOGO_SIZE} at ({LOGO_X},{LOGO_Y})")
