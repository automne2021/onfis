import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { MOCK_ANNOUNCEMENTS } from "../../../data/mockAnnouncement"
import { BreadCrumb } from "../components/navigation/BreadCrumb"
import { getTimeAgo } from "../../../utils/getTime"
import { Tags } from "../components/Tags/Tags"

import { Public, PushPinOutlined, AttachFileOutlined, FileDownloadOutlined, ModeCommentOutlined, CommentOutlined, ThumbUp, ThumbUpOutlined } from '@mui/icons-material';

import userProfileImg from "../../../assets/images/user-profile-img.png"
import Dropdown from "../../../components/common/Dropdown/Dropdown"
import { ContentList } from "../../../components/common/Dropdown/ContentList"
import { getFileType } from "../../../config/fileConfig"
import { AttachmentTags } from "../components/Tags/AttachmentTag"
import { CommentItem } from "../components/Comment/CommentItem"
import { CommentInput } from "../components/Comment/CommentInput"
import { Loading } from "../components/Loading"
import { findUserById } from "../../../data/mockUserData"
import { ProfileCard } from "../../../components/common/Card/ProfileCard"
import type { AnnouncementData } from "../types/AnnouncementTypes"
import type { UserProfile } from "../../../types/userType"

export function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>()

  const [detail, setDetail] = useState<AnnouncementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState(false)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  // Lưu lại ID và Tên người được reply. Nếu null nghĩa là đang viết comment bình thường.
  const [replyingTo, setReplyingTo] = useState<{ id: string | number, name: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true)

      setTimeout(() => {
        if (id) {
          const foundItem = MOCK_ANNOUNCEMENTS.find(
            (item) => item.id === Number(id)
          )

          setDetail(foundItem || null)

          if (foundItem) {
            setIsLiked(foundItem.initialIsLike || false)

            const calculatedLikes = Array.isArray(foundItem.likes) && foundItem.likes.length > 0 ? foundItem.likes.length : 0

            let calculatedComments = 0
            if (foundItem.comments && Array.isArray(foundItem.comments)) {
              calculatedComments = foundItem.comments.reduce((total, comment) => {
                const repliesCount = comment.replies ? comment.replies.length : 0
                return total + 1 + repliesCount
              }, 0)
            }

            setLikeCount(calculatedLikes)
            setCommentCount(calculatedComments)
          }
        }
        setIsLoading(false)
      }, 500)
    }

    fetchDetail()
  }, [id])

  // Functions
  const togglePersonalInformationCard = () => {
    setIsProfileOpen(prev => !prev);
  }
  const toggleMenu = () => setActiveMenu(prev => !prev);
  const closeMenu = () => setActiveMenu(false);

  const handleLike = () => {
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : Math.max(0, prev - 1));
  }

  const handleClickReply = (commentId: string | number, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
  };

  if (isLoading) {
    return <Loading />
  }

  if (!detail) {
    return <div className="p-4 text-center text-neutral-500">No announcement available!</div>;
  }

  const avatarImg = detail.avatarUrl ? detail.avatarUrl : userProfileImg
  const remainingCount = detail.departments ? detail.departments.length - 2 : 0
  const timeAgoString = detail.date ? getTimeAgo(detail.date) : ""
  const authorProfile = findUserById(detail.authId)
  const profileCardData: UserProfile = authorProfile || {
    id: "unknown",
    name: "N/A",
    position: "N/A",
    department: "Company",
    email: "unknown@company.com",
    avatarUrl: userProfileImg
  };

  return (
    <>
      <section className="onfis-section">
        {/* Toolbar (matching ProjectToolbar pattern) */}
        <nav className="bg-white grid grid-cols-[1fr] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-300">
          <BreadCrumb title={detail.title} />
        </nav>

        {/* Body */}
        <div className="w-full pt-4 md:px-5 xl:px-8 2xl:px-16 flex flex-col justify-center bg-white border-b-2 border-neutral-200 mt-2 rounded-xl shadow-sm border border-neutral-300">
          {/* Header */}
          <p className="header-h2 text-neutral-900">{detail.title}</p>
          <div className="flex items-center justify-between py-6 border-b border-neutral-200">

            {/* Avt + Name + Position */}
            <div className="flex items-center gap-3">
              {/* User avatar */}
              <div className="relative">
                <div
                  onClick={() => togglePersonalInformationCard()}
                  className="w-12 h-12 rounded-full overflow-hidden border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={avatarImg}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* RENDER PROFILE CARD KHI ĐƯỢC CLICK */}
                {isProfileOpen && (
                  <ProfileCard
                    user={profileCardData}
                    onClose={() => setIsProfileOpen(false)}
                  />
                )}
              </div>
              {/* Text */}
              <div className="flex flex-col">
                <p className="body-2-medium text-neutral-900">{detail.authName}</p>
                <p className="body-2-medium text-neutral-500">
                  {detail.position}<span className="mx-1">•</span>{timeAgoString}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              {detail.isPinned && (
                <Tags
                  label="Pinned"
                  icon={<PushPinOutlined fontSize="small" />}
                />
              )}
              {detail.scope === 'company' && (
                <Tags
                  label="Global"
                  icon={<Public fontSize="small" />}
                />
              )}
              {detail.scope === 'department' && detail.departments && detail.departments.length > 0 && (
                <>
                  {detail.departments.slice(0, 2).map((dept, index) => (
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
                          data={detail.departments.slice(2).map((dept: string) => ({
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

          {/* Content */}
          <div className="py-10">
            <p className="body-2-regular text-neutral-900">{detail.content}</p>
          </div>

          {/* Attachments */}
          <div className="pb-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-neutral-900 body-1-medium">
                <span className="text-neutral-500"><AttachFileOutlined /></span>
                Attachments
                <span className="body-1-regular text-neutral-500">({detail.attachments && detail.attachments.length})</span>
              </p>
              {detail.attachments && detail.attachments.length > 0 && (
                <button
                  type="button"
                  className="text-primary hover:underline flex items-center gap-2 transition"
                >
                  <FileDownloadOutlined />
                  Download All
                </button>
              )}
            </div>
            {/* Body */}
            {detail.attachments && detail.attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 my-5 pl-3">
                {detail.attachments.map((file, index) => {
                  const type = getFileType(file.fileName)
                  return (
                    <a
                      key={`${file.id}-${index}`}
                      href={file.url}
                      download={file.fileName}
                      className={``}
                    >
                      <AttachmentTags type={type} fileName={file.fileName} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Like & Comments */}
          <div className="flex items-center py-4 justify-start gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLike}
                className={`py-2 transition hover:text-primary 
                  ${isLiked ? "text-primary" : "text-neutral-500"}  
                  flex items-center gap-2 body-3-regular
                `}
              >
                {isLiked ? <ThumbUp sx={{ fontSize: 18 }} /> : <ThumbUpOutlined sx={{ fontSize: 18 }} />}
                {likeCount === 0 && "Like"}
              </button>
              {likeCount > 0 && (
                <button
                  type="button"
                  className={`p-2 rounded-full transition hover:bg-neutral-200 
                  ${isLiked ? "text-primary" : "text-neutral-500"}  
                  flex items-center gap-2 body-3-regular
                `}
                >
                  {likeCount}
                </button>
              )}
            </div>

            <a
              href="#comment-section"
              className="p-2 rounded-full text-neutral-500 transition hover:bg-neutral-200 flex items-center gap-2 body-3-regular"
            >
              <CommentOutlined sx={{ fontSize: 20 }} />
              <span>
                {commentCount === 0 ? "Comment" : commentCount}
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Comment section */}
      <section
        id={`comment-section`}
        className="onfis-section">
        {/* Comment */}
        <div className="py-6 px-8">
          <p className="flex items-center gap-2 header-h5 text-neutral-900">
            <span className="text-neutral-500"><ModeCommentOutlined fontSize="large" /></span>
            Comments
          </p>
          <div className="flex flex-col gap-4 overflow-y-auto">
            {detail.comments && detail.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                id={comment.id}
                avatarUrl={comment.avatarUrl}
                userId={comment.userId}
                name={comment.name}
                date={comment.date}
                content={comment.content}
                likes={comment.likes}
                replies={comment.replies}
                onReply={handleClickReply}
                activeReplyId={replyingTo?.id}
                onCancelReply={() => setReplyingTo(null)}
                onSubmitReply={(commentId, content) => {
                  console.log(`Đang gửi Reply cho Comment ID: ${commentId}:`, content);
                  // Gọi API thêm reply ở đây...
                  setReplyingTo(null); // Đóng form input lại sau khi gửi thành công
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 sticky bottom-0 bg-neutral-50 pb-12 px-6">
          <CommentInput
            onSubmit={(content) => {
              console.log("Đang gửi Comment mới tinh:", content);
              // Gọi API gửi bình luận chính...
            }}
          />
        </div>
      </section>
    </>
  )
}