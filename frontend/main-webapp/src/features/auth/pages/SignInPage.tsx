import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { PersonIcon, LockIcon, PasskeyIcon } from "../../../components/common/Icons";
import logo from "../../../assets/logo-without-text.svg";
import { signInWithPassword, signOut } from "../../../services/auth";
import { supabase } from "../../../services/supabaseClient";
import { normalizeRole } from "../../../utils/roles";

export default function SignInPage() {
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!tenant) {
      setIsLoading(false);
      setErrorMessage("Missing tenant in URL. Use /{company}/auth/login.");
      return;
    }

    try {
      const { user } = await signInWithPassword(email, password);

      // Validate that the user belongs to the tenant in the URL
      if (user) {
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", tenant)
          .single();

        if (!tenantRow) {
          await signOut();
          setErrorMessage("Công ty không tồn tại.");
          return;
        }

        const { data: userRow } = await supabase
          .from("users")
          .select("tenant_id, role")
          .eq("id", user.id)
          .single();

        if (!userRow || userRow.tenant_id !== tenantRow.id) {
          await signOut();
          setErrorMessage("Tài khoản không thuộc công ty này. Vui lòng kiểm tra lại đường dẫn.");
          return;
        }

        const normalizedRole = normalizeRole(userRow.role);
        if (normalizedRole === "SUPER_ADMIN") {
          navigate(`/${tenant}/leader-dashboard`);
        } else if (normalizedRole === "ADMIN") {
          navigate(`/${tenant}/admin/dashboard`);
        } else {
          navigate(`/${tenant}/dashboard`);
        }
      } else {
        navigate(`/${tenant}/dashboard`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeySignIn = () => {
    if (tenant) {
      navigate(`/${tenant}/dashboard`);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 sm:p-8 md:p-12"
      style={{
        background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 40%, #dce1ea 100%)',
      }}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-xl overflow-hidden animate-fadeIn"
        style={{
          boxShadow: '0 2px 6px rgba(0,0,0,0.08), 0 14px 40px rgba(0,0,0,0.12)',
          margin: '24px',
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5 p-8 pb-5">
          {/* Logo */}
          <img src={logo} alt="ONFIS Logo" className="h-9" />

          {/* Welcome Text */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-neutral-900 leading-tight">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Use your account to continue
            </p>
          </div>

          {/* Email Input */}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<PersonIcon />}
            autoComplete="email"
            required
          />

          {/* Password Input with Forgot Link */}
          <div className="w-full flex flex-col gap-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<LockIcon />}
              autoComplete="current-password"
              required
            />
            <Link
              to={tenant ? `/${tenant}/auth/forgot-password` : "/auth/forgot-password"}
              className="self-end text-xs font-medium text-primary hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {errorMessage && (
            <p className="w-full text-xs text-red-600 text-left">{errorMessage}</p>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Sign in
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Passkey Sign In Button */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            iconLeft={<PasskeyIcon />}
            onClick={handlePasskeySignIn}
          >
            Sign in with a passkey
          </Button>
        </form>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-3 text-center">
          <span className="text-xs text-neutral-400">
            © 2026 ONFIS. All rights reserved.
          </span>
        </div>
      </div>
    </div>
  );
}
