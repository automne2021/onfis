
interface TagsProps {
  label: string
  icon?: React.ReactNode
  bgColor?: string
  textColor?: string
  canClick?: boolean
  hoverBgColor?: string
  hoverTextColor?: string
}

export function Tags({ label, icon, bgColor='bg-primary', textColor='text-white', canClick=false, hoverBgColor, hoverTextColor } : TagsProps) {
  return(
    <div className={`py-2 px-3 ${bgColor} ${textColor} flex items-center gap-1 rounded-full body-4-regular
      ${canClick ? `hover:${hoverBgColor} hover:${hoverTextColor} scale-105 cursor-pointer transition` : '' }
    `}>
      {icon && icon}
      <p>{label}</p>
    </div>
  )
}