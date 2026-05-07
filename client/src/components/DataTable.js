import styled from 'styled-components';

export const TableWrap = styled.div`
  overflow: auto;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: #FFE9B9;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
`;

export const Th = styled.th`
  text-align: left;
  padding: 12px 14px;
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 11px;
  color: ${({ theme }) => theme.color.text2};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: #FFE9B9;
  position: sticky;
  top: 0;
  z-index: 1;
`;

export const Td = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  vertical-align: top;
  white-space: nowrap;
`;

export const Tr = styled.tr`
  &:nth-child(2n) {
    background: rgba(0, 0, 0, 0.04);
  }
  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
`;

export const SortButton = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: ${({ theme }) => theme.color.text};
  }
`;

export function SortLabel({ label, active, dir }) {
  return (
    <span>
      {label}
      {active ? <span style={{ opacity: 0.8 }}> {dir === 'asc' ? '▲' : '▼'}</span> : null}
    </span>
  );
}

