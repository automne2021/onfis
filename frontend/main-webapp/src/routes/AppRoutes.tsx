import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import AdminGuard from './AdminGuard';
import LeaderGuard from './LeaderGuard';
import PlaceholderPage from './PlaceholderPage';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import SetupLayout from '../layouts/SetupLayout';

// Auth
import SignInPage from '../features/auth/pages/SignInPage';

// Setup Wizard
import SetupWizardPage from '../features/setup/pages/SetupWizardPage';
import EmployeeSetupWizardPage from '../features/setup/pages/EmployeeSetupWizardPage';

// Dashboard
import { DashboardPage } from '../features/dashboard';

// Leader Dashboard
import LeaderDashboardPage from '../features/leader-dashboard/pages/LeaderDashboardPage';

// Delegation
import DelegationPage from '../features/delegation/pages/DelegationPage';

// Announcements (existing)
import { Announcement } from '../features/announcements/pages/Announcement';
import { AnnouncementDetail } from '../features/announcements/pages/AnnouncementDetail';

// Chat (existing)
import { ChatPage } from '../features/chat/pages/ChatPage';

// Profile (existing)
import { UserProfile } from '../features/profile/pages/UserProfile';

// Projects (new from frontend-projects)
import { ProjectsPage, ProjectDetailPage } from '../features/projects';
import ProjectMembersPage from '../features/projects/pages/ProjectMembersPage';

// Tasks (new from frontend-projects)
import { ProjectTasksPage } from '../features/tasks';
import MyTasksPage from '../features/tasks/pages/MyTasksPage';
import ReviewQueuePage from '../features/tasks/pages/ReviewQueuePage';

// Positions (new from frontend-projects)
import { PositionTreePage } from '../features/positions';
import SettingsPage from '../features/settings/pages/SettingsPage';

// Admin module
import RequestCenterPage from '../features/admin/pages/RequestCenterPage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import SystemSettingsPage from '../features/admin/pages/SystemSettingsPage';
import AuditLogsPage from '../features/admin/pages/AuditLogsPage';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/:tenant">
        {/* Auth Routes (no sidebar/header) */}
        <Route path="auth" element={<AuthLayout />}>
          <Route path="login" element={<SignInPage />} />
          <Route path="register" element={<PlaceholderPage title="Register" />} />
        </Route>

        {/* Setup Wizard Routes (full-screen, no sidebar) */}
        <Route path="setup" element={<SetupLayout />}>
          <Route index element={<SetupWizardPage />} />
        </Route>

        {/* Employee Onboarding Wizard (white bg, no sidebar) */}
        <Route path="employee-setup" element={<EmployeeSetupWizardPage />} />

        {/* App Routes (with sidebar/header) */}
        <Route path="" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route element={<LeaderGuard />}>
            <Route path="leader-dashboard" element={<LeaderDashboardPage />} />
          </Route>

          <Route path="delegation" element={<DelegationPage />} />

          <Route path="announcements">
            <Route index element={<Announcement />} />
            <Route path=":id/:slug" element={<AnnouncementDetail />} />
          </Route>

          <Route path="discuss">
            <Route index element={<ChatPage />} />
          </Route>

          <Route path="profile">
            <Route path=":id" element={<UserProfile />} />
          </Route>

          <Route path="positions" element={<PositionTreePage />} />

          <Route path="my-tasks" element={<MyTasksPage />} />

          <Route path="projects">
            <Route index element={<ProjectsPage />} />
            <Route path="reviews" element={<ReviewQueuePage />} />
            <Route path=":projectId" element={<ProjectDetailPage />} />
            <Route path=":projectId/tasks" element={<ProjectTasksPage />} />
            <Route path=":projectId/members" element={<ProjectMembersPage />} />
            <Route path=":projectId/reviews" element={<ReviewQueuePage />} />
          </Route>

          <Route path="settings" element={<SettingsPage />} />

          {/* Admin module – ADMIN only */}
          <Route path="admin" element={<AdminGuard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="requests" element={<RequestCenterPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="system" element={<SystemSettingsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
          </Route>
        </Route>
      </Route>
    </>
  )
)