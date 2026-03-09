import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { PersonIcon, LockIcon, PasskeyIcon } from "../../../components/common/Icons";
import logo from "../../../assets/logo-without-text.svg";

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
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 lg:gap-5 p-5 lg:p-7">
          {/* Logo */}
          <img src={logo} alt="Logo" className="h-10" />

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
            iconLeft={<PasskeyIcon />}
            onClick={handlePasskeySignIn}
          >
            Sign in with a passkey
          </Button>
        </form>
      </div>
    </div>
  );
}
