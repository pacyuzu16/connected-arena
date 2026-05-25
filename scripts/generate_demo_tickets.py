"""
Generate sample QR-coded match tickets for each venue.
Drop the output PNGs into the demo deck or print them out so the
judges can scan a real ticket during the live demo.

Output: docs/tickets/TICKET_<VENUE>.png
"""
import os
import qrcode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "docs", "tickets")
os.makedirs(OUT, exist_ok=True)

# venue code → ticket payload (matches the parser in TicketScan.jsx)
DEMO_TICKETS = [
    ("FORSTEREI", "B12-78", "DEMO-FAN"),
    ("YELLOW",    "Q05-42", "DEMO-FAN"),
    ("STJAMES",   "U17-11", "DEMO-FAN"),
    ("CELTIC",    "G09-93", "DEMO-FAN"),
    ("HSILES",    "S22-04", "DEMO-FAN"),
    ("STKHOLM",   "A03-19", "DEMO-FAN"),
]

for venue, seat, name in DEMO_TICKETS:
    payload = f"{venue}-{seat}-{name}"
    img = qrcode.make(payload, box_size=10, border=2)
    path = os.path.join(OUT, f"TICKET_{venue}.png")
    img.save(path)
    print(f"  ✓ {payload:<32} -> {path}")

print()
print(f"Wrote {len(DEMO_TICKETS)} demo tickets to {OUT}")
print("Scan any of them at: https://d1706ex99mjina.cloudfront.net/app")
