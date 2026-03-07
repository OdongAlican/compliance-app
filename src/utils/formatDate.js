/**
 * Date/time formatting helpers.
 * All functions are pure and handle null/undefined gracefully.
 */

const DEFAULT_DATE_FORMAT = { year: 'numeric', month: 'short', day: '2-digit' };
const DEFAULT_DATETIME_FORMAT = {
  year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
};

/**
 * Format a date value to a readable string.
 * @param {string|Date|null} value
 * @param {Intl.DateTimeFormatOptions} [opts]
 * @returns {string}
 */
export function formatDate(value, opts = DEFAULT_DATE_FORMAT) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleDateString(undefined, opts);
}

/**
 * Format a date+time value.
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleString(undefined, DEFAULT_DATETIME_FORMAT);
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for use in <input type="date">.
 * @param {string|Date|null} value
 * @returns {string}
 */
export function toISODate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Returns a relative time string ("2 hours ago", "in 3 days").
 * @param {string|Date} value
 * @returns {string}
 */
export function timeAgo(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - d.getTime();
  const abs = Math.abs(diffMs);
  const future = diffMs < 0;

  const units = [
    [60_000,       'minute'],
    [3_600_000,    'hour'],
    [86_400_000,   'day'],
    [604_800_000,  'week'],
    [2_592_000_000,'month'],
    [31_536_000_000,'year'],
  ];

  let label = 'just now';
  for (const [threshold, unit] of units) {
    if (abs >= threshold) {
      const n = Math.round(abs / threshold);
      label = future ? `in ${n} ${unit}${n !== 1 ? 's' : ''}` : `${n} ${unit}${n !== 1 ? 's' : ''} ago`;
    }
  }
  return label;
}
