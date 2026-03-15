/**
 * exportCsv — converts a data array to a downloadable CSV file.
 * Extracted from the duplicated export logic in every *Interface.js file.
 *
 * @param {Array}    rows      - data rows (array of objects)
 * @param {string[]} columns   - keys to include (order preserved)
 * @param {Object}   [headers] - optional display header map { key: 'Label' }
 * @param {string}   [filename]
 */
export function exportCsv(rows, columns, headers = {}, filename = 'export.csv') {
  const headerRow = columns.map((col) => headers[col] ?? col);
  const bodyRows = rows.map((row) =>
    columns.map((col) => {
      const val = row[col] ?? '';
      // Escape quotes, wrap in quotes if value contains comma/newline/quote
      const str = String(val).replace(/"/g, '""');
      return /[",\n]/.test(str) ? `"${str}"` : str;
    })
  );

  const csv = [headerRow, ...bodyRows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
