import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import LandingPageLayout from '../layouts/LandingPageLayout';
import LandingPage from '../features/landing/pages/LandingPage';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LandingPageLayout />}>
        <Route index element={<LandingPage />}/>
      </Route>
    </>
  )
)