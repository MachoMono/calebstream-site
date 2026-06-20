import { useState, useEffect } from "react";

const THEMES = [
  { id: "lcd",      label: "LCD"      },
  { id: "snes",     label: "SNES"     },
  { id: "genesis",  label: "Genesis"  },
  { id: "playstation", label: "PlayStation" },
  { id: "gamecube", label: "GameCube" },
  { id: "bombpop",  label: "Bombpop"  },
] as const;

type ThemeId = typeof THEMES[number]["id"];

function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  try { localStorage.setItem("calebstream-theme", id); } catch {}
}

export default function ThemePicker() {
  const [current, setCurrent] = useState<ThemeId>("lcd");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("calebstream-theme") as ThemeId | null;
      if (saved && THEMES.find((t) => t.id === saved)) {
        setCurrent(saved);
        applyTheme(saved);
      }
    } catch {}
  }, []);

  const select = (id: ThemeId) => {
    setCurrent(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div className="tp-wrap">
      <button className="tp-btn" onClick={() => setOpen((o) => !o)}>
        [theme: {current}]
      </button>
      {open && (
        <div className="tp-menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`tp-item${t.id === current ? " tp-item--active" : ""}`}
              onClick={() => select(t.id)}
            >
              {t.id === current ? "▶ " : "  "}{t.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        .tp-wrap { position: relative; }
        .tp-btn {
          background: transparent;
          border: none;
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 1rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.1s;
          white-space: nowrap;
        }
        .tp-btn:hover { color: var(--fg); }
        .tp-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          background: var(--bg);
          border: 2px solid var(--fg);
          display: flex;
          flex-direction: column;
          z-index: 200;
          min-width: 180px;
          box-shadow: 4px 4px 0 var(--fg);
        }
        .tp-item {
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--border);
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 1rem;
          padding: 0.55rem 0.9rem;
          cursor: pointer;
          text-align: left;
          white-space: nowrap;
          transition: background 0.1s, color 0.1s;
        }
        .tp-item:last-child { border-bottom: none; }
        .tp-item:hover { background: var(--bg-hover); color: var(--fg); }
        .tp-item--active { color: var(--fg); font-weight: bold; }
      `}</style>
    </div>
  );
}
