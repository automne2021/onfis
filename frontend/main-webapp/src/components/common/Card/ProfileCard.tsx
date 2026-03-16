import { 
  EmailOutlined, 
  LocalPhoneOutlined, 
  BusinessOutlined, 
  LocationOnOutlined,
  CloseOutlined
} from '@mui/icons-material';
import { Link, useParams } from "react-router-dom"; 
// Thêm các hook cần thiết từ React
import { useRef, useLayoutEffect, useState } from "react"; 

import userProfileImg from "../../../assets/images/user-profile-img.png";
import type { UserProfile } from '../../../types/userType';

interface ProfileCardProps {
  user: UserProfile;
  onClose: () => void;
}

export function ProfileCard({ user, onClose }: ProfileCardProps) {
  const avatarImg = user.avatarUrl || userProfileImg;
  const { tenant } = useParams<{ tenant: string }>();
  const profilePath = tenant ? `/${tenant}/profile/${user.id}` : `/profile/${user.id}`;
  
  // 1. Khởi tạo các State và Ref để tự động tính toán vị trí
  const cardRef = useRef<HTMLDivElement>(null);
  const [positionClass, setPositionClass] = useState("top-12"); // Mặc định rớt xuống dưới
  const [isVisible, setIsVisible] = useState(false); // Ẩn lúc mới render để đo đạc tránh giật khung hình

  useLayoutEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      
      // Chờ trình duyệt rảnh tay một chút rồi mới update state
      requestAnimationFrame(() => {
        if (rect.bottom > window.innerHeight - 20) {
          setPositionClass("bottom-12 mb-2"); 
        } else {
          setPositionClass("top-12 mt-2"); 
        }
        setIsVisible(true);
      });
    }
  }, []);

  return (
    <>
      {/* Lớp phủ (Overlay) */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      ></div>

      {/* Nội dung chính của Profile Card */}
      <div 
        ref={cardRef}
        // 2. Nhúng positionClass và visibility vào Tailwind
        className={`absolute z-50 left-0 w-72 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden transition-all duration-200 ${positionClass} ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/20 hover:bg-black/40 text-white rounded-full transition"
        >
          <CloseOutlined sx={{ fontSize: 16 }} />
        </button>

        {/* Ảnh bìa (Cover) */}
        <div className="h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500"></div>
        
        {/* Avatar đè lên viền */}
        <div className="relative -mt-8 flex justify-center">
          <Link to={profilePath} onClick={onClose}>
            <img 
              src={avatarImg} 
              alt={user.name} 
              className="w-16 h-16 rounded-full border-4 border-white object-cover bg-white hover:opacity-90 transition shadow-sm"
            />
          </Link>
        </div>

        {/* Thông tin chính */}
        <div className="px-5 pb-5 pt-2 text-center flex flex-col items-center">
          
          <Link 
            to={profilePath} 
            onClick={onClose}
            className="body-1-medium text-neutral-900 hover:text-blue-600 hover:underline transition"
          >
            {user.name}
          </Link>
          <p className="body-3-regular text-blue-600">{user.position}</p>

          {/* Đường kẻ ngang */}
          <hr className="my-3 border-neutral-100 w-full" />

          {/* Thông tin chi tiết */}
          <div className="flex flex-col gap-3 w-full text-left text-neutral-600 body-3-regular">
            <div className="flex items-center gap-3">
              <BusinessOutlined sx={{ fontSize: 18 }} className="text-neutral-400" />
              <span>{user.department}</span>
            </div>
            <div className="flex items-center gap-3">
              <EmailOutlined sx={{ fontSize: 18 }} className="text-neutral-400" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3">
                <LocalPhoneOutlined sx={{ fontSize: 18 }} className="text-neutral-400" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-3">
                <LocationOnOutlined sx={{ fontSize: 18 }} className="text-neutral-400" />
                <span>{user.location}</span>
              </div>
            )}
          </div>

          <Link 
            to={profilePath}
            onClick={onClose}
            className="mt-5 w-full block text-center py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 body-3-medium rounded-lg transition border border-neutral-200"
          >
            View full profile
          </Link>

        </div>
      </div>
    </>
  );
}