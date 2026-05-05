import styled from 'styled-components';

export const PageHeader = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.lg};
  flex-wrap: wrap;
`;

export const PageTitle = styled.h1`
  font-size: 34px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const PageKicker = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.5;
  max-width: 860px;
`;

export const Grid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.lg};
`;

export const TwoCol = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.lg};
  grid-template-columns: 1fr 1fr;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

