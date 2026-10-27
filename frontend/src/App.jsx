import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardShell } from './components/layout/DashboardShell';

// Pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/public/LoginPage';
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { SupervisorErrorsPage } from './pages/supervisor/SupervisorErrorsPage';
import { SupervisorAuditPage } from './pages/supervisor/SupervisorAuditPage';
import { SupervisorTestTriggerPage } from './pages/supervisor/SupervisorTestTriggerPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSwimmersPage } from './pages/admin/AdminSwimmersPage';
import { AdminSwimmerDetailPage } from './pages/admin/AdminSwimmerDetailPage';
import { AdminCoachesPage } from './pages/admin/AdminCoachesPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage';
import { AdminLeaguesPage } from './pages/admin/AdminLeaguesPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminNewsPage } from './pages/admin/AdminNewsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdminEnrollmentsPage } from './pages/admin/AdminEnrollmentsPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';

// Coach Pages
import { CoachDashboard } from './pages/coach/CoachDashboard';
import { CoachAttendancePage } from './pages/coach/CoachAttendancePage';
import { CoachAssessmentsPage } from './pages/coach/CoachAssessmentsPage';

// Swimmer Pages
import { SwimmerPortal } from './pages/swimmer/SwimmerPortal';
import { SwimmerCompleteProfilePage } from './pages/swimmer/SwimmerCompleteProfilePage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role) && !user.is_superuser) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website */}
              <Route
                path="/"
                element={
                  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
                    <Navbar />
                    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                      <HomePage />
                    </main>
                  </div>
                }
              />
              <Route
                path="/login"
                element={
                  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
                    <Navbar />
                    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                      <LoginPage />
                    </main>
                  </div>
                }
              />

              {/* Supervisor Protected Routes */}
              <Route
                path="/supervisor"
                element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SupervisorDashboard />} />
                <Route path="errors" element={<SupervisorErrorsPage />} />
                <Route path="audit" element={<SupervisorAuditPage />} />
                <Route path="test" element={<SupervisorTestTriggerPage />} />
              </Route>

              {/* Admin Protected Routes - Full 13 Operations Hub */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                {/* 1. Dashboard */}
                <Route index element={<AdminDashboard />} />

                {/* 2. Educational Management */}
                <Route path="swimmers" element={<AdminSwimmersPage />} />
                <Route path="swimmers/:id" element={<AdminSwimmerDetailPage />} />
                <Route path="coaches" element={<AdminCoachesPage />} />
                <Route path="courses" element={<AdminCoursesPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />

                {/* 3. Performance & Competitions */}
                <Route path="assessments" element={<AdminAssessmentsPage />} />
                <Route path="leagues" element={<AdminLeaguesPage />} />

                {/* 4. Financial Hub */}
                <Route path="finance" element={<AdminFinancePage />} />

                {/* 5. Content & Communications */}
                <Route path="news" element={<AdminNewsPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />

                {/* 6. Reports & Analytics */}
                <Route path="reports" element={<AdminReportsPage />} />

                {/* 7. Profile & System Management */}
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="settings" element={<Navigate to="/admin/profile?tab=settings" replace />} />
                <Route path="security" element={<Navigate to="/admin/profile?tab=users" replace />} />

                {/* Auxiliary direct routes */}
                <Route path="enrollments" element={<AdminEnrollmentsPage />} />
                <Route path="sessions" element={<AdminSessionsPage />} />
              </Route>

              {/* Coach Protected Routes */}
              <Route
                path="/coach"
                element={
                  <ProtectedRoute allowedRoles={['COACH', 'ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CoachDashboard />} />
                <Route path="attendance" element={<CoachAttendancePage />} />
                <Route path="assessments" element={<CoachAssessmentsPage />} />
              </Route>

              {/* Swimmer Protected Routes */}
              <Route
                path="/swimmer"
                element={
                  <ProtectedRoute allowedRoles={['SWIMMER', 'ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SwimmerPortal />} />
                <Route path="complete-profile" element={<SwimmerCompleteProfilePage />} />
                <Route path="schedule" element={<SwimmerPortal />} />
                <Route path="finance" element={<SwimmerPortal />} />
                <Route path="progress" element={<SwimmerPortal />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
