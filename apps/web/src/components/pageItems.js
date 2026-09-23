/**
 * Pure pagination-button model. For `totalPages <= 7` returns every page.
 * Otherwise returns first, last, and a window around `page`, with '…'
 * inserted for any gap, deduplicated and clamped to [1, totalPages].
 */
export function getPageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items = new Set([1, totalPages]);
  for (let p = page - 1; p <= page + 1; p += 1) {
    if (p >= 1 && p <= totalPages) items.add(p);
  }

  const sorted = [...items].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('…');
    }
    result.push(sorted[i]);
  }
  return result;
}
