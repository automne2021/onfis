import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import LandingPageLayout from '../layouts/LandingPageLayout';
import AuthLayout from '../layouts/AuthLayout';
import LandingPage from '../features/landing/pages/LandingPage';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LandingPageLayout />}>
        <Route index element={<LandingPage />}/>
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" />
        <Route path="register" />
      </Route>
    </>
  )
)