import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import LandingPageLayout from '../layouts/LandingPageLayout';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import LandingPage from '../features/landing/pages/LandingPage';
import SignInPage from '../features/auth/pages/SignInPage';
import { DashboardPage } from '../features/dashboard';
import { ProjectsPage, ProjectDetailPage } from '../features/projects';
import { ProjectTasksPage } from '../features/tasks';
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
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPageLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      {/* Auth Routes (no sidebar/header) */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<PlaceholderPage title="Register" />} />
      </Route>

      {/* App Routes (with sidebar/header) */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/announcements" element={<PlaceholderPage title="Announcements" />} />
        <Route path="/discuss" element={<PlaceholderPage title="Discuss" />} />
        <Route path="/positions" element={<PositionTreePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/tasks" element={<ProjectTasksPage />} />
      </Route>
    </>
  )
)