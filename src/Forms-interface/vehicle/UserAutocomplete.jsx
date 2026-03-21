import { useState, useRef, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
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

  const fetchUsers = useCallback((q = "") => {
    setLoading(true);
    const params = { per_page: 10, "filter[role]": roleFilter };
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
        <MagnifyingGlassIcon
          className="h-4 w-4 flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={placeholder ?? "Search users…"}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text)" }}
        />
        {loading && (
          <div
            className="h-4 w-4 rounded-full animate-spin flex-shrink-0"
            style={{ border: "2px solid var(--border)", borderTopColor: "var(--accent)" }}
          />
        )}
        {value && (
          <button
            type="button"
            className="hover:opacity-70 flex-shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
            }}
          >
            <XMarkIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-auto max-h-52"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80 text-left"
              style={{ color: "var(--text)" }}
              onMouseDown={() => handleSelect(u)}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {u.firstname?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.firstname} {u.lastname}
                </p>
                <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                  {roleName(u)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
