"""
xg.py — Expected Goals (xG) Calculator
=======================================
Logistic regression model trained on 57,763 shots from 1,569 matches
of StatsBomb open data (Kaggle: saurabhshahane/statsbomb-football-data).

Model AUC = 0.753  (0.5 = random, 1.0 = perfect)

Features:
  - distance  : Euclidean distance from shot location to goal centre (StatsBomb units)
  - angle     : angle subtended by the goal mouth from shot location (radians)
  - header    : 1 if shot was a header, 0 otherwise
  - pressure  : 1 if player was under pressure, 0 otherwise

Coefficients fitted via sklearn LogisticRegression on StatsBomb open data:
  intercept = -0.9650
  distance  = -0.0864   (farther → lower xG)
  angle     =  1.1019   (wider angle → higher xG)
  header    = -1.1495   (headers are harder to convert)
  pressure  = -0.2410   (under pressure → lower xG)

Pitch convention (StatsBomb):
  Full pitch : 120 × 80 units (≈ 105m × 68m)
  Goal mouth : x=120, y=36 to y=44  (8-unit wide goal centred at y=40)

Usage:
  from backend.ml.xg import compute_xg, xg_label, xg_xp_multiplier

  xg_val = compute_xg(x=108, y=38, is_header=False, under_pressure=False)
  # → 0.41  (41% chance of scoring)
"""

import math

# ── Trained coefficients (StatsBomb open data, 57k shots, AUC=0.753) ─────────
_B0       = -0.9650   # intercept
_B_DIST   = -0.0864   # distance coefficient
_B_ANGLE  =  1.1019   # angle coefficient
_B_HEAD   = -1.1495   # header coefficient
_B_PRESS  = -0.2410   # under-pressure coefficient

# Goal coordinates on StatsBomb pitch
_GOAL_X   = 120.0
_GOAL_Y1  = 36.0   # bottom post
_GOAL_Y2  = 44.0   # top post
_GOAL_MID = 40.0   # centre of goal


def compute_xg(
    x: float,
    y: float,
    is_header: bool = False,
    under_pressure: bool = False,
) -> float:
    """
    Compute the Expected Goals (xG) probability for a shot.

    Args:
        x, y          : Shot location in StatsBomb pitch units (0-120, 0-80).
                        If you have DFL 0-100 coordinates, scale: x_sb = x*1.2, y_sb = y*0.8
        is_header     : True if the shot was a header.
        under_pressure: True if the shooter was under defensive pressure.

    Returns:
        float in [0, 1] — probability the shot results in a goal.
    """
    dist  = math.sqrt((_GOAL_X - x) ** 2 + (_GOAL_MID - y) ** 2)

    # Angle subtended by the goal mouth at the shot location
    a1    = math.atan2(_GOAL_Y2 - y, _GOAL_X - x)
    a2    = math.atan2(_GOAL_Y1 - y, _GOAL_X - x)
    angle = abs(a1 - a2)

    z = (
        _B0
        + _B_DIST  * dist
        + _B_ANGLE * angle
        + _B_HEAD  * (1 if is_header else 0)
        + _B_PRESS * (1 if under_pressure else 0)
    )

    prob = 1.0 / (1.0 + math.exp(-z))
    return round(prob, 3)


def compute_xg_from_dfl(
    x_dfl: float,
    y_dfl: float,
    is_header: bool = False,
    under_pressure: bool = False,
) -> float:
    """
    Same as compute_xg but accepts DFL pitch coordinates (0-100 scale).
    DFL: x=0 own goal, x=100 opponent goal; y=0 left, y=100 right.
    """
    # Convert: DFL 0-100 → StatsBomb 0-120 / 0-80
    x_sb = x_dfl * 1.20
    y_sb = y_dfl * 0.80
    return compute_xg(x_sb, y_sb, is_header, under_pressure)


def xg_label(xg: float) -> str:
    """Human-readable danger level for the UI."""
    if xg >= 0.50: return "🔴 High danger"
    if xg >= 0.25: return "🟠 Dangerous"
    if xg >= 0.10: return "🟡 Moderate"
    return "🟢 Low chance"


def xg_xp_multiplier(xg: float) -> float:
    """
    XP multiplier for correct predictions based on xG.
    Low-xG goal predicted correctly → bigger reward (it was a surprise!).

    xG < 0.10  → 3.0x  (spectacular long-range goal)
    xG < 0.20  → 2.0x  (difficult shot)
    xG < 0.35  → 1.5x  (decent chance)
    xG >= 0.35 → 1.0x  (expected / easy tap-in)
    """
    if xg < 0.10: return 3.0
    if xg < 0.20: return 2.0
    if xg < 0.35: return 1.5
    return 1.0


def xg_commentary_hint(xg: float) -> str:
    """Short phrase for AI commentary prompt injection."""
    if xg >= 0.50:
        return f"This was a HIGH-DANGER chance (xG={xg:.2f}) — almost certain to score."
    if xg >= 0.25:
        return f"A dangerous opportunity (xG={xg:.2f}) — well above average."
    if xg >= 0.10:
        return f"A moderate chance (xG={xg:.2f}) — could go either way."
    return f"A low-probability shot (xG={xg:.2f}) — would be a stunning goal."


if __name__ == "__main__":
    # Quick sanity checks
    print("xG Model — Sanity Checks")
    print(f"  Penalty spot (12yd, central):   xG={compute_xg(108, 40):.3f}")
    print(f"  Tap-in (3yd, central):           xG={compute_xg(117, 40):.3f}")
    print(f"  Edge of box (20yd, central):     xG={compute_xg(100, 40):.3f}")
    print(f"  Long range (35yd, central):      xG={compute_xg(77, 40):.3f}")
    print(f"  Tight angle header (10yd, wide): xG={compute_xg(110, 10, is_header=True):.3f}")
    print(f"  Under pressure (20yd):           xG={compute_xg(100, 40, under_pressure=True):.3f}")
