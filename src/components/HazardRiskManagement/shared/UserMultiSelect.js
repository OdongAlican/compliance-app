/**
 * UserMultiSelect.js — Multi-user selection component with role filtering.
 *
 * Props:
 *   value      {User[]}   — currently selected users
 *   onChange   {fn}       — called with the updated array
 *   roleFilter {string}   — API filter[role] value, e.g. 'safety_officer'
 *   label      {string}   — visible field label
 *   error      {string}   — validation error message
 *   disabled   {boolean}  — read-only mode (shows chips only)
 */
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import UsersService from '../../../services/users.service';

function fullName(u) {
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email || `User #${u.id}`;
}

export default function UserMultiSelect({
  value = [],
  onChange,
  roleFilter,
  label,
  error,
  disabled = false,
  showChips = true,
}) {
  const [options, setOptions]   = useState([]);
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [fetching, setFetching] = useState(false);
  const timer = useRef(null);

  // Load options whenever the roleFilter changes (on mount + prop change)
  useEffect(() => { loadOptions(''); }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadOptions(q) {
    setFetching(true);
    try {
      const params = { per_page: 50, 'filter[role]': roleFilter };
      if (q) params.q = q;
      const res = await UsersService.list(params);
      // API returns { data: User[], meta } or plain array
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setOptions(list);
    } catch (_) {
      // silently fail — options just won't load
    } finally {
      setFetching(false);
    }
  }

  function handleSearch(val) {
    setQuery(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => loadOptions(val), 300);
  }

  function toggleUser(u) {
    if (disabled) return;
    const exists = value.find((v) => v.id === u.id);
    onChange(exists ? value.filter((v) => v.id !== u.id) : [...value, u]);
  }

  // Show only unselected users in the dropdown
  const filtered = options.filter((u) => !value.find((v) => v.id === u.id));

  return (
    <div>
      {/* Label */}
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text)' }}
        >
          {label} <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
      )}

      {/* Selected chips */}
      {showChips && value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: 'color-mix(in srgb,var(--accent) 15%,transparent)',
                color: 'var(--accent)',
              }}
            >
              {fullName(u)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleUser(u)}
                  className="ml-0.5 hover:opacity-70 leading-none"
                  aria-label={`Remove ${fullName(u)}`}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search input + dropdown (hidden in disabled mode) */}
      {!disabled && (
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={query}
              placeholder={`Search ${label?.toLowerCase() ?? 'users'}…`}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setOpen(true)}
              className="ui-input pl-9 w-full"
              autoComplete="off"
            />
          </div>

          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onPointerDown={() => { setOpen(false); setQuery(''); }}
              />
              <div
                className="absolute left-0 right-0 mt-1 z-50 rounded-xl overflow-auto"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  maxHeight: 210,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {fetching ? (
                  <p className="p-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Loading…
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="p-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No results found
                  </p>
                ) : (
                  filtered.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        toggleUser(u);
                        setQuery('');
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:opacity-75 transition-opacity"
                      style={{ color: 'var(--text)' }}
                    >
                      <span className="font-medium">{fullName(u)}</span>
                      {u.email && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {u.email}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Validation error */}
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
