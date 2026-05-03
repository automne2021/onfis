import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmployeeWelcomeStep from "../components/EmployeeWelcomeStep";
import EmployeeProfileStep, { EMPTY_PROFILE, type ProfileFormData } from "../components/EmployeeProfileStep";
import ChangePasswordStep from "../components/ChangePasswordStep";
import StepIndicator from "../components/StepIndicator";
import api from "../../../services/api";

type WizardStep = "welcome" | 1 | 2;

const STEP_LABELS = ["Hồ sơ cá nhân", "Đổi mật khẩu"];

export default function EmployeeSetupWizardPage() {
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();

  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>(EMPTY_PROFILE);

  const handleProfileSubmit = async () => {
    try {
      // Save profile data via user-service
      await api.put("/users/me/profile", profileData);
      setCurrentStep(2);
    } catch (err) {
      console.error("Failed to save profile:", err);
      // Continue anyway — user can update profile later
      setCurrentStep(2);
    }
  };

  const handleFinalComplete = async () => {
    setIsSubmitting(true);
    try {
      // Mark onboarding as complete
      await api.put("/users/me/complete-onboarding");

      // Navigate to dashboard
      navigate(`/${tenant}/dashboard`, { replace: true });
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      // Navigate anyway — password was changed successfully
      navigate(`/${tenant}/dashboard`, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      {currentStep === "welcome" ? (
        <EmployeeWelcomeStep onNext={() => setCurrentStep(1)} />
      ) : (
        <div className="flex-1 flex flex-col py-8 px-6 overflow-hidden">
          {/* Step indicator */}
          <div className="mb-8 shrink-0 max-w-3xl mx-auto w-full">
            <StepIndicator
              currentStep={currentStep as number}
              totalSteps={2}
              labels={STEP_LABELS}
              variant="light"
            />
          </div>

          {/* Step content */}
          <div className="flex-1 flex items-start justify-center overflow-y-auto">
            <div className="w-full animate-fadeIn pb-10">
              {currentStep === 1 && (
                <EmployeeProfileStep
                  data={profileData}
                  onUpdate={setProfileData}
                  onNext={handleProfileSubmit}
                  onBack={() => setCurrentStep("welcome")}
                />
              )}
              {currentStep === 2 && (
                <ChangePasswordStep
                  onComplete={handleFinalComplete}
                  onBack={() => setCurrentStep(1)}
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
