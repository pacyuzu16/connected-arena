"use client";

import { t, LANGUAGES } from "../utils/i18n";

/**
 * SettingsPanel — embedded inside the profile (desktop & mobile).
 * Props:
 *   settings : current settings object from useSettings()
 *   update   : (patch) => void
 *   reset    : () => void
 */
export default function SettingsPanel({ settings, update, reset }) {
  const lang = settings.language;

  const toggleRows = [
    { key: "mutePredictions",   icon: "🎯", labelKey: "settings.mutePredictions"   },
    { key: "muteCommentary",    icon: "🎙️", labelKey: "settings.muteCommentary"    },
    { key: "muteNotifications", icon: "🔔", labelKey: "settings.muteNotifications" },
    { key: "sound",             icon: "🔊", labelKey: "settings.sound",            invert: true },
  ];

  return (
    <div className="settings-panel">
      <div className="settings-hdr">⚙️ {t(lang, "settings.title")}</div>

      {/* Toggles */}
      <div className="settings-list">
        {toggleRows.map(row => {
          // For mute toggles, "ON" = muted. For sound, "ON" = sound on.
          const value = row.invert ? settings[row.key] : !settings[row.key];
          return (
            <button
              key={row.key}
              className={`settings-row ${value ? "is-on" : "is-off"}`}
              onClick={() => update({ [row.key]: !settings[row.key] })}
            >
              <span className="settings-icon">{row.icon}</span>
              <span className="settings-label">{t(lang, row.labelKey)}</span>
              <span className={`settings-toggle ${value ? "on" : "off"}`}>
                <span className="settings-toggle-dot" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Language switcher */}
      <div className="settings-section-title">🌐 {t(lang, "settings.language")}</div>
      <div className="settings-langs">
        {LANGUAGES.map(L => (
          <button
            key={L.code}
            className={`settings-lang ${L.code === lang ? "active" : ""}`}
            onClick={() => update({ language: L.code })}
          >
            <span className="settings-lang-flag">{L.flag}</span>
            <span className="settings-lang-name">{L.name}</span>
          </button>
        ))}
      </div>

      {/* Reset */}
      <button className="settings-reset" onClick={reset}>
        ↺ {t(lang, "settings.reset")}
      </button>
    </div>
  );
}
