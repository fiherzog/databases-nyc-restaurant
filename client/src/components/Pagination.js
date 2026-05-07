import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.lg};
  flex-wrap: wrap;
`;

const PageBtn = styled.button`
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.border2};
  background: ${({ $active }) => ($active ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)')};
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ theme }) => theme.color.text};
  cursor: pointer;
  font-size: 13px;
  transition: background 120ms ease;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: rgba(0,0,0,0.12);
  }
`;

const Info = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.color.text2};
`;

export function usePagination(items, pageSize = 20) {
  return { pageSize };
}

export function paginate(items, page, pageSize) {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}

export function Pagination({ page, setPage, total, pageSize }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 || i === totalPages - 1 ||
      Math.abs(i - page) <= 2
    ) {
      pages.push(i);
    }
  }

  const withEllipsis = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) withEllipsis.push('...');
    withEllipsis.push(p);
  });

  return (
    <Wrap>
      <PageBtn onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</PageBtn>
      {withEllipsis.map((p, i) =>
        p === '...'
          ? <Info key={`e${i}`}>…</Info>
          : <PageBtn key={p} $active={p === page} onClick={() => setPage(p)}>{p + 1}</PageBtn>
      )}
      <PageBtn onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next →</PageBtn>
      <Info>{total} results · page {page + 1} of {totalPages}</Info>
    </Wrap>
  );
}
