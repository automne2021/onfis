import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';

// Auth
import SignInPage from '../features/auth/pages/SignInPage';

// Dashboard
import { DashboardPage } from '../features/dashboard';

// Announcements (existing)
import { Announcement } from '../features/announcements/pages/Announcement';
import { AnnouncementDetail } from '../features/announcements/pages/AnnouncementDetail';

// Chat (existing)
import { ChatPage } from '../features/chat/pages/ChatPage';

// Profile (existing)
import { UserProfile } from '../features/profile/pages/UserProfile';

// Projects (new from frontend-projects)
import { ProjectsPage, ProjectDetailPage } from '../features/projects';

// Tasks (new from frontend-projects)
import { ProjectTasksPage } from '../features/tasks';

// Positions (new from frontend-projects)
import { PositionTreePage } from '../features/positions';

// Placeholder component for pages not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h1>
      <p className="text-neutral-500">This page is under construction</p>
    </div>
  </div>
);

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Auth Routes (no sidebar/header) */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<PlaceholderPage title="Register" />} />
      </Route>

      {/* App Routes (with sidebar/header) */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />

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

        <Route path="projects">
          <Route index element={<ProjectsPage />} />
          <Route path=":projectId" element={<ProjectDetailPage />} />
          <Route path=":projectId/tasks" element={<ProjectTasksPage />} />
        </Route>

        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
    </>
  )
)