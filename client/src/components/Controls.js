import styled from 'styled-components';

export const Controls = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
`;

export const ControlRow = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.color.text};
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: rgba(0, 0, 0, 0.06);
  color: ${({ theme }) => theme.color.text};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.color.border2};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: rgba(0, 0, 0, 0.06);
  color: ${({ theme }) => theme.color.text};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.color.border2};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  flex-wrap: wrap;
`;

export const Button = styled.button`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.border2};
  background: rgba(0, 0, 0, 0.10);
  color: ${({ theme }) => theme.color.text};
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(0, 0, 0, 0.14);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const GhostButton = styled(Button)`
  background: rgba(0, 0, 0, 0.04);
  border-color: ${({ theme }) => theme.color.border};

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
`;

