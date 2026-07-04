export const CHEKIS_PAGE_SIZE = 20;

export function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 14, marginTop: 14 }}>
      <button className="btn ghost" disabled={page === 0} onClick={() => onPage(page - 1)}>PREV</button>
      <span className="body-text" style={{ fontSize: 17 }}>{page + 1} / {pageCount}</span>
      <button className="btn ghost" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}>NEXT</button>
    </div>
  );
}
