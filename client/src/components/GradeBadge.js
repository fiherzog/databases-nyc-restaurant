import styled, { useTheme } from 'styled-components';
import { gradeLabel, normalizeGrade } from '../utils/format';

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 4px 9px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 12px;
  border: 1px solid ${({ theme }) => theme.color.border2};
  background: rgba(255, 255, 255, 0.04);
  color: ${({ $c, theme }) => $c || theme.color.text};
`;

function colorFor(grade, theme) {
  const g = normalizeGrade(grade);
  if (g === 'A') return theme.color.ok;
  if (g === 'B') return theme.color.warn;
  if (g === 'C') return theme.color.danger;
  if (g && String(g).includes('CLOSED')) return '#7a1010';
  return theme.color.text2;
}

export function GradeBadge({ grade }) {
  const theme = useTheme();
  const c = colorFor(grade, theme);
  return <Badge $c={c}>{gradeLabel(grade)}</Badge>;
}

