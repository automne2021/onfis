import { LockOutlined } from '@mui/icons-material';

interface TabProps {
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  isLock?: boolean; 
}

export function Tab({ label, icon, isActive, onClick, isLock = false } : TabProps) {
  return(
    <button 
      type='button'
      onClick={onClick}
      className={`flex gap-2 px-4 py-2 transition-all duration-200 body-3-medium border-b-2 items-center justify-center
        ${isLock 
          ? 'border-transparent text-neutral-400 cursor-not-allowed bg-neutral-50/50' // 3. Style khi bị khóa
          : isActive 
            ? 'border-primary text-primary'
            : 'border-transparent text-neutral-500 hover:bg-neutral-200 hover:border-primary'
        }
      `}
    >
      {/* Nếu bị khóa thì hiện icon Khóa, nếu không thì hiện icon truyền vào (nếu có) */}
      {isLock ? <LockOutlined sx={{ fontSize: 18 }} /> : icon}
      <span>{label}</span>
    </button>
  )
}