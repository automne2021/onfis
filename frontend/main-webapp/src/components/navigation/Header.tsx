import { Link } from "react-router-dom";
import { MessageIcon, NotificationIcon } from "../common/Icons";

// Logo Icon SVG - keep as custom SVG (not a standard Material icon)
const LogoIcon = () => (
  <svg
    width="36"
    height="24"
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

interface HeaderProps {
  companyName?: string;
  userAvatarUrl?: string;
}

export default function Header({
  companyName = "Your company",
  userAvatarUrl,
}: HeaderProps) {
  return (
    <header className="bg-white flex items-center justify-between px-3 py-2 shadow-[0px_4px_4px_0px_#e2e8f0] w-full">
      {/* Logo Section */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <LogoIcon />
        <span className="font-bold text-sm text-primary">
          {companyName}
        </span>
      </Link>

      {/* Actions Section */}
      <div className="flex items-center gap-2">
        {/* Message Button */}
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
          aria-label="Messages"
        >
          <MessageIcon />
        </button>

        {/* Notification Button */}
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-neutral-50 transition-colors relative"
          aria-label="Notifications"
        >
          <NotificationIcon />
        </button>

        {/* User Avatar */}
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all"
          aria-label="User menu"
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-medium">
              U
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
