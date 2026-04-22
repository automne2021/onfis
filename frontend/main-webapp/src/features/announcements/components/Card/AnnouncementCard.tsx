import userProfileImg from "../../../../assets/images/user-profile-img.png"
import { Public, PushPinOutlined, ArrowForwardOutlined, ThumbUpOutlined, ThumbUp, CommentOutlined, Groups } from '@mui/icons-material';
import { Tags } from "../Tags/Tags";
import { useEffect, useState } from "react";
import { getFileType } from "../../../../config/fileConfig";
import { SmallTags } from "../Tags/SmallTags";
import { Link } from "react-router-dom";
import { generateSlug } from "../../../../utils/generateSlug";
import { getTimeAgo } from "../../../../utils/getTime";
import { ProfileCard } from "../../../../components/common/Card/ProfileCard";
import type { FullUserProfile } from "../../../../types/userType";
import { announcementApi } from "../../services/announcementApi";
import { userApi } from "../../../profile/services/userApi";

export interface AttachmentITem {
  id: string | number
  fileName: string
  url: string
  size?: number
}

interface AnnouncementCardProps {
  id: string | number
  authId: string | number
  authName: string
  position?: string
  date?: string
  avatarUrl?: string
  isPinned?: boolean
  scope: string
  targetDepartmentName?: string
  title: string
  content: string
  attachments: AttachmentITem[]
  initialIsLike?: boolean
  numberOfLike?: number
  numberOfComments?: number
  onToggleLike?: (announcementId: string | number, newStatus: boolean) => void
  onToggleComment?: (announcementId: string | number) => void
  isProfileOpen?: boolean; 
  onToggleProfile?: () => void;
}

export function AnnouncementCard({ id, authId, authName, position, date, avatarUrl, isPinned, scope, targetDepartmentName, title, content, attachments = [], initialIsLike = false, numberOfLike = 0, numberOfComments = 0, onToggleLike, onToggleComment, isProfileOpen = false, onToggleProfile }: AnnouncementCardProps) {

  const [isLiked, setIsLiked] = useState(initialIsLike)
  const [likeCount, setLikeCount] = useState(numberOfLike)
  const [authorProfile, setAuthorProfile] = useState<FullUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const avatarImg = avatarUrl ? avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(authName)}&background=random`
  const slug = generateSlug(title)
  const safeUtcDate = date ? (date.endsWith('Z') ? date : `${date}Z`) : "";
  const timeAgoString = safeUtcDate ? getTimeAgo(safeUtcDate) : "";

  useEffect(() => {
    if (isProfileOpen && !authorProfile) {
      const fetchAuthorProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const data = await userApi.getFullUserProfile(String(authId));
          setAuthorProfile(data);
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin user ${authId}:`, error);
        } finally {
          setIsLoadingProfile(false);
        }
      };

      fetchAuthorProfile();
    }
  }, [isProfileOpen, authId, authorProfile]);

  const profileCardData: FullUserProfile = authorProfile || {
    id: "unknown",
    firstName: "N/A",
    lastName: "N/A",
    positionName: "N/A",
    departmentName: "Company",
    email: isLoadingProfile ? "Loading details..." : "Unknown",
    avatarUrl: userProfileImg
  };

  console.log("author profile: ", authorProfile)

  const handleLike = async () => {
    try {
      const isNowLiked = await announcementApi.toggleAnnouncementLike(id);
      
      setIsLiked(isNowLiked);
      setLikeCount(prev => isNowLiked ? prev + 1 : Math.max(0, prev - 1));
      
      if (onToggleLike) {
        onToggleLike(id, isNowLiked);
      }
    } catch (error) {
      console.error("Lỗi khi toggle like ở Card:", error);
    }
  }

  const displayDeptName = targetDepartmentName || "My Department";

  return (
    <div
      className={`bg-white py-4 px-5 rounded-xl border border-neutral-200 shadow-sm card-hover transition relative 
        ${isProfileOpen ? "z-50" : "z-10"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* User avatar */}
          <div className="relative">
            <div
              onClick={onToggleProfile}
              className="relative z-10 w-10 h-10 rounded-full overflow-hidden border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={avatarImg}
                alt="User Avatar"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>

            {/* Profile Card Render */}
            {isProfileOpen && (
              <ProfileCard
                user={profileCardData}
                onClose={() => onToggleProfile?.()}
              />
            )}
          </div>
          {/* Text */}
          <div className="flex flex-col gap-0.5">
            <p className="body-3-medium text-neutral-900">{authName}</p>
            <p className="body-4-regular text-neutral-500">
              {position}<span className="mx-1">•</span>{timeAgoString}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          {isPinned && (
            <Tags
              label="Pinned"
              icon={<PushPinOutlined sx={{ fontSize: 16 }} />}
            />
          )}
          {scope === 'company' ? (
            <Tags label="Global" icon={<Public sx={{ fontSize: 16 }} />} />
          ) : (
            <Tags
              label={displayDeptName}
              icon={<Groups sx={{ fontSize: 16 }} />}
              bgColor="bg-cyan-100"
              textColor="text-cyan-500"
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-0">
        <p className="header-h6 leading-relaxed text-neutral-900 mt-3">{title}</p>
        
        <div 
          className="body-3-regular text-neutral-500 mb-3 line-clamp-2 overflow-hidden text-ellipsis"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Attachments (Optional) */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap mb-3 pl-1">
            {attachments.slice(0, 3).map((file, index) => {
              const type = getFileType(file.fileName)
              const overlapClass = index > 0 ? "-ml-4" : ""
              return (
                <a
                  key={`${file.id}-${index}`}
                  href={file.url}
                  download={file.fileName}
                  className={`relative ${overlapClass} group hover:z-20 hover:-translate-y-1 transition-all duration-200 ease-in-out focus:outline-none`}
                  style={{ zIndex: index }}
                >
                  <div className="rounded-lg border-2 border-white bg-white ">
                    <SmallTags type={type} />
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
        <Link
          to={`./${id}/${slug}`}
          className="text-primary underline-animation body-3-medium"
        >
          Read more <ArrowForwardOutlined sx={{ fontSize: 14 }} />
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className={`p-2 rounded-full transition hover:bg-neutral-200 element-hover
              ${isLiked ? "text-primary" : "text-neutral-500"}  
              flex items-center gap-2 body-4-regular
            `}
          >
            {isLiked ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
            <span>
              {likeCount === 0 ? "Like" : likeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleComment && onToggleComment(id)}
            className="p-2 rounded-full text-neutral-500 transition hover:bg-neutral-200 flex items-center gap-2 body-4-regular element-hover"
          >
            <CommentOutlined fontSize="small" />
            <span>
              {numberOfComments === 0 ? "Comment" : numberOfComments}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}