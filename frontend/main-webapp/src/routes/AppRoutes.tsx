import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

import { Announcement } from '../features/announcements/pages/Announcement';
import { AnnouncementDetail } from '../features/announcements/pages/AnnouncementDetail';
import { UserProfile } from '../features/profile/pages/UserProfile';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" />
      </Route>
      <Route path="/" element={<MainLayout />}>
        <Route path="announcement">
          <Route index element={<Announcement />} />
          <Route path=':id/:slug' element={<AnnouncementDetail />}/>
        </Route>
        <Route path='profile'>
          <Route path=':id' element={<UserProfile />}/>
        </Route>
      </Route>
    </>
  )
)