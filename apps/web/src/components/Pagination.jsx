import { Icon } from './Icon.jsx';
import { getPageItems } from './pageItems.js';

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'items',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);
  const items = getPageItems(page, totalPages);

  return (
    <div className="bg-surface-container-low px-space-md py-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-lg text-on-surface-variant text-body-sm">
        <span>
          Showing{' '}
          <strong className="text-on-surface font-semibold">
            {start}-{end}
          </strong>{' '}
          of <strong className="text-on-surface font-semibold">{total}</strong> {itemLabel}
        </span>
        <div className="flex items-center gap-space-xs">
          <span className="text-outline">Rows per page:</span>
          <select
            aria-label="Rows per page"
            className="bg-surface-container-lowest text-on-surface text-label-md py-1 px-2 rounded-xs cursor-pointer outline-hidden"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1 text-label-md">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center justify-center w-8 h-8 rounded-xs hover:bg-surface-container text-outline disabled:opacity-40"
        >
          <Icon name="chevron_left" size={18} />
        </button>
        {items.map((item, index) =>
          item === '…' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-outline">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={
                item === page
                  ? 'flex items-center justify-center w-8 h-8 rounded-xs bg-secondary text-on-secondary font-semibold shadow-xs'
                  : 'flex items-center justify-center w-8 h-8 rounded-xs hover:bg-surface-container text-on-surface'
              }
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center justify-center w-8 h-8 rounded-xs hover:bg-surface-container text-outline disabled:opacity-40"
        >
          <Icon name="chevron_right" size={18} />
        </button>
      </div>
    </div>
  );
}
