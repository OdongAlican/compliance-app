/* ── PPE Inspection — UserAutocomplete ────────────────────────────────── */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import UsersService from "../../services/users.service";

export default function UserAutocomplete({ roleFilter, value, onChange, placeholder, error }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Skip role filter when roleFilter is falsy (e.g. PPE User step — any user) */
  const fetchUsers = useCallback((q = "") => {
    setLoading(true);
    const params = { per_page: 10 };
    if (roleFilter) params["filter[role]"] = roleFilter;
    if (q.trim()) params["filter[firstname]"] = q.trim();
    UsersService.list(params)
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setResults(list);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(q), 400);
  }

  function handleSelect(user) {
    onChange(user);
    setQuery(user.firstname + " " + user.lastname);
    setOpen(false);
  }

  function handleFocus() {
    setOpen(true);
    if (results.length === 0) fetchUsers(query);
  }

  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  const roleName = (u) =>
    u.role?.name
      ? u.role.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "—";

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{
          background: "var(--bg)",
          border: `1px solid ${error ? "var(--danger)" : open ? "var(--accent)" : "var(--border)"}`,
          transition: "border-color 0.15s",
        }}
      >
        <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={placeholder}
          style={{ background: "transparent", outline: "none", color: "var(--text)", fontSize: "13px", width: "100%" }}
        />
        {loading && (
          <div
            className="animate-spin rounded-full flex-shrink-0"
            style={{ width: "14px", height: "14px", border: "2px solid var(--border)", borderTopColor: "var(--accent)" }}
          />
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(null); setQuery(""); fetchUsers(""); setOpen(true); }}
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", maxHeight: "260px", overflowY: "auto" }}
        >
          {results.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              No users found.
            </div>
          )}
          {results.map((u) => {
            const isSelected = value?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                style={{
                  background: isSelected ? "color-mix(in srgb,var(--accent) 12%,transparent)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "color-mix(in srgb,var(--accent) 6%,transparent)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: isSelected ? "var(--accent)" : "color-mix(in srgb,var(--accent) 20%,transparent)", color: isSelected ? "#fff" : "var(--accent)" }}
                >
                  {u.firstname?.[0]}{u.lastname?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {u.firstname} {u.lastname}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                    {roleName(u)}{u.email ? " · " + u.email : ""}
                  </p>
                </div>
                {isSelected && <CheckBadgeIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
