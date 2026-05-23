/**
 * i18n.js — tiny dictionary-based translator.
 *
 * Usage:
 *   import { t } from "../utils/i18n";
 *   t(language, "predict.yes")   // → "YES!"  /  "OUI !"  /  "YEGO!"  /  "NDIYO!"
 *
 * Add keys as needed. Falling back to English when a key is missing.
 */

export const LANGUAGES = [
  { code: "en", name: "English",     flag: "🇬🇧" },
  { code: "fr", name: "Français",    flag: "🇫🇷" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "sw", name: "Kiswahili",   flag: "🇰🇪" },
];

const DICT = {
  // ── Navigation tabs ───────────────────────────────────────────────
  "tab.home":        { en: "Home",        fr: "Accueil",     rw: "Ahabanza",  sw: "Nyumbani" },
  "tab.arena":       { en: "Arena",       fr: "Arène",       rw: "Ikibuga",   sw: "Uwanja"   },
  "tab.leaderboard": { en: "Leaderboard", fr: "Classement",  rw: "Urutonde",  sw: "Bao"      },
  "tab.chat":        { en: "Chat",        fr: "Chat",        rw: "Ikiganiro", sw: "Mazungumzo" },
  "tab.profile":     { en: "Profile",     fr: "Profil",      rw: "Umwirondoro", sw: "Wasifu" },

  // ── Predictions ────────────────────────────────────────────────────
  "predict.q":     { en: "Will this result in a goal?", fr: "Sera-ce un but ?",          rw: "Ese hazaba igitego?",        sw: "Je, hii itaisha kuwa goli?" },
  "predict.yes":   { en: "YES!",  fr: "OUI !", rw: "YEGO!", sw: "NDIYO!" },
  "predict.no":    { en: "NO",    fr: "NON",   rw: "OYA",   sw: "HAPANA" },
  "predict.hint":  { en: "Tap to lock in your prediction", fr: "Touchez pour valider", rw: "Kanda kugira ngo wemeze", sw: "Bonyeza kuthibitisha" },

  // ── Settings ───────────────────────────────────────────────────────
  "settings.title":             { en: "Settings",                 fr: "Paramètres",            rw: "Igenamiterere",            sw: "Mipangilio" },
  "settings.mutePredictions":   { en: "Mute prediction popups",   fr: "Masquer les pronostics",rw: "Hisha utuwindo two guhanura",   sw: "Zima madirisha ya ubashiri" },
  "settings.muteCommentary":    { en: "Mute AI commentary",       fr: "Masquer les commentaires IA",rw: "Hisha ibisobanuro by'AI",  sw: "Zima maoni ya AI" },
  "settings.muteNotifications": { en: "Mute notifications",       fr: "Couper les notifications",rw: "Hagarika integuza",         sw: "Zima arifa" },
  "settings.sound":             { en: "Sound effects",            fr: "Effets sonores",        rw: "Ijwi",                       sw: "Sauti" },
  "settings.language":          { en: "Language",                 fr: "Langue",                rw: "Ururimi",                    sw: "Lugha" },
  "settings.reset":             { en: "Reset to defaults",        fr: "Réinitialiser",         rw: "Subira ku byaregaga",        sw: "Rudisha kawaida" },

  // ── Profile actions ────────────────────────────────────────────────
  "profile.editIdentity": { en: "Edit Identity", fr: "Modifier l'identité", rw: "Hindura izina", sw: "Hariri jina"   },
  "profile.leave":        { en: "Leave Arena",   fr: "Quitter l'arène",     rw: "Sohoka",        sw: "Toka uwanjani" },

  // ── Common ─────────────────────────────────────────────────────────
  "common.save":   { en: "Save",   fr: "Enregistrer", rw: "Bika",    sw: "Hifadhi" },
  "common.cancel": { en: "Cancel", fr: "Annuler",     rw: "Reka",    sw: "Ghairi"  },
  "common.on":     { en: "On",     fr: "Activé",      rw: "Bifunguye", sw: "Imewashwa" },
  "common.off":    { en: "Off",    fr: "Désactivé",   rw: "Bifunze",   sw: "Imezimwa"  },
};

export function t(lang, key) {
  const entry = DICT[key];
  if (!entry) return key;             // missing key — show the key itself
  return entry[lang] || entry.en || key;
}
