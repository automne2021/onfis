import { Outlet } from "react-router-dom";
import LandingPageHeader from "../features/landing/components/LandingPageHeader";
import LandingPageFooter from "../features/landing/components/LandingPageFooter";

export default function LandingPageLayout() {
  return(
    <main>
      <LandingPageHeader />
        <Outlet />
      <LandingPageFooter />
    </main>
  );
}