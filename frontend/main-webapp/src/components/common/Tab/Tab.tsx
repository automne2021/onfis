interface TabProps {
  label: string
  icon?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

export function Tab({ label, icon, isActive, onClick } : TabProps) {
  return(
    <button 
      type='button'
      onClick={onClick}
      className={`flex gap-2 px-4 py-2 transition-all duration-200 body-3-medium border-b-2 items-center justify-center
        ${isActive 
          ? 'border-primary text-primary'
          : 'border-transparent text-neutral-500 hover:bg-neutral-200 hover:border-primary'
        }
      `}
    >
      {icon && icon}
      {label}
    </button>
  )
}