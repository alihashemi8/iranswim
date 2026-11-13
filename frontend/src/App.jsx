import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SwimmerProvider } from './context/SwimmerContext';
import { LandingSectionsProvider } from './context/LandingSectionsContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardShell } from './components/layout/DashboardShell';

// Pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/public/LoginPage';
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { SupervisorInfrastructurePage } from './pages/supervisor/SupervisorInfrastructurePage';
import { SupervisorServicesPage } from './pages/supervisor/SupervisorServicesPage';
import { SupervisorErrorsPage } from './pages/supervisor/SupervisorErrorsPage';
import { SupervisorActivityPage } from './pages/supervisor/SupervisorActivityPage';
import { SupervisorDeploymentsPage } from './pages/supervisor/SupervisorDeploymentsPage';
import { SupervisorBackupsPage } from './pages/supervisor/SupervisorBackupsPage';
import { SupervisorConfigPage } from './pages/supervisor/SupervisorConfigPage';
import { SupervisorAuditPage } from './pages/supervisor/SupervisorAuditPage';
import { SupervisorTestTriggerPage } from './pages/supervisor/SupervisorTestTriggerPage';
import { SupervisorUsersPage } from './pages/supervisor/SupervisorUsersPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSwimmersPage } from './pages/admin/AdminSwimmersPage';
import { AdminSwimmerDetailPage } from './pages/admin/AdminSwimmerDetailPage';
import { AdminDirectEnrollPage } from './pages/admin/AdminDirectEnrollPage';
import { AdminCoachesPage } from './pages/admin/AdminCoachesPage';
import { AdminCreateCoachPage } from './pages/admin/AdminCreateCoachPage';
import { AdminCoachDetailPage } from './pages/admin/AdminCoachDetailPage';
import { AdminCoachSchedulePage } from './pages/admin/AdminCoachSchedulePage';
import { AdminCoachAssignGroupPage } from './pages/admin/AdminCoachAssignGroupPage';
import { AdminCoachCreateContractPage } from './pages/admin/coach-profile/AdminCoachCreateContractPage';
import { AdminCoachCreatePayrollPage } from './pages/admin/coach-profile/AdminCoachCreatePayrollPage';
import { AdminCoachRegisterPaymentPage } from './pages/admin/coach-profile/AdminCoachRegisterPaymentPage';
import { AdminCoachAddCertificatePage } from './pages/admin/coach-profile/AdminCoachAddCertificatePage';
import { AdminCoachCreateEvaluationPage } from './pages/admin/coach-profile/AdminCoachCreateEvaluationPage';
import { AdminCoachCreateLeavePage } from './pages/admin/coach-profile/AdminCoachCreateLeavePage';
import { AdminCoachCreateNotePage } from './pages/admin/coach-profile/AdminCoachCreateNotePage';
import { AdminCoachEditPage } from './pages/admin/coach-profile/AdminCoachEditPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminCreateCoursePage } from './pages/admin/AdminCreateCoursePage';
import { AdminCourseDetailPage } from './pages/admin/AdminCourseDetailPage';
import { AdminCourseAddCoachPage } from './pages/admin/AdminCourseAddCoachPage';
import { AdminClassDetailPage } from './pages/admin/AdminClassDetailPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import { AdminAttendanceDetailPage } from './pages/admin/AdminAttendanceDetailPage';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage';
import { AdminLeaguesPage } from './pages/admin/AdminLeaguesPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminNewsPage } from './pages/admin/AdminNewsPage';
import { AdminWebsiteManagerPage } from './pages/admin/AdminWebsiteManagerPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminCreateAnnouncementPage } from './pages/admin/AdminCreateAnnouncementPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdminEnrollmentsPage } from './pages/admin/AdminEnrollmentsPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';

// Coach Pages
import { CoachDashboard } from './pages/coach/CoachDashboard';
import { CoachClassesPage } from './pages/coach/CoachClassesPage';
import { CoachClassesArchivePage } from './pages/coach/CoachClassesArchivePage';
import { CoachClassDetailPage } from './pages/coach/CoachClassDetailPage';
import { CoachAttendancePage } from './pages/coach/CoachAttendancePage';
import { CoachProgressPage } from './pages/coach/CoachProgressPage';
import { CoachSwimmerDossierPage } from './pages/coach/CoachSwimmerDossierPage';
import { CoachAssessmentRecordPage } from './pages/coach/CoachAssessmentRecordPage';
import { CoachSkillsManagerPage } from './pages/coach/CoachSkillsManagerPage';
import { CoachAssessmentsPage } from './pages/coach/CoachAssessmentsPage';
import { CoachExamsPage } from './pages/coach/CoachExamsPage';
import { CoachWorkoutsPage } from './pages/coach/CoachWorkoutsPage';
import { CoachMessagesPage } from './pages/coach/CoachMessagesPage';
import { CoachCreateAnnouncementPage } from './pages/coach/CoachCreateAnnouncementPage';
import { CoachProfilePage } from './pages/coach/CoachProfilePage';


