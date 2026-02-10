interface ButtonProps {
  title: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  onClick?: () => void
  style: 'primary' | 'sub'
  textStyle?: string
  type?: "button" | "submit" | "reset" | undefined
  loading?: boolean
}

export function Button({ title, iconLeft, iconRight, onClick, style, textStyle='body-3-medium', type='button', loading=false } : ButtonProps) {
  return(
    <button 
      type={type}
      onClick={onClick}
      className={`px-4 py-2 border rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${textStyle}
        ${style === 'primary' && 'border-primary bg-secondary text-primary hover:bg-secondary-hover'} 
        ${style === 'sub' && 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-200'}
        ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
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