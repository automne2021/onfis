import userProfileImg from "../../../../assets/images/user-profile-img.png"

import { Public, PushPinOutlined, ArrowForwardOutlined,ThumbUpOutlined, ThumbUp, CommentOutlined } from '@mui/icons-material';

import { Tags } from "../Tags/Tags";
import Dropdown from "../../../../components/common/Dropdown/Dropdown";
import { useState } from "react";
import { ContentList } from "../../../../components/common/Dropdown/ContentList";
import { getFileType } from "../../../../config/fileConfig";
import { SmallTags } from "../Tags/SmallTags";
import { Link } from "react-router-dom";
import { generateSlug } from "../../../../utils/generateSlug";
import { getTimeAgo } from "../../../../utils/getTime";
import { ProfileCard } from "../../../../components/common/Card/ProfileCard";
import { findUserById } from "../../../../data/mockUserData";
import type { UserProfile } from "../../../../types/userType";

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
  departments?: string[]
  title: string
  content: string
  attachments: AttachmentITem[]
  initialIsLike?: boolean
  numberOfLike?: number
  numberOfComments?: number
  onToggleLike?: (announcementId: string | number, newStatus: boolean) => void
  onToggleComment?: (announcementId: string | number) => void
}

export function AnnouncementCard({ id, authId, authName, position, date, avatarUrl, isPinned, scope, departments, title, content, attachments = [], initialIsLike = false, numberOfLike = 0, numberOfComments = 0, onToggleLike, onToggleComment } : AnnouncementCardProps) {

  const [activeMenu, setActiveMenu] = useState(false)
  const [isLiked, setIsLiked] = useState(initialIsLike)
  const [likeCount, setLikeCount] = useState(numberOfLike)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const avatarImg = avatarUrl? avatarUrl : userProfileImg
  const remainingCount = departments ? departments.length - 2 : 0
  const slug = generateSlug(title)
  const timeAgoString = date ? getTimeAgo(date) : "";

  const authorProfile = findUserById(authId)
    const profileCardData: UserProfile = authorProfile || {
      id: "unknown",
      name: "N/A",
      position: "N/A",
      department: "Company",
      email: "unknown@company.com",
      avatarUrl: userProfileImg
    };

  // Functions
  const togglePersonalInformationCard = () => {
    setIsProfileOpen(prev => !prev);
  }

  const toggleMenu = () => setActiveMenu(prev => !prev);
  const closeMenu = () => setActiveMenu(false);

  const handleLike = () => {
    const newStatus = !isLiked;

    setIsLiked(newStatus)
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1);

    if (onToggleLike) {
      onToggleLike(id, newStatus)
    }
  }

  return(
    <div 
      className="bg-white py-5 px-6 rounded-xl border border-neutral-200 hover:border-primary hover:bg-neutral-50 transition"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* User avatar */}
          <div className="relative">
            <div 
              onClick={() => togglePersonalInformationCard()}
              className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src={avatarImg}
                alt="User Avatar"
                className="w-full h-full object-cover"
                />
            </div>

            {isProfileOpen && (
              <ProfileCard 
                user={profileCardData} 
                onClose={() => setIsProfileOpen(false)} 
              />
            )}
          </div>
          {/* Text */}
          <div className="flex flex-col">
            <p className="body-3-medium text-neutral-900">{authName}</p>
            <p className="body-3-medium text-neutral-500">
              {position}<span className="mx-1">•</span>{timeAgoString}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          {isPinned && (
            <Tags 
              label="Pinned"
              icon={<PushPinOutlined fontSize="small"/>}
            />
          )}
          {scope === 'company' && (
            <Tags 
              label="Global"
              icon={<Public fontSize="small"/>}
            />
          )}
          {scope === 'department' && departments && departments.length > 0 && (
            <>
              {departments.slice(0, 2).map((dept, index) => (
                <Tags 
                  key={index}
                  label={dept}
                  bgColor="bg-cyan-100"
                  textColor="text-cyan-500"
                />
              ))}
              {remainingCount > 0 && (
                <Dropdown
                  isOpen={activeMenu}
                  trigger={
                    <div onClick={toggleMenu} >
                      <Tags
                        label={`+${remainingCount}`}
                        bgColor="bg-neutral-200"
                        textColor="text-neutral-500"
                        canClick={true}
                        hoverBgColor="bg-neutral-300"
                        hoverTextColor="text-neutral-600"
                      />
                    </div>
                  }
                  children={
                    <ContentList 
                      data={departments.slice(2).map((dept) => ({
                        content: dept
                      }))}
                      emptyLabel="No result found"
                      onItemClick={closeMenu}
                    />
                  }
                  onClose={closeMenu}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-0">
        {/* Title */}
        <p className="header-h6 leading-none my-4 text-neutral-900">{title}</p>

        {/* Content */}
        <p className="body-3-regular text-neutral-500 mb-3 line-clamp-2 overflow-hidden text-ellipsis">
          {content}
        </p>

        {/* Attachments (Optional) */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap mb-3 pl-1">
            {attachments.slice(0,3).map((file, index) => {
              const type = getFileType(file.fileName)
              const overlapClass = index > 0 ? "-ml-4" : ""
              return(
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
      <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
        <Link 
          to={`./${id}/${slug}`} 
          className="text-primary underline-animation body-3-medium"
        >
          Read more <ArrowForwardOutlined sx={{ fontSize: 14 }}/>
        </Link>

        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={handleLike}
            className={`p-2 rounded-full transition hover:bg-neutral-200 
              ${isLiked ? "text-primary" : "text-neutral-500"}  
              flex items-center gap-2 body-4-regular
            `}
          >
            {isLiked ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
            <span>
              {likeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>  onToggleComment && onToggleComment(id)}
            className="p-2 rounded-full text-neutral-500 transition hover:bg-neutral-200 flex items-center gap-2 body-4-regular"
          >
            <CommentOutlined fontSize="small"/>
            <span>
              {numberOfComments}
            </span>
          </button>
        </div>

      </div>

    </div>
  )
}