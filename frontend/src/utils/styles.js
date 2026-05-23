/**
 * styles.js
 * ---------
 * Global CSS injected at runtime via a <style> tag.
 * Kept here so App.jsx stays focused on structure.
 */

export const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent:     #f97316;
    --accent-dim: rgba(249,115,22,0.14);
    --green:      #10b981;
    --red:        #ef4444;
    --radius:     14px;
    --radius-sm:  8px;
    --shadow-lg:  0 8px 48px rgba(0,0,0,0.2);
    --t:          0.18s ease;
  }

  @media (prefers-color-scheme: light) {
    :root {
      --bg:        #f1f5f9;
      --surface:   #ffffff;
      --surface2:  #f8fafc;
      --border:    #e2e8f0;
      --text:      #0f172a;
      --text-2:    #475569;
      --text-3:    #94a3b8;
      --hdr:       #ffffff;
    }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg:        #0b1120;
      --surface:   #131f35;
      --surface2:  #1a2a44;
      --border:    #1e3150;
      --text:      #f1f5f9;
      --text-2:    #94a3b8;
      --text-3:    #475569;
      --hdr:       #0f1a2e;
    }
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
  }

  .join-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .join-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 44px 40px;
    width: 100%;
    max-width: 420px;
    box-shadow: var(--shadow-lg);
    text-align: center;
  }

  .join-logo  { font-size: 68px; line-height: 1; margin-bottom: 12px; }
  .join-title { font-size: 26px; font-weight: 800; color: var(--accent); letter-spacing: -0.4px; }
  .join-sub   { color: var(--text-2); font-size: 14px; margin: 6px 0 32px; }

  .f-label {
    display: block;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    margin-bottom: 7px;
  }

  .f-group { margin-bottom: 18px; }

  .f-input {
    width: 100%;
    padding: 13px 16px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    font-size: 15px;
    outline: none;
    transition: border-color var(--t), box-shadow var(--t);
  }

  .f-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  .persona-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 26px;
  }

  .persona-btn {
    padding: 12px 6px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all var(--t);
  }

  .persona-btn:hover  { border-color: var(--accent); }
  .persona-btn.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
  .persona-em { font-size: 22px; display: block; margin-bottom: 5px; }

  .join-btn {
    width: 100%;
    padding: 15px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--accent);
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--t), transform var(--t);
  }

  .join-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .join-btn:disabled { opacity: 0.38; cursor: not-allowed; }

  .app   { min-height: 100vh; background: var(--bg); }

  .hdr {
    background: var(--hdr);
    border-bottom: 1px solid var(--border);
    height: 60px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(12px);
  }

  .hdr-logo  { font-size: 17px; font-weight: 800; color: var(--accent); flex: 1; display: flex; align-items: center; gap: 8px; }

  .hdr-score {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-dim);
    border: 1px solid var(--accent);
    padding: 5px 14px;
    border-radius: 20px;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 5px 12px;
    border-radius: 20px;
  }

  .status.live    { background: rgba(16,185,129,.12); color: var(--green); border: 1px solid rgba(16,185,129,.3); }
  .status.offline { background: rgba(239,68,68,.12);  color: var(--red);   border: 1px solid rgba(239,68,68,.3); }
  .dot { width: 7px; height: 7px; border-radius: 50%; }
  .dot.live    { background: var(--green); animation: pulse 2s infinite; }
  .dot.offline { background: var(--red); }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  .main {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    padding: 20px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (max-width: 760px) { .main { grid-template-columns: 1fr; } }

  .card        { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .card-hdr    { padding: 14px 20px; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }

  .empty { padding: 56px 20px; text-align: center; color: var(--text-3); font-size: 14px; }
  .empty-icon { font-size: 38px; display: block; margin-bottom: 10px; }

  .ev-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 20px;
    border-bottom: 1px solid var(--border);
    transition: background var(--t);
    animation: slideIn .28s ease;
  }

  .ev-item:last-child { border-bottom: none; }
  .ev-item:hover      { background: var(--surface2); }

  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }

  .ev-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .ev-type { font-size: 14px; font-weight: 700; }
  .ev-meta { font-size: 12px; color: var(--text-2); margin-top: 2px; display: flex; gap: 5px; }
  .ev-pts  { font-size: 12px; font-weight: 700; color: var(--accent); background: var(--accent-dim); padding: 3px 10px; border-radius: 20px; white-space: nowrap; }

  .lb-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    transition: background var(--t);
  }

  .lb-row:last-child { border-bottom: none; }
  .lb-row:hover      { background: var(--surface2); }
  .lb-row.me         { background: var(--accent-dim); }

  .lb-rank {
    width: 26px; height: 26px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800;
    flex-shrink: 0;
  }

  .lb-rank.gold   { background: rgba(251,191,36,.18); color: #f59e0b; }
  .lb-rank.silver { background: rgba(148,163,184,.18); color: #94a3b8; }
  .lb-rank.bronze { background: rgba(180,120,80,.18);  color: #b47850; }
  .lb-rank.other  { background: var(--surface2); color: var(--text-2); }

  .lb-name  { flex: 1; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lb-score { font-size: 14px; font-weight: 700; color: var(--green); }

  .cbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--surface);
    border-top: 2px solid var(--accent);
    padding: 14px 24px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    box-shadow: 0 -8px 32px rgba(0,0,0,.15);
    animation: slideUp .35s ease;
    z-index: 40;
  }

  @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:none;opacity:1} }

  .cbar-icon  { width:44px;height:44px;border-radius:12px;background:var(--accent-dim);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0; }
  .cbar-label { font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px; }
  .cbar-text  { font-size:14px;color:var(--text);line-height:1.6; }

  .pred-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.6);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    backdrop-filter: blur(4px);
    z-index: 100;
    animation: fadeIn .2s ease;
  }

  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .pred-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 36px 32px;
    width: 100%;
    max-width: 420px;
    text-align: center;
    box-shadow: var(--shadow-lg);
    animation: scaleIn .22s ease;
  }

  @keyframes scaleIn { from{transform:scale(.92);opacity:0} to{transform:none;opacity:1} }

  .pred-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }

  .pred-ring-inner {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800;
    color: var(--accent);
  }

  .pred-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 5px 16px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .pred-q    { font-size: 20px; font-weight: 800; margin-bottom: 6px; line-height: 1.3; }
  .pred-pts  { font-size: 14px; color: var(--green); font-weight: 600; margin-bottom: 28px; }

  .pred-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .pred-yes, .pred-no {
    padding: 14px;
    border-radius: var(--radius-sm);
    border: none;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: transform var(--t), opacity var(--t);
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }

  .pred-yes { background: rgba(16,185,129,.14); color: var(--green); border: 1.5px solid rgba(16,185,129,.35); }
  .pred-no  { background: rgba(239,68,68,.12);  color: var(--red);   border: 1.5px solid rgba(239,68,68,.3); }
  .pred-yes:hover { transform: translateY(-2px); background: rgba(16,185,129,.22); }
  .pred-no:hover  { transform: translateY(-2px); background: rgba(239,68,68,.2); }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;
