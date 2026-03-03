
interface ToolbarButtonProps {
  onClick: () => void
  isActive: boolean
  icon: React.ReactNode
}

export function ToolbarButton({ onClick, isActive, icon } : ToolbarButtonProps) {
  return(
    <button
      type="button" // Prevent submit form 
      onClick={onClick}
      className={` p-2 rounded-[4px] transition flex items-center justify-center
        ${isActive 
          ? 'bg-neutral-200 text-neutral-600'
          : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-200'
        }  
      `}
    >
      {icon}
    </button>
  )
}