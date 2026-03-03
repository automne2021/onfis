import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header";

const mockCompanyName = "Your company"

export default function MainLayout() {
  return(
    <main>
      <Header 
        companyName={mockCompanyName}
      />
      <Outlet />
    </main>
  );
}