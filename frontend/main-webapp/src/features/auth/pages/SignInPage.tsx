import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { PersonIcon, LockIcon, PasskeyIcon } from "../../../components/common/Icons";
import logo from "../../../assets/logo-without-text.svg";

export default function SignInPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth then navigate to dashboard
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  const handlePasskeySignIn = () => {
    // TODO: Implement passkey sign-in
    navigate("/dashboard");
  };

  return (
    <div
      className="w-full max-w-[440px] bg-white rounded-lg overflow-hidden"
      style={{
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5 p-8 pb-6">
        {/* Logo */}
        <img src={logo} alt="Logo" className="h-9" />

        {/* Welcome Text */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Use your account to continue
          </p>
        </div>

        {/* Username Input */}
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<PersonIcon />}
          autoComplete="username"
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
            to="/forgot-password"
            className="self-end text-xs font-medium text-primary hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

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
  );
}
