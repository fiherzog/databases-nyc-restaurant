import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  ::selection {
    background: rgba(0, 0, 0, 0.15);
  }

  body {
    background: ${({ theme }) => theme.color.bg};
    color: ${({ theme }) => theme.color.text};
    font-family: ${({ theme }) => theme.font.mono};
  }

  h1, h2, h3, h4 {
    font-family: ${({ theme }) => theme.font.display};
    font-weight: 700;
    letter-spacing: 0.02em;
    margin: 0;
  }

  a {
    color: ${({ theme }) => theme.color.link};
  }
`;

