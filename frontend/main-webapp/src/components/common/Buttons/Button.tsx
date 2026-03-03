interface ButtonProps {
  id?: string
  title?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  onClick?: () => void
  style: 'primary' | 'sub' | 'custom'
  textStyle?: string
  bgColor?: string
  bgHoverColor?: string
  textColor?: string
  border?: boolean
  borderColor?: string
  type?: "button" | "submit" | "reset" | undefined
  loading?: boolean
  size?: "default" | "square"
  width?: string
  customStyle?: string
}

export function Button({ id, title, iconLeft, iconRight, onClick, style, textStyle='body-3-medium', type='button', bgColor, bgHoverColor, textColor, border=true, borderColor, loading=false, size='default', width, customStyle } : ButtonProps) {
  return(
    <button 
      key={id}
      type={type}
      onClick={onClick}
      className={`rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${textStyle}
      ${border ? 'border' : ''}
        ${size === 'default' && 'px-4 py-2'}
        ${size === 'square' && 'p-2'}
        ${style === 'primary' && 'border-primary bg-secondary text-primary hover:bg-secondary-hover'} 
        ${style === 'sub' && 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-200'}
        ${style === 'custom' && `${borderColor} ${bgColor} ${textColor} hover:${bgHoverColor}`}
        ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        ${width}
        ${customStyle}
      `}
    >
      {iconLeft && iconLeft}
      {loading ? (
        <span className="animate-dots">{title}</span>
      ) : title}
      {iconRight && iconRight}
    </button>
  )
}