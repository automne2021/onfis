import { useState } from "react";
import { 
  CopyAllOutlined,
  CheckCircleOutline
} from '@mui/icons-material';

interface CopyAreaProps {
  icon?: React.ReactNode
  index: number
  content: string
}

export function CopyArea({icon, index, content} : CopyAreaProps) {
  // useState
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Functions
  const handleCopy = async (text: string, index: number) => {
    if (!text || text === "N/A") return; 
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch(err) {
      console.error("Error when copying: ", err);
    }
  }

  return(
    <div className="flex items-center gap-1 text-neutral-500">
      {icon}
      <div
        onClick={() => handleCopy(content || "N/A", index)}
        className="group flex items-center body-2-medium text-neutral-900 px-2 py-1 hover:bg-neutral-50 cursor-pointer rounded-md"
      > 
        {content || "N/A"}

        {/* Copy icon */}
        <div className="relative w-5 h-5 ml-1 flex items-center justify-center">
              
          {/* ICON TICK XANH: Chỉ hiện khi đang copy */}
          <span className={`absolute transition-opacity duration-200 text-green-600
            ${copiedIndex === index ? 'opacity-100' : 'opacity-0'}
          `}>
            <CheckCircleOutline fontSize="small" />
          </span>
    
          {/* ICON COPY: Bình thường tàng hình, hover thì hiện, khi copy thì biến mất */}
          <span className={`absolute transition-opacity duration-200 text-neutral-400
            ${copiedIndex === index ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
          `}>
            <CopyAllOutlined fontSize="small" />
          </span>
        </div>
      </div>
    </div>
  )
}