// Swimmer Pages
import { SwimmerPortal } from './pages/swimmer/SwimmerPortal';
import { SwimmerCompleteProfilePage } from './pages/swimmer/SwimmerCompleteProfilePage';
import { SwimmerDashboardPage } from './pages/swimmer/SwimmerDashboardPage';
import { SwimmerSchedulePage } from './pages/swimmer/SwimmerSchedulePage';
import { SwimmerProgressPage } from './pages/swimmer/SwimmerProgressPage';
import { SwimmerLeaguePage } from './pages/swimmer/SwimmerLeaguePage';
import { SwimmerFinancePage } from './pages/swimmer/SwimmerFinancePage';
import { SwimmerAttendancePage } from './pages/swimmer/SwimmerAttendancePage';
import { SwimmerDocumentsPage } from './pages/swimmer/SwimmerDocumentsPage';
import { SwimmerAnnouncementsPage } from './pages/swimmer/SwimmerAnnouncementsPage';
import { SwimmerSupportPage } from './pages/swimmer/SwimmerSupportPage';
import { SwimmerProfilePage } from './pages/swimmer/SwimmerProfilePage';
import { SwimmerSettingsPage } from './pages/swimmer/SwimmerSettingsPage';

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
          <SwimmerProvider>
            <LandingSectionsProvider>
              <BrowserRouter>
            <Routes>
              {/* Public Website */}
              <Route
                path="/"
                element={
                  <div className="min-h-screen bg-pool-caustics water-ripple-pattern dark:bg-slate-950 text-[#163247] dark:text-slate-100 flex flex-col transition-colors selection:bg-cyan-100 selection:text-cyan-900 w-full overflow-x-clip">
                    <Navbar />
                    <main className="flex-1 w-full overflow-x-clip">
                      <HomePage />
                    </main>
                  </div>
                }
              />
              <Route
                path="/login"
                element={
                  <div className="min-h-screen text-[#163247] dark:text-slate-100 flex flex-col transition-colors selection:bg-cyan-100 selection:text-cyan-900 w-full overflow-x-clip relative">
                    <Navbar />
                    <main className="flex-1 w-full flex items-center justify-center relative z-10">
                      <LoginPage />
                    </main>
                  </div>
                }
              />
              <Route
                path="/register"
                element={
                  <div className="min-h-screen text-[#163247] dark:text-slate-100 flex flex-col transition-colors selection:bg-cyan-100 selection:text-cyan-900 w-full overflow-x-clip relative">
                    <Navbar />
                    <main className="flex-1 w-full flex items-center justify-center relative z-10">
                      <LoginPage defaultMode="register" />
                    </main>
                  </div>
                }
              />

              {/* Supervisor Protected Routes - Technical Operations Hub */}
              <Route
                path="/supervisor"
                element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SupervisorDashboard />} />
                <Route path="infrastructure" element={<SupervisorInfrastructurePage />} />
                <Route path="services" element={<SupervisorServicesPage />} />
                <Route path="errors" element={<SupervisorErrorsPage />} />
                <Route path="activity" element={<SupervisorActivityPage />} />
                <Route path="deployments" element={<SupervisorDeploymentsPage />} />
                <Route path="backups" element={<SupervisorBackupsPage />} />
                <Route path="config" element={<SupervisorConfigPage />} />
                <Route path="audit" element={<SupervisorAuditPage />} />
                <Route path="test" element={<SupervisorTestTriggerPage />} />
                <Route path="users" element={<SupervisorUsersPage />} />
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
                <Route path="swimmers/:id/enroll" element={<AdminDirectEnrollPage />} />
                <Route path="swimmers/enroll" element={<AdminDirectEnrollPage />} />
                <Route path="coaches" element={<AdminCoachesPage />} />
                <Route path="coaches/new" element={<AdminCreateCoachPage />} />
                <Route path="coaches/:id" element={<AdminCoachDetailPage />} />
                <Route path="coaches/:id/edit" element={<AdminCoachEditPage />} />
                <Route path="coaches/:id/schedule" element={<AdminCoachSchedulePage />} />
                <Route path="coaches/:id/assign" element={<AdminCoachAssignGroupPage />} />
                <Route path="coaches/:id/assign-group" element={<AdminCoachAssignGroupPage />} />
                <Route path="coaches/:id/contracts/new" element={<AdminCoachCreateContractPage />} />
                <Route path="coaches/:id/payrolls/new" element={<AdminCoachCreatePayrollPage />} />
                <Route path="coaches/:id/payrolls/:payrollId/payments/new" element={<AdminCoachRegisterPaymentPage />} />
                <Route path="coaches/:id/certificates/new" element={<AdminCoachAddCertificatePage />} />
                <Route path="coaches/:id/evaluations/new" element={<AdminCoachCreateEvaluationPage />} />
                <Route path="coaches/:id/leaves/new" element={<AdminCoachCreateLeavePage />} />
                <Route path="coaches/:id/notes/new" element={<AdminCoachCreateNotePage />} />
                <Route path="courses" element={<AdminCoursesPage />} />
                <Route path="courses/new" element={<AdminCreateCoursePage />} />
                <Route path="courses/:id" element={<AdminCourseDetailPage />} />
                <Route path="courses/:id/swimmers" element={<AdminCourseDetailPage />} />
                <Route path="courses/:id/add-coach" element={<AdminCourseAddCoachPage />} />
                <Route path="classes/:id" element={<AdminClassDetailPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="attendance/:sessionId" element={<AdminAttendanceDetailPage />} />

                {/* 3. Performance & Competitions */}
                <Route path="assessments" element={<AdminAssessmentsPage />} />
                <Route path="leagues" element={<AdminLeaguesPage />} />

                {/* 4. Financial Hub */}
                <Route path="finance" element={<AdminFinancePage />} />

                {/* 5. Content & Communications */}
                <Route path="website" element={<AdminWebsiteManagerPage />} />
                <Route path="news" element={<AdminNewsPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="announcements/new" element={<AdminCreateAnnouncementPage />} />
                <Route path="announcements/create" element={<Navigate to="/admin/announcements/new" replace />} />

                {/* 6. Reports & Analytics (Removed, redirect to Admin) */}
                <Route path="reports" element={<Navigate to="/admin" replace />} />

                {/* 7. Profile & System Management */}
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="settings" element={<Navigate to="/admin/profile?tab=settings" replace />} />
                <Route path="security" element={<Navigate to="/admin/profile?tab=users" replace />} />

                {/* Auxiliary direct routes */}
                <Route path="enrollments" element={<AdminEnrollmentsPage />} />
                <Route path="enrollments/new" element={<AdminDirectEnrollPage />} />
                <Route path="sessions" element={<AdminSessionsPage />} />
              </Route>

              {/* Coach Protected Routes (9 Modules Hub) */}
              <Route
                path="/coach"
                element={
                  <ProtectedRoute allowedRoles={['COACH', 'ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                {/* 1. Dashboard */}
                <Route index element={<CoachDashboard />} />

                {/* 2. My Classes */}
                <Route path="classes" element={<CoachClassesPage />} />
                <Route path="classes/archive" element={<CoachClassesArchivePage />} />
                <Route path="classes/:id" element={<CoachClassDetailPage />} />

                {/* 3. Attendance */}
                <Route path="attendance" element={<CoachAttendancePage />} />

                {/* 4. Progress & Swimmer Dossier */}
                <Route path="progress" element={<CoachProgressPage />} />
                <Route path="progress/skills" element={<CoachSkillsManagerPage />} />
                <Route path="skills" element={<CoachSkillsManagerPage />} />
                <Route path="progress/:swimmerId" element={<CoachSwimmerDossierPage />} />
                <Route path="progress/:swimmerId/assessment" element={<CoachAssessmentRecordPage />} />
                <Route path="assessments" element={<Navigate to="/coach/progress" replace />} />

                {/* 5. Exams & Levels */}
                <Route path="exams" element={<CoachExamsPage />} />

                {/* 6. Workouts */}
                <Route path="workouts" element={<CoachWorkoutsPage />} />

                {/* Redirect legacy AI assistant */}
                <Route path="ai-assistant" element={<Navigate to="/coach" replace />} />

                {/* 7. Messages & Communications */}
                <Route path="messages" element={<CoachMessagesPage />} />
                <Route path="messages/new" element={<CoachCreateAnnouncementPage />} />
                <Route path="messages/create" element={<Navigate to="/coach/messages/new" replace />} />

                {/* 9. Profile & Settings */}
                <Route path="profile" element={<CoachProfilePage />} />
              </Route>


              {/* Swimmer Protected Routes (10 Modules Hub) */}
              <Route
                path="/swimmer"
                element={
                  <ProtectedRoute allowedRoles={['SWIMMER', 'ADMIN']}>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              >
                {/* 1. Dashboard */}
                <Route index element={<SwimmerDashboardPage />} />

                {/* 2. Athletic Activity */}
                <Route path="schedule" element={<SwimmerSchedulePage />} />
                <Route path="progress" element={<SwimmerProgressPage />} />
                <Route path="league" element={<SwimmerLeaguePage />} />
                <Route path="attendance" element={<SwimmerAttendancePage />} />

                {/* 3. Finance & Communications */}
                <Route path="finance" element={<SwimmerFinancePage />} />
                <Route path="announcements" element={<SwimmerAnnouncementsPage />} />
                <Route path="support" element={<SwimmerSupportPage />} />

                {/* 4. Account & Documents */}
                <Route path="documents" element={<SwimmerDocumentsPage />} />
                <Route path="profile" element={<SwimmerProfilePage />} />
                <Route path="settings" element={<Navigate to="/swimmer/profile?tab=security" replace />} />
                <Route path="complete-profile" element={<Navigate to="/swimmer/profile" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LandingSectionsProvider>
      </SwimmerProvider>
    </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}
