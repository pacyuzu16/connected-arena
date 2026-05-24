/**
 * venues.js — stadium directory for Connected Arena.
 *
 * Each entry is a real-world venue a fan can "enter" to access the
 * matching live (or upcoming) experience. For the demo build, the two
 * "LIVE" venues both forward to the shared real match data, while the
 * remaining venues are previewed as upcoming so the catalogue feels
 * complete.
 *
 * Adding a new venue?
 *   - Pick a stable 6-char code (uppercase, alphanumeric)
 *   - Drop an image into /public/images and reference its filename
 *   - Set status: "live" | "upcoming" | "soon"
 */

export const VENUES = [
  {
    code:        "FORSTEREI",
    name:        "Stadion An der Alten Försterei",
    short:       "Försterei",
    city:        "Berlin",
    country:     "Germany",
    capacity:    22012,
    image:       "/images/Stadion_An_der_Alten_Forsterei_1024x1024.jpg",
    homeTeam:    { code: "UNI", name: "Union Berlin", color: "#ef4444" },
    awayTeam:    { code: "BAY", name: "Bayern Munich", color: "#dc2626" },
    status:      "live",
    matchLabel:  "Live now",
    description: "The fortress in Köpenick. Steep stands, deafening singing, and the only Bundesliga ground where fans stand for every minute.",
  },
  {
    code:        "YELLOW",
    name:        "Signal Iduna Park",
    short:       "Westfalenstadion",
    city:        "Dortmund",
    country:     "Germany",
    capacity:    81365,
    image:       "/images/Dortmund_fans_in_the_Yellow_Wall_1024x1024.jpg",
    homeTeam:    { code: "BVB", name: "Borussia Dortmund", color: "#fde047" },
    awayTeam:    { code: "BAY", name: "Bayern Munich", color: "#dc2626" },
    status:      "live",
    matchLabel:  "Live now",
    description: "Home of the Yellow Wall — 25,000 fans, one voice, standing room only. The loudest single stand in world football.",
  },
  {
    code:        "STJAMES",
    name:        "St. James' Park",
    short:       "St. James'",
    city:        "Newcastle",
    country:     "England",
    capacity:    52404,
    image:       "/images/St_James_Park_Newcastle_1024x1024.jpg",
    homeTeam:    { code: "NEW", name: "Newcastle United", color: "#1e293b" },
    awayTeam:    { code: "ARS", name: "Arsenal",          color: "#ef4444" },
    status:      "upcoming",
    matchLabel:  "Kicks off in 02:34:00",
    kickoffIn:   "02:34:00",
    description: "The cathedral on the hill. A sea of black and white in the heart of Newcastle, where every home match shakes the Tyne.",
  },
  {
    code:        "CELTIC",
    name:        "Celtic Park",
    short:       "Paradise",
    city:        "Glasgow",
    country:     "Scotland",
    capacity:    60411,
    image:       "/images/Celtic_Park_1024x1024.jpg",
    homeTeam:    { code: "CEL", name: "Celtic FC",        color: "#22c55e" },
    awayTeam:    { code: "RAN", name: "Rangers FC",       color: "#3b82f6" },
    status:      "upcoming",
    matchLabel:  "Kicks off Sunday · 15:00",
    description: "They call it Paradise. The Old Firm derby in a 60,000-strong wall of green, where you don't watch — you live it.",
  },
  {
    code:        "HSILES",
    name:        "Estadio Hernando Siles",
    short:       "Hernando Siles",
    city:        "La Paz",
    country:     "Bolivia",
    capacity:    41143,
    image:       "/images/Estadio_Hernando_Siles_1024x1024.jpg",
    homeTeam:    { code: "BOL", name: "Bolivia",          color: "#16a34a" },
    awayTeam:    { code: "ARG", name: "Argentina",        color: "#60a5fa" },
    status:      "upcoming",
    matchLabel:  "Kicks off Wednesday · 21:00",
    description: "3,637 metres above sea level. The visitors come thin on oxygen and thick on regret — football at the edge of the sky.",
  },
  {
    code:        "STKHOLM",
    name:        "3Arena",
    short:       "3Arena Stockholm",
    city:        "Stockholm",
    country:     "Sweden",
    capacity:    16000,
    image:       "/images/3Arena_Stockholm_1024x1024.jpg",
    homeTeam:    { code: "AIK", name: "AIK Stockholm",    color: "#000000" },
    awayTeam:    { code: "HAM", name: "Hammarby",         color: "#16a34a" },
    status:      "soon",
    matchLabel:  "Coming soon",
    description: "Closed roof, electric crowd. The Stockholm derby with everything to play for — and not a seat left empty.",
  },
];

export function findVenue(code) {
  if (!code) return null;
  return VENUES.find(v => v.code === code.toUpperCase()) || null;
}

export const LIVE_VENUES     = VENUES.filter(v => v.status === "live");
export const UPCOMING_VENUES = VENUES.filter(v => v.status !== "live");
