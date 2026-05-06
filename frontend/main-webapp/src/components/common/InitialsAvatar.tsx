import React from "react";

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorClass(name: string): string {
  const index =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[index];
}

interface InitialsAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  size = 28,
  className = "",
}) => {
  const initials = getInitials(name || "?");
  const colorClass = getColorClass(name || "");
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={`${colorClass} rounded-full flex items-center justify-center shrink-0 text-white font-semibold border-2 border-white shadow-sm ${className}`}
      style={{ width: size, height: size, fontSize }}
      title={name}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
