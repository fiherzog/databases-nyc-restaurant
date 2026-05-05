import { NavLink, Outlet } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Shell = styled.div`
  min-height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  padding: ${({ theme }) => theme.space.xl};
  border-right: 1px solid ${({ theme }) => theme.color.border};
  background: linear-gradient(180deg, ${({ theme }) => theme.color.panel2}, rgba(11, 15, 20, 0));

  @media (max-width: 980px) {
    position: relative;
    height: auto;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
  }
`;

const Brand = styled.div`
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const BrandTitle = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-size: 26px;
  letter-spacing: 0.04em;
  line-height: 1.05;
`;

const BrandSub = styled.div`
  margin-top: ${({ theme }) => theme.space.xs};
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.3;
`;

const Nav = styled.nav`
  display: grid;
  gap: 8px;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.color.text2};
  border: 1px solid transparent;
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: ${({ theme }) => theme.color.border};
    transform: translateY(-1px);
  }

  &.active {
    color: ${({ theme }) => theme.color.text};
    border-color: ${({ theme }) => theme.color.border2};
    background: rgba(255, 176, 32, 0.08);
  }
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.accent};
  box-shadow: 0 0 0 3px rgba(255, 176, 32, 0.12);
  flex: 0 0 auto;
`;

const Main = styled.main`
  padding: ${({ theme }) => theme.space.xxl};
  animation: ${fadeUp} 220ms ease-out;

  @media (max-width: 980px) {
    padding: ${({ theme }) => theme.space.xl};
  }
`;

export function AppLayout() {
  return (
    <Shell>
      <Sidebar>
        <Brand>
          <BrandTitle>NYC Safety Explorer</BrandTitle>
          <BrandSub>
            Health inspections × Google ratings.
            <br />
            Find mismatch, repeat offenders, and borough trends.
          </BrandSub>
        </Brand>

        <Nav>
          <NavItem to="/" end>
            <Dot />
            Search
          </NavItem>
          <NavItem to="/danger-zone">
            <Dot />
            Danger Zone
          </NavItem>
          <NavItem to="/repeat-offenders">
            <Dot />
            Repeat Offenders
          </NavItem>
          <NavItem to="/boroughs">
            <Dot />
            Borough Analytics
          </NavItem>
          <NavItem to="/declining">
            <Dot />
            Declining Restaurants
          </NavItem>
        </Nav>
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Shell>
  );
}

