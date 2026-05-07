import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

export const Panel = styled.div`
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.panel};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: 0 14px 28px ${({ theme }) => theme.color.shadow};
`;

export const PanelBody = styled.div`
  padding: ${({ theme }) => theme.space.xl};
`;

export const Subtle = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.5;
`;

export const LoadingBlock = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  height: ${({ $h }) => $h || 140}px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 176, 32, 0.06), rgba(255, 255, 255, 0.04));
  background-size: 200% 200%;
  animation: ${shimmer} 950ms ease-in-out infinite;
`;

const StateWrap = styled(Panel)`
  padding: ${({ theme }) => theme.space.xl};
  display: grid;
  gap: 8px;
`;

const StateTitle = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.03em;
`;

export function EmptyState({ title = 'No results', detail }) {
  return (
    <StateWrap>
      <StateTitle>{title}</StateTitle>
      {detail ? <Subtle>{detail}</Subtle> : null}
    </StateWrap>
  );
}

export function ErrorState({ title = 'Something went wrong', detail }) {
  return (
    <StateWrap>
      <StateTitle>{title}</StateTitle>
      {detail ? <Subtle>{detail}</Subtle> : <Subtle>Try adjusting filters or refreshing.</Subtle>}
    </StateWrap>
  );
}

