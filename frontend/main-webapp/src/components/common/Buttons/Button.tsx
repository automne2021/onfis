import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  id?: string;
  title?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  style: 'primary' | 'sub' | 'custom' | 'danger'; 
  textStyle?: string;
  bgColor?: string;
  bgHoverColor?: string;
  textColor?: string;
  border?: boolean;
  borderColor?: string;
  loading?: boolean;
  size?: "default" | "square";
  width?: string;
  customStyle?: string;
}

export function Button({ 
  id, 
  title, 
  iconLeft, 
  iconRight, 
  style, 
  textStyle = 'body-4-medium', 
  type = 'button', 
  bgColor, 
  bgHoverColor, 
  textColor, 
  border = true, 
  borderColor, 
  loading = false, 
  size = 'default', 
  width, 
  customStyle,
  children, 
  className,
  disabled,
  ...rest 
}: ButtonProps) {
  
  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading} 
      {...rest} 
      className={`rounded-lg flex items-center justify-center gap-2 transition ${textStyle}
        ${border ? 'border' : ''}
        ${size === 'default' ? 'px-2.5 py-1.5' : ''}
        ${size === 'square' ? 'p-2' : ''}
        ${style === 'primary' ? 'border-primary bg-secondary text-primary hover:bg-secondary-hover' : ''} 
        ${style === 'sub' ? 'border-neutral-400 bg-neutral-50 text-neutral-500 hover:bg-neutral-200' : ''}
        ${style === 'danger' ? 'border-red-500 bg-red-100 text-red-500 hover:bg-red-200' : ''}
        ${style === 'custom' ? `${borderColor || ''} ${bgColor || ''} ${textColor || ''} ${bgHoverColor ? `hover:${bgHoverColor}` : ''}` : ''}
        ${(disabled || loading) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        ${width || ''}
        ${customStyle || ''}
        ${className || ''} 
      `}
    >
      {iconLeft && iconLeft}
      
      {loading ? (
        <span className="animate-dots">{children || title}</span>
      ) : (
        children || title
      )}
      
      {iconRight && iconRight}
    </button>
  )
}