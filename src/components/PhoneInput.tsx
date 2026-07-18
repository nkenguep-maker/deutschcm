"use client";

import { useState, useRef, useEffect } from "react";

const COUNTRIES = [
  { code: "CM", flag: "🇨🇲", name: "Cameroun",        prefix: "+237" },
  { code: "DE", flag: "", name: "Allemagne",       prefix: "+49"  },
  { code: "FR", flag: "🇫🇷", name: "France",          prefix: "+33"  },
  { code: "BE", flag: "🇧🇪", name: "Belgique",        prefix: "+32"  },
  { code: "CH", flag: "🇨🇭", name: "Suisse",          prefix: "+41"  },
  { code: "AT", flag: "🇦🇹", name: "Autriche",        prefix: "+43"  },
  { code: "SN", flag: "🇸🇳", name: "Sénégal",         prefix: "+221" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire",  prefix: "+225" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria",         prefix: "+234" },
  { code: "GH", flag: "🇬🇭", name: "Ghana",           prefix: "+233" },
  { code: "MA", flag: "🇲🇦", name: "Maroc",           prefix: "+212" },
  { code: "GA", flag: "🇬🇦", name: "Gabon",           prefix: "+241" },
  { code: "CG", flag: "🇨🇬", name: "Congo",           prefix: "+242" },
  { code: "CD", flag: "🇨🇩", name: "RD Congo",        prefix: "+243" },
  { code: "ML", flag: "🇲🇱", name: "Mali",            prefix: "+223" },
  { code: "BJ", flag: "🇧🇯", name: "Bénin",           prefix: "+229" },
  { code: "TG", flag: "🇹🇬", name: "Togo",            prefix: "+228" },
  { code: "GB", flag: "🇬🇧", name: "Royaume-Uni",     prefix: "+44"  },
  { code: "US", flag: "🇺🇸", name: "États-Unis",      prefix: "+1"   },
  { code: "CA", flag: "🇨🇦", name: "Canada",          prefix: "+1"   },
  { code: "BR", flag: "🇧🇷", name: "Brésil",          prefix: "+55"  },
  { code: "CN", flag: "🇨🇳", name: "Chine",           prefix: "+86"  },
  { code: "JP", flag: "🇯🇵", name: "Japon",           prefix: "+81"  },
  { code: "IN", flag: "🇮🇳", name: "Inde",            prefix: "+91"  },
  { code: "RU", flag: "🇷🇺", name: "Russie",          prefix: "+7"   },
];

interface Props {
  value: string;
  onChange: (fullPhone: string) => void;
  label?: string;
}

export default function PhoneInput({ value, onChange, label = "TÉLÉPHONE" }: Props) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [number, setNumber] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.prefix.includes(search)
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNumber = (val: string) => {
    setNumber(val);
    onChange(`${country.prefix} ${val}`);
  };

  const handleCountry = (c: typeof COUNTRIES[0]) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    onChange(`${c.prefix} ${number}`);
  };

  return (
    <div>
      {label && (
        <label style={{ color: "var(--creme-mute)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label} <span style={{ color: "var(--creme-mute)", fontWeight: 400, textTransform: "none" }}>(recommandé)</span>
        </label>
      )}
      <div ref={dropRef} style={{ position: "relative" }}>
        <div style={{
          display: "flex", background: "rgba(244, 235, 220, 0.04)", border: "1px solid rgba(244, 235, 220, 0.12)",
          borderRadius: 10, overflow: "visible",
        }}>
          {/* Country selector button */}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={`Pays ${country.name} (${country.prefix})`}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "12px 12px",
              background: "transparent", border: "none", borderRight: "1px solid rgba(244, 235, 220, 0.09)",
              cursor: "pointer", color: "var(--creme)", fontSize: 14, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>{country.flag}</span>
            <span style={{ color: "var(--creme-soft)", fontSize: 13 }}>{country.prefix}</span>
            <span style={{ color: "var(--creme-mute)", fontSize: 10 }}>▾</span>
          </button>
          {/* Number input */}
          <input
            type="tel"
            aria-label="Numéro de téléphone"
            value={number}
            onChange={e => handleNumber(e.target.value)}
            placeholder="Votre numéro"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              padding: "12px 14px", color: "var(--creme)", fontSize: 14, fontFamily: "monospace",
            }}
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: "absolute", top: "100%", left: 0, zIndex: 999, marginTop: 4,
            background: "var(--espresso-2)", border: "1px solid rgba(244, 235, 220, 0.12)",
            borderRadius: 12, overflow: "hidden", width: 280,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(244, 235, 220, 0.09)" }}>
              <input
                autoFocus
                aria-label="Rechercher un pays"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un pays..."
                style={{
                  width: "100%", background: "rgba(244, 235, 220, 0.04)", border: "1px solid rgba(244, 235, 220, 0.09)",
                  borderRadius: 7, padding: "7px 10px", color: "var(--creme)", fontSize: 13, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountry(c)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", background: c.code === country.code ? "var(--brass-glow)" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    borderBottom: "1px solid rgba(244, 235, 220, 0.04)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.flag}</span>
                  <span style={{ color: "var(--creme)", fontSize: 13, flex: 1 }}>{c.name}</span>
                  <span style={{ color: "var(--creme-mute)", fontSize: 12, fontFamily: "monospace" }}>{c.prefix}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "16px", color: "var(--creme-mute)", fontSize: 13, textAlign: "center" }}>
                  Aucun pays trouvé
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
