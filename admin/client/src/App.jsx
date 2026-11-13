import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingState from './components/LoadingState';

import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import QuizzesPage from './pages/QuizzesPage';
import SlidesPage from './pages/SlidesPage';
import GamesPage from './pages/GamesPage';
import AvatarsPage from './pages/AvatarsPage';
import CategoriesPage from './pages/CategoriesPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingState message="Verifying session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/?redirect=/admin';
    return null;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        basename={window.location.pathname.startsWith('/admin') ? '/admin' : ''}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="quizzes" element={<QuizzesPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="avatars" element={<AvatarsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
