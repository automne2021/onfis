import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WelcomeStep from "../components/WelcomeStep";
import CompanyInfoStep from "../components/CompanyInfoStep";
import DepartmentStep from "../components/DepartmentStep";
import PositionStep from "../components/PositionStep";
import InviteTeamStep from "../components/InviteTeamStep";
import StepIndicator from "../components/StepIndicator";
import { supabase } from "../../../services/supabaseClient";
import api from "../../../services/api";

type WizardStep = "welcome" | 1 | 2 | 3 | 4;

const STEP_LABELS = ["Thông tin", "Phòng ban", "Vị trí", "Mời team"];

/** Map of department name → department UUID returned from backend */
type DepartmentIdMap = Record<string, string>;

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();

  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for each step
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    logoFile: null as File | null,
    logoPreview: null as string | null,
    size: "",
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentIdMap, setDepartmentIdMap] = useState<DepartmentIdMap>({});
  const [positions, setPositions] = useState<Record<string, string[]>>({});
  const [emails, setEmails] = useState<string[]>([]);

  const handleCompanySubmit = async () => {
    try {
      // Update tenant info via admin-service
      await api.put("/admin/tenants/me", {
        name: companyInfo.name,
        companySize: companyInfo.size,
      });

      // Upload logo if provided
      if (companyInfo.logoFile) {
        const fileExt = companyInfo.logoFile.name.split(".").pop();
        const filePath = `logos/${tenant}-logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("onfis")
          .upload(filePath, companyInfo.logoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("onfis")
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            await api.put("/admin/tenants/me", { logoUrl: urlData.publicUrl });
          }
        }
      }

      setCurrentStep(2);
    } catch (err) {
      console.error("Failed to save company info:", err);
      // Continue even if API fails (mock mode)
      setCurrentStep(2);
    }
  };

  const handleDepartmentsSubmit = async () => {
    const idMap: DepartmentIdMap = {};

    try {
      // Save departments to backend via position-service
      for (const name of departments) {
        const res = await api.post("/positions/departments", { name });
        if (res.data?.id) {
          idMap[name] = res.data.id;
        }
      }
    } catch (err) {
      console.error("Failed to save departments:", err);
    }

    setDepartmentIdMap(idMap);
    setCurrentStep(3);
  };

  const handlePositionsSubmit = async () => {
    try {
      // Save positions per department to backend using department IDs
      for (const [deptName, posNames] of Object.entries(positions)) {
        const departmentId = departmentIdMap[deptName];

        for (const posName of posNames) {
          await api.post("/positions", {
            title: posName,
            departmentId: departmentId || null,
          });
        }
      }
    } catch (err) {
      console.error("Failed to save positions:", err);
    }
    setCurrentStep(4);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Send invitations via Supabase inviteUserByEmail
      if (emails.length > 0) {
        for (const email of emails) {
          try {
            await supabase.auth.admin.inviteUserByEmail(email, {
              data: {
                tenant_id: undefined, // Will be set after they sign up
                role: "EMPLOYEE",
              },
              redirectTo: `${window.location.origin}/${tenant}/auth/login`,
            });
          } catch (inviteErr) {
            console.warn(`Failed to invite ${email}:`, inviteErr);
            // If admin invite fails, fallback: just log it
            // The CEO can invite them manually later
          }
        }
      }

      // Mark setup as completed
      await api.put("/admin/tenants/me", { setupCompleted: true });

      // Navigate to dashboard
      navigate(`/${tenant}/dashboard`, { replace: true });
    } catch (err) {
      console.error("Failed to finalize setup:", err);
      // Navigate anyway — setup data saved
      navigate(`/${tenant}/dashboard`, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipInvite = async () => {
    setIsSubmitting(true);
    try {
      await api.put("/admin/tenants/me", { setupCompleted: true });
    } catch (err) {
      console.error("Failed to mark setup as completed:", err);
    }
    setIsSubmitting(false);
    navigate(`/${tenant}/dashboard`, { replace: true });
  };

  return (
    <div className="h-full w-full flex flex-col">
      {currentStep === "welcome" ? (
        <WelcomeStep onNext={() => setCurrentStep(1)} />
      ) : (
        <div className="flex-1 flex flex-col py-8 px-6 overflow-hidden">
          {/* Step indicator at top */}
          <div className="mb-10 shrink-0">
            <StepIndicator
              currentStep={currentStep as number}
              totalSteps={4}
              labels={STEP_LABELS}
            />
          </div>

          {/* Step content (centered) */}
          <div className="flex-1 flex items-start justify-center overflow-y-auto">
            <div className="w-full animate-fadeIn">
              {currentStep === 1 && (
                <CompanyInfoStep
                  data={companyInfo}
                  onUpdate={setCompanyInfo}
                  onNext={handleCompanySubmit}
                  onBack={() => setCurrentStep("welcome")}
                />
              )}
              {currentStep === 2 && (
                <DepartmentStep
                  departments={departments}
                  onUpdate={setDepartments}
                  onNext={handleDepartmentsSubmit}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && (
                <PositionStep
                  departments={departments}
                  positions={positions}
                  onUpdate={setPositions}
                  onNext={handlePositionsSubmit}
                  onBack={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 4 && (
                <InviteTeamStep
                  emails={emails}
                  onUpdate={setEmails}
                  onSubmit={handleFinalSubmit}
                  onSkip={handleSkipInvite}
                  onBack={() => setCurrentStep(3)}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
