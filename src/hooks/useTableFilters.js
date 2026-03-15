import { useMemo, useState } from 'react';

/**
 * useTableFilters — centralised search + status + date-range logic.
 * Replaces the duplicated filter code copy-pasted into every *Interface.js file.
 *
 * @param {Array}  rows        - full data array
 * @param {Object} [options]
 * @param {string[]} [options.searchFields] - keys to search across (default: all string values)
 * @param {string}   [options.statusKey]    - key to match statusFilter against (default: 'status')
 * @param {string}   [options.dateKey]      - key to match date range against (default: 'date')
 *
 * Returns:
 *   filtered, search, setSearch, statusFilter, setStatusFilter,
 *   dateFrom, setDateFrom, dateTo, setDateTo, hasFilters, clearFilters
 */
export default function useTableFilters(rows = [], options = {}) {
    const {
        searchFields = null,
        statusKey = 'status',
        dateKey = 'date',
    } = options;

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filtered = useMemo(() => {
        const term = search.toLowerCase().trim();
        return rows.filter((row) => {
            // ── search ──
            if (term) {
                const fields = searchFields
                    ? searchFields.map((f) => String(row[f] ?? ''))
                    : Object.values(row).filter((v) => typeof v === 'string');
                if (!fields.some((v) => v.toLowerCase().includes(term))) return false;
            }

            // ── status ──
            if (statusFilter && statusFilter !== 'All') {
                if (String(row[statusKey] ?? '') !== statusFilter) return false;
            }

            // ── date range ──
            const rowDate = row[dateKey] ? new Date(row[dateKey]) : null;
            if (dateFrom && rowDate && rowDate < new Date(dateFrom)) return false;
            if (dateTo && rowDate && rowDate > new Date(dateTo + 'T23:59:59')) return false;

            return true;
        });
    }, [rows, search, statusFilter, dateFrom, dateTo, searchFields, statusKey, dateKey]);

    const hasFilters =
        Boolean(search) ||
        (statusFilter && statusFilter !== 'All') ||
        Boolean(dateFrom) ||
        Boolean(dateTo);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('All');
        setDateFrom('');
        setDateTo('');
    };

    return {
        filtered,
        search, setSearch,
        statusFilter, setStatusFilter,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        hasFilters,
        clearFilters,
    };
}
