import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AppLayout } from './app/AppLayout';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';

import { HomeSearchPage } from './pages/HomeSearchPage';
import { RestaurantProfilePage } from './pages/RestaurantProfilePage';
import { DangerZonePage } from './pages/DangerZonePage';
import { RepeatOffendersPage } from './pages/RepeatOffendersPage';
import { BoroughDashboardPage } from './pages/BoroughDashboardPage';
import { DecliningRestaurantsPage } from './pages/DecliningRestaurantsPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeSearchPage />} />
            <Route path="/restaurants/:camis" element={<RestaurantProfilePage />} />
            <Route path="/danger-zone" element={<DangerZonePage />} />
            <Route path="/repeat-offenders" element={<RepeatOffendersPage />} />
            <Route path="/boroughs" element={<BoroughDashboardPage />} />
            <Route path="/declining" element={<DecliningRestaurantsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
