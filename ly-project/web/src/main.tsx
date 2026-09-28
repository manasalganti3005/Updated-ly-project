import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider, RequireAuth } from './auth.tsx';
import './index.css';
import CasePage from './pages/CasePage.tsx';
import ExplorerPage from './pages/ExplorerPage.tsx';
import SearchPage from './pages/SearchPage.tsx';
import FirHomePage from './pages/fir/FirHomePage.tsx';
import FirConversationPage from './pages/fir/FirConversationPage.tsx';
import FirReviewPage from './pages/fir/FirReviewPage.tsx';
import FirConfirmPage from './pages/fir/FirConfirmPage.tsx';
import FirOutputPage from './pages/fir/FirOutputPage.tsx';
import AdminPage from './pages/auth/AdminPage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import ProfilePage from './pages/auth/ProfilePage.tsx';
import SignupPage from './pages/auth/SignupPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<App />}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/case/:tid" element={<CasePage />} />
              <Route path="/explore" element={<ExplorerPage />} />
              <Route path="/fir" element={<FirHomePage />} />
              <Route path="/fir/case/:caseId" element={<FirConversationPage />} />
              <Route path="/fir/case/:caseId/review" element={<FirReviewPage />} />
              <Route path="/fir/case/:caseId/confirm" element={<FirConfirmPage />} />
              <Route path="/fir/case/:caseId/output" element={<FirOutputPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth roles={['admin']}>
                    <AdminPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
