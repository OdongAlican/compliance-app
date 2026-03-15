/**
 * Table — generic table shell used by all data tables.
 * Handles overflow, empty state, and consistent header/row styling.
 *
 * Props:
 *   columns   Array<{ key: string, label: string, width?: string }>
 *   rows      any[]
 *   renderRow (row, index) => ReactNode   — render a <tr> for each row
 *   emptyText string   (shown when rows is empty)
 *   loading   boolean
 */
import React from 'react';
import LoadingSpinner from '../feedback/LoadingSpinner';
import EmptyState from '../feedback/EmptyState';

export default function Table({ columns = [], rows = [], renderRow, emptyText = 'No records found.', loading = false }) {
    return (
        <div className="ui-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="ui-th text-left"
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-16 text-center">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-16 text-center">
                                    <EmptyState message={emptyText} />
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, i) => renderRow(row, i))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
