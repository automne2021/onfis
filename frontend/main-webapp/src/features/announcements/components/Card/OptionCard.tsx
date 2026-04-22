import { LockOutline } from '@mui/icons-material';

interface OptionCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  permission?: boolean
}

export function OptionCard({ title, description, icon, isActive, onClick, permission } : OptionCardProps) {

  // Functions
  const handleClick = () => {
    if (permission && onClick) onClick()
  }

  return(
    <div 
      onClick={handleClick}
      className={`flex flex-col p-4 rounded-xl transition-all ease-in-out border-2 w-full md:w-[264px] lg:w-[336px] 
        ${isActive 
          ? "bg-white border-primary hover:scale-105 cursor-pointer "
          : permission
          ? "bg-white border-neutral-200 hover:border-neutral-500 hover:scale-105 cursor-pointer "
          : "bg-neutral-50 border-neutral-200"
        }
      `}
    >
      {/* icon */}
      <div className='flex items-center justify-between mb-2'>
        <div className={`p-[10px] rounded-lg flex items-center justify-center
          ${isActive
            ? "bg-secondary text-primary"
            : "bg-neutral-200 text-neutral-500" 
          }  
        `}>
          {icon}
        </div>
        {!permission && <LockOutline className='text-neutral-500'/>}
      </div>

      {/* Text */}
      <p className={`body-2-medium mb-1
        ${isActive ? "text-primary" : "text-neutral-900"}  
      `}>
        { title }
      </p>
      <p className={`body-4-regular text-neutral-500`}>
        {description}
      </p>

    </div>
  )
}