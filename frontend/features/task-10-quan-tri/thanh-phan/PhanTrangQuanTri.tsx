type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  page,
  pageSize,
  total,
  itemLabel,
  onPageChange,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const currentPage = Math.min(page, totalPages);
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, total);

  return (
    <div className="product-pagination">
      <span>
        Hiển thị {firstItem}–{lastItem} / {total} {itemLabel}
      </span>
      <div className="product-pagination-actions">
        <button
          type="button"
          className="btn-secondary-action"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
        >
          Trước
        </button>
        <span aria-live="polite">Trang {currentPage} / {totalPages}</span>
        <button
          type="button"
          className="btn-secondary-action"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Trang sau"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
