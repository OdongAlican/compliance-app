/**
 * FilterBar — search input + status select + date-range pickers + optional export button.
 * Replaces the duplicated filter bar copied into every *Interface.js.
 *
 * Props:
 *   search         string
 *   onSearch       (val: string) => void
 *   statusFilter   string
 *   onStatusChange (val: string) => void
 *   statusOptions  string[]   default: STATUS_OPTIONS from constants
 *   dateFrom       string
 *   onDateFrom     (val: string) => void
 *   dateTo         string
 *   onDateTo       (val: string) => void
 *   onExport       () => void   (omit to hide Export button)
 *   hasFilters     boolean       (shows "Clear" link)
 *   onClear        () => void
 */
import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, CalendarDaysIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { STATUS_OPTIONS } from '../../utils/constants';

const inputStyle = {
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
};

export default function FilterBar({
    search = '', onSearch,
    statusFilter = 'All', onStatusChange,
    statusOptions = STATUS_OPTIONS,
    dateFrom = '', onDateFrom,
    dateTo = '', onDateTo,
    onExport,
    hasFilters = false,
    onClear,
}) {
    return (
        <div
            className="ui-card flex flex-col sm:flex-row sm:items-center gap-3 p-3 mb-4"
            style={{ flexWrap: 'wrap' }}
        >
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
                <MagnifyingGlassIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearch?.(e.target.value)}
                    placeholder="Search…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                    style={inputStyle}
                />
            </div>

            {/* Status filter */}
            <div className="relative">
                <FunnelIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusChange?.(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-lg text-sm outline-none appearance-none"
                    style={inputStyle}
                >
                    {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Date from */}
            <div className="relative">
                <CalendarDaysIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                />
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFrom?.(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                    style={inputStyle}
                />
            </div>

            {/* Date to */}
            <div className="relative">
                <CalendarDaysIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateTo?.(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                    style={inputStyle}
                />
            </div>

            {/* Export */}
            {onExport && (
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--bg-raised)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export CSV
                </button>
            )}

            {/* Clear */}
            {hasFilters && onClear && (
                <button
                    onClick={onClear}
                    className="text-xs font-medium hover:opacity-70 transition-opacity whitespace-nowrap"
                    style={{ color: 'var(--accent)' }}
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}
