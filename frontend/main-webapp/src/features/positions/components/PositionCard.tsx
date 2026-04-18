export interface Position {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  isVacant?: boolean;
  subordinateCount?: number;
  status?: "primary" | "on_track" | "off_track";
  children?: Position[];
  /** Department header row — renders as a labelled divider, not a person card */
  isDeptHeader?: boolean;
  deptName?: string;
}

interface PositionCardProps {
  position: Position;
  isRoot?: boolean;
  onClick?: () => void;
}

// Default avatar placeholder
const DefaultAvatar = () => (
  <div className="w-[50px] h-[50px] rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="#90A1B9" strokeWidth="2" />
      <path d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

export default function PositionCard({
  position,
  isRoot = false,
  onClick,
}: PositionCardProps) {
  const { name, title, avatar, isVacant, subordinateCount, status = "on_track" } = position;

  // Border top color based on status
  const statusBorderColors = {
    primary: "border-t-primary",
    on_track: "border-t-status-on_track",
    off_track: "border-t-status-off_track",
  };

  // Vacant position has dashed border
  if (isVacant) {
    return (
      <div
        onClick={onClick}
        className="bg-white border border-dashed border-black rounded-[12px] shadow-sm 
          flex items-center gap-3 px-3 py-2 cursor-pointer hover:shadow-md transition-shadow
          w-[220px] h-[70px]"
      >
        <DefaultAvatar />
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold leading-[18px] text-neutral-400">
            Vacant Position
          </p>
          <p className="text-xs font-medium leading-4 text-neutral-400">
            {title}
          </p>
        </div>
      </div>
    );
  }

  // Root position card (slightly different styling)
  if (isRoot) {
    return (
      <div
        onClick={onClick}
        className={`bg-white border-t-4 ${statusBorderColors[status]} rounded-[12px] shadow-sm 
          flex items-center gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-[50px] h-[50px] rounded-full object-cover shrink-0"
          />
        ) : (
          <DefaultAvatar />
        )}
        <div className="flex flex-col justify-center min-w-[120px]">
          <p className="text-sm font-bold leading-[18px] text-neutral-900">
            {name}
          </p>
          <p className="text-xs leading-4 text-neutral-500">{title}</p>
        </div>
        {subordinateCount !== undefined && subordinateCount > 0 && (
          <div className="relative w-7 h-7 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-neutral-500">
              {subordinateCount}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Regular position card
  return (
    <div
      onClick={onClick}
      className={`bg-white border-t-4 ${statusBorderColors[status]} rounded-[12px] shadow-sm 
        flex items-center gap-3 px-3 py-2 cursor-pointer hover:shadow-md transition-shadow
        w-[220px] h-[70px]`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-[50px] h-[50px] rounded-full object-cover shrink-0"
        />
      ) : (
        <DefaultAvatar />
      )}
      <div className="flex flex-col justify-center flex-1">
        <p className="text-sm font-bold leading-[18px] text-neutral-900">
          {name}
        </p>
        <p className="text-xs font-medium leading-4 text-primary">
          {title}
        </p>
      </div>
    </div>
  );
}
