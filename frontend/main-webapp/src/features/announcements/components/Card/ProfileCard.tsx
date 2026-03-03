import { 
  EmailOutlined, 
  LocalPhoneOutlined, 
  BusinessOutlined, 
  LocationOnOutlined,
  CloseOutlined
} from '@mui/icons-material';
import { Link } from "react-router-dom"; 
import userProfileImg from "../../../../assets/images/user-profile-img.png";

export interface UserProfile {
  id: string | number
  name: string
  position: string
  department: string
  email: string
  phone?: string
  location?: string
  avatarUrl?: string
}

interface ProfileCardProps {
  user: UserProfile;
  onClose: () => void;
}

export function ProfileCard({ user, onClose }: ProfileCardProps) {
  const avatarImg = user.avatarUrl || userProfileImg;

  return (
    <>
      {/* Lớp phủ (Overlay) */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      ></div>

      {/* Nội dung chính của Profile Card */}
      <div className="absolute z-50 top-12 left-0 w-72 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in-up">
        
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/20 hover:bg-black/40 text-white rounded-full transition"
        >
          <CloseOutlined sx={{ fontSize: 16 }} />
        </button>

        {/* Ảnh bìa (Cover) */}
        <div className="h-16 bg-gradient-to-r from-primary via-blue-500 to-cyan-500"></div>
        
        {/* Avatar đè lên viền */}
        <div className="relative -mt-8 flex justify-center">
          <Link to={`/profile/${user.id}`} onClick={onClose}> {/* Cho phép click avatar */}
            <img 
              src={avatarImg} 
              alt={user.name} 
              className="w-16 h-16 rounded-full border-4 border-white object-cover bg-white hover:opacity-90 transition"
            />
          </Link>
        </div>

        {/* Thông tin chính */}
        <div className="px-5 pb-5 pt-2 text-center flex flex-col items-center">
          
          {/* 2. SỬA TÊN THÀNH LINK (Cho phép hover có gạch chân) */}
          <Link 
            to={`/profile/${user.id}`} 
            onClick={onClose}
            className="body-1-medium text-neutral-900 hover:text-primary hover:underline transition"
          >
            {user.name}
          </Link>
          <p className="body-3-regular text-primary">{user.position}</p>

          {/* Đường kẻ ngang */}
          <hr className="my-3 border-neutral-200 w-full" />

          {/* Thông tin chi tiết */}
          <div className="flex flex-col gap-2.5 w-full text-left text-neutral-600 body-3-regular">
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
            to={`/profile/${user.id}`}
            onClick={onClose}
            className="mt-4 w-full block text-center py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 body-3-medium rounded-lg transition"
          >
            View full profile
          </Link>

        </div>
      </div>
    </>
  );
}