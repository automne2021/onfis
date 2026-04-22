import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StatusBubble } from '../../../../components/common/StatusBubble';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface ChatItemProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode; 
  avatarUrl?: string;
  status?: "online" | "busy" | "offline"; 
  onRename?: () => void;
  onDelete?: () => void;
}

export function ChatItem({ name, isActive, onClick, icon, avatarUrl, status, onRename, onDelete }: ChatItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | Event) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        portalRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setShowMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
    };
  }, []);

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({ x: rect.right - 128, y: rect.bottom + 4 }); 
    }
    setShowMenu(!showMenu);
  };

  return (
    <div 
      onClick={onClick}
      className={`
        group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors body-3-regular relative animate-in fade-in slide-in-from-left-2 duration-300
        ${isActive ? 'bg-secondary text-primary' : 'text-neutral-500 hover:bg-neutral-50'}
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        {avatarUrl ? (
          <div className="relative w-6 h-6 rounded-full flex-shrink-0">
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
            {status && <StatusBubble status={status} size='small'/>}
          </div>
        ) : (
          <div className={`flex items-center justify-center flex-shrink-0 ${isActive ? 'text-primary' : 'text-neutral-500'}`}>
            {icon}
          </div>
        )}
        
        <div className="flex items-center gap-1.5 truncate">
          <span className={`truncate select-none ${isActive ? 'font-medium' : ''}`}>{name}</span>
        </div>
      </div>

      {(onRename || onDelete) && (
        <div className="flex-shrink-0">
          <button 
            ref={buttonRef}
            onClick={handleOpenMenu}
            className={`p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && createPortal(
            <div 
              ref={portalRef} 
              style={{ top: menuCoords.y, left: menuCoords.x }}
              className="fixed w-32 bg-white border border-neutral-200 shadow-lg rounded-lg py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()} 
            >
              {onRename && (
                <button onClick={() => { setShowMenu(false); onRename(); }} className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
                  <Edit2 size={14} /> Rename
                </button>
              )}
              {onDelete && (
                <button onClick={() => { setShowMenu(false); onDelete(); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}