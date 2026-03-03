import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

import { Announcement } from '../features/announcements/pages/Announcement';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" />
      </Route>
      <Route path="/" element={<MainLayout />}>
        <Route path="announcement" element={<Announcement />}>
        </Route>
        <Route path="register" />
      </Route>
    </>
  )
)