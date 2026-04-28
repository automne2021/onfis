import { useState, useRef, useEffect } from "react";
import { SendOutlined, CloseOutlined } from '@mui/icons-material';
import userProfileImg from "../../../../assets/images/user-profile-img.png";
import { useAuth } from "../../../../hooks/useAuth";

export interface CommentInputProps {
  currentUserAvatar?: string;
  replyingToName?: string | null; 
  onCancelReply?: () => void;     
  onSubmit: (content: string) => void; 
}

export function CommentInput({ 
  currentUserAvatar, 
  replyingToName, 
  onCancelReply, 
  onSubmit 
}: CommentInputProps) {
  
  const { dbUser: currentUser } = useAuth();
  
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    if (replyingToName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingToName]);

  const handleSubmit = () => {
    if (!content.trim()) return; 
    
    onSubmit(content);
    setContent(""); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const avatarImg = currentUserAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || '')}&background=random` || userProfileImg;

  return(
    <div className="flex items-start gap-3 w-full mt-4">
      {/* Avatar người dùng hiện tại */}
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
        <img 
          src={avatarImg} 
          alt="Current User" 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Khu vực nhập liệu */}
      <div className="flex flex-col flex-1 gap-1 w-full">
        
        {/* Hiển thị trạng thái đang Reply ai đó (Chỉ hiện khi có replyingToName) */}
        {replyingToName && (
          <div className="flex items-center gap-2 text-neutral-500 body-4-regular ml-2">
            <span>Replying to <span className="font-semibold text-neutral-700">@{replyingToName}</span></span>
            <button 
              onClick={onCancelReply} 
              className="hover:text-neutral-700 transition p-0.5 rounded-full hover:bg-neutral-200"
            >
              <CloseOutlined sx={{ fontSize: 14 }} />
            </button>
          </div>
        )}

        {/* Khung Input chính */}
        <div className="flex items-center justify-between border border-neutral-200 bg-white rounded-2xl px-4 py-2 focus-within:border-primary transition">
          <input 
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="w-full bg-transparent outline-none body-3-regular text-neutral-900 placeholder:text-neutral-400"
          />

          {/* Các nút hành động (Đính kèm & Gửi) */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button 
              onClick={handleSubmit}
              disabled={!content.trim()} // Vô hiệu hóa nút nếu chưa nhập gì
              className={`p-1.5 rounded-full transition flex items-center justify-center 
                ${content.trim() ? 'text-primary hover:bg-blue-50' : 'text-neutral-300 cursor-not-allowed'}`}
            >
              <SendOutlined sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}