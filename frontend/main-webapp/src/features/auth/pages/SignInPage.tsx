import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { PersonIcon, LockIcon, PasskeyIcon } from "../../../components/common/Icons";

// Logo Icon SVG - keep as custom SVG (brand mark)
const LogoIcon = () => (
  <svg
    width="78"
    height="51"
    viewBox="0 0 54 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M27 0C12.088 0 0 12.088 0 27C0 29.761 0.373 32.438 1.077 34H52.923C53.627 32.438 54 29.761 54 27C54 12.088 41.912 0 27 0ZM15 24V34H21V24C21 22.343 19.657 21 18 21C16.343 21 15 22.343 15 24ZM24 18V34H30V18C30 16.343 28.657 15 27 15C25.343 15 24 16.343 24 18ZM33 12V34H39V12C39 10.343 37.657 9 36 9C34.343 9 33 10.343 33 12Z"
      fill="#0014A8"
    />
  </svg>
);

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement actual sign-in logic
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handlePasskeySignIn = () => {
    // TODO: Implement passkey sign-in
    console.log("Passkey sign-in");
  };

  return (
    <div className="w-full max-w-md">
      {/* Sign In Card */}
      <div className="bg-white rounded-[20px] shadow-[0px_4px_4px_0px_#e2e8f0] border-t-[10px] border-primary overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 lg:gap-[30px] p-5 lg:p-8">
          {/* Logo */}
          <LogoIcon />

          {/* Welcome Text */}
          <div className="text-center">
            <h1 className="text-[22px] font-bold text-neutral-900 leading-[26px]">
              Welcome
            </h1>
            <p className="mt-2 text-sm text-neutral-400 leading-[18px]">
              Sign in to manage your workspace
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
          <div className="w-full flex flex-col gap-2.5">
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
              className="self-end text-xs font-medium text-neutral-500 hover:text-primary transition-colors"
            >
              Forgot your password?
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
          <div className="flex items-center gap-2.5 w-full">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-sm text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Passkey Sign In Button */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            icon={<PasskeyIcon />}
            onClick={handlePasskeySignIn}
          >
            Sign in with a passkey
          </Button>
        </form>
      </div>
    </div>
  );
}
