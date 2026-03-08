interface StatusBubbleProps {
  status?: "online" | "busy" | "offline"
  size?: "small" | "medium" | "large"
}

export function StatusBubble({ status="offline", size="medium" } : StatusBubbleProps) {
  return(
    <>
      <span 
        className={`absolute -bottom-1 -right-1 border-2 border-white rounded-full
          ${size === "large" && 'w-4.5 h-4.5'}
          ${size === "medium" && 'w-3.5 h-3.5'}
          ${size === "small" && 'w-3 h-3'}
          ${status === "online" && 'bg-green-500'}
          ${status === "busy" && 'bg-red-500'}
          ${status === "offline" && 'bg-neutral-500 flex items-center justify-center'}            
        `}>
          {status === "offline" && (
            <span className={`rounded-full bg-white
              ${size === "large" && 'w-2.5 h-2.5 '}
              ${size === "medium" && 'w-1.5 h-1.5 '}
              ${size === "small" && 'w-1 h-1 '}
            `} />
          )}
      </span>
    </>
  )
}