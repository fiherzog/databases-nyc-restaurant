import { NavLink, Outlet } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const drive = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(calc(100vw - 280px + 200px)); }
`;

const TaxiTrack = styled.div`
  position: relative;
  z-index: -1;
  height: 82px;
  overflow: hidden;
  pointer-events: none;
  margin-left: -32px;
  margin-right: -32px;
  margin-top: 8px;
  margin-bottom: -32px;

  @media (max-width: 980px) {
    margin-left: -24px;
    margin-right: -24px;
    margin-top: 8px;
    margin-bottom: -24px;
  }
`;

const TaxiWrap = styled.div`
  position: absolute;
  bottom: 0;
  left: -200px;
  animation: ${drive} 16s linear infinite;
  display: inline-block;
`;

function Taxi() {
  return (
    <TaxiWrap>
      <img src="/car.png" alt="" style={{ height: 82, display: 'block', transform: 'scaleX(-1)' }} />
    </TaxiWrap>
  );
}


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
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.color.border};
  overflow: hidden;

  @media (max-width: 980px) {
    position: relative;
    height: auto;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
  }
`;

const SidebarContent = styled.div`
  padding: ${({ theme }) => theme.space.xl};
  flex: 1;
`;

const SkylineImage = styled.img`
  width: 100%;
  display: block;
  flex-shrink: 0;

  @media (max-width: 980px) {
    display: none;
  }
`;

const Brand = styled.div`
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const BrandTitle = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: 26px;
  letter-spacing: 0.04em;
  line-height: 1.05;
`;

const BrandSub = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
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
  gap: 1px;
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
    background: rgba(0, 0, 0, 0.08);
  }
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.accent};
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.15);
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
        <SidebarContent>
          <Brand>
            <BrandTitle>NYC Restaurant Explorer</BrandTitle>
            <BrandSub>
              Explore NYC's dining scene with a focus on safety.
              <br />
              Dive into health inspection records across every borough.
            </BrandSub>
          </Brand>

          <Nav>
            <NavItem to="/" end>
              <img src="/2.png" alt="" style={{ width: 45, height: 45, objectFit: 'contain', flexShrink: 0 }} />
              Search
            </NavItem>
            <NavItem to="/danger-zone">
              <img src="/2.png" alt="" style={{ width: 45, height: 45, objectFit: 'contain', flexShrink: 0 }} />
              Danger Zone
            </NavItem>
            <NavItem to="/repeat-offenders">
              <img src="/2.png" alt="" style={{ width: 45, height: 45, objectFit: 'contain', flexShrink: 0 }} />
              Repeat Offenders
            </NavItem>
            <NavItem to="/boroughs">
              <img src="/2.png" alt="" style={{ width: 45, height: 45, objectFit: 'contain', flexShrink: 0 }} />
              Borough Analytics
            </NavItem>
            <NavItem to="/declining">
              <img src="/2.png" alt="" style={{ width: 45, height: 45, objectFit: 'contain', flexShrink: 0 }} />
              Declining Restaurants
            </NavItem>
          </Nav>
        </SidebarContent>
        <SkylineImage src="/skyline.png" alt="NYC skyline" />
      </Sidebar>

      <Main>
        <Outlet />
        <TaxiTrack>
          <Taxi />
        </TaxiTrack>
      </Main>
    </Shell>
  );
}

