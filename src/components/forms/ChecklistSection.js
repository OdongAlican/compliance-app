/**
 * ChecklistSection — checklist table used inside AccordionItems in every inspection form.
 * Extracted from CanteenForm.js (same pattern across all inspection forms).
 *
 * Props:
 *   items   string[]     — checklist item labels
 *   values  Object       — { [label]: { result: string, comment: string } }
 *   onChange (label, field, value) => void
 */
import React from 'react';

const cellStyle = { borderBottom: '1px solid var(--border)' };
const inputBase = {
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
};

export default function ChecklistSection({ items = [], values = {}, onChange }) {
    return (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <table className="min-w-full">
                <thead>
                    <tr style={{ background: 'var(--bg-raised)', ...cellStyle }}>
                        <th className="ui-th text-left">Item</th>
                        <th className="ui-th text-center">Result</th>
                        <th className="ui-th text-left">Comments</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => {
                        const val = values[item] || {};
                        return (
                            <tr key={i} className="ui-row" style={cellStyle}>
                                <td className="ui-td text-sm" style={{ color: 'var(--text)' }}>{item}</td>
                                <td className="ui-td text-center">
                                    <select
                                        value={val.result || ''}
                                        onChange={(e) => onChange?.(item, 'result', e.target.value)}
                                        className="text-sm rounded-lg px-2 py-1 outline-none"
                                        style={inputBase}
                                    >
                                        <option value="">—</option>
                                        <option value="Pass">✓ Pass</option>
                                        <option value="Fail">✗ Fail</option>
                                        <option value="N/A">N/A</option>
                                    </select>
                                </td>
                                <td className="ui-td">
                                    <input
                                        type="text"
                                        placeholder="Enter comment"
                                        value={val.comment || ''}
                                        onChange={(e) => onChange?.(item, 'comment', e.target.value)}
                                        className="w-full text-sm rounded-lg px-2 py-1.5 outline-none"
                                        style={inputBase}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
