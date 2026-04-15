import { useState } from "react";
import { ThumbUp, ThumbUpOutlined, ReplyOutlined } from '@mui/icons-material';
import { getTimeAgo } from "../../../../utils/getTime";
import userProfileImg from "../../../../assets/images/user-profile-img.png";
import { CommentInput } from "./CommentInput"; 
import { findUserById } from "../../../../data/mockUserData";
import { ProfileCard } from "../../../../components/common/Card/ProfileCard";
import type { UserProfile } from "../../../../types/userType";
import { announcementApi } from "../../services/announcementApi";

export interface CommentItemProps {
  id: string | number;
  avatarUrl?: string;
  userId: string | number
  name: string;
  date: string;
  content: string;
  replyingToName?: string;
  likes?: number[];
  replies?: CommentItemProps[]; 
  isReply?: boolean; 
  onReply?: (commentId: string | number, authorName: string) => void;
  activeReplyId?: string | number | null; 
  onCancelReply?: () => void; 
  onSubmitReply?: (commentId: string | number, content: string) => void; 
}

const REPLIES_PER_PAGE = 5; 

export function CommentItem({ 
  id,
  avatarUrl, 
  userId,
  name, 
  date, 
  content, 
  replyingToName,
  likes, 
  replies, 
  isReply = false, 
  onReply,
  activeReplyId,   
  onCancelReply,
  onSubmitReply
}: CommentItemProps) {

  const safeLikes = likes || [];
  const safeReplies = replies || [];
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(safeLikes.length);

  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(REPLIES_PER_PAGE);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const togglePersonalInformationCard = () => {
    setIsProfileOpen(prev => !prev);
  }

  const handleLike = async () => {
    try {
      const isNowLiked = await announcementApi.toggleCommentLike(id);
      
      setIsLiked(isNowLiked);
      setLikeCount(prev => isNowLiked ? prev + 1 : Math.max(0, prev - 1));
    } catch (error) {
      console.error("Toggle like comment error:", error);
    }
  }

  const handleViewReplies = () => {
    setIsRepliesExpanded(true);
  };

  const handleViewMoreReplies = () => {
    setVisibleRepliesCount(prev => prev + REPLIES_PER_PAGE);
  };

  const safeUtcDate = date ? (date.endsWith('Z') ? date : `${date}Z`) : "";
  const timeAgoString = safeUtcDate ? getTimeAgo(safeUtcDate) : "";
  const avatarImg = avatarUrl ? avatarUrl : userProfileImg;

  const commentAuthorProfile = findUserById(userId);
  const profileCardData: UserProfile = commentAuthorProfile || {
    id: "unknown",
    name: "N/A",
    position: "N/A",
    department: "Company",
    email: "unknown@company.com",
    avatarUrl: userProfileImg
  };

  return(
    <div className={`flex flex-col gap-2 ${isReply ? 'ml-12 mt-2' : 'mt-3'}`}>
      
      <div className="flex items-start gap-3">
        <div className="relative">
          <div 
            onClick={togglePersonalInformationCard}
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shrink-0 mt-1"
          >
            <img src={avatarImg} alt="User Avatar" className="w-full h-full object-cover"/>
          </div>

          {isProfileOpen && (
            <ProfileCard 
              user={profileCardData} 
              onClose={() => setIsProfileOpen(false)} 
            />
          )}
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="w-full bg-white rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <p className="body-3-medium text-neutral-900">{name}</p>
              </div>
              <p className="body-4-regular text-neutral-500">{timeAgoString}</p>
            </div>
            <p className="body-3-regular text-neutral-700 whitespace-pre-line">
              {replyingToName && (
                <span className="text-primary font-medium mr-1.5 cursor-pointer hover:underline">
                  @{replyingToName}
                </span>
              )}
              {content}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-1 ml-2">
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 body-4-medium transition py-1
                  ${isLiked ? "text-primary" : "text-neutral-500 hover:text-primary"}`}
              >
                {isLiked ? <ThumbUp sx={{ fontSize: 16 }} /> : <ThumbUpOutlined sx={{ fontSize: 16 }} />}
                {likeCount === 0 && "Like"}
              </button>
              {likeCount > 0 && (
                <button type="button" className={`flex items-center gap-1.5 body-4-medium transition py-1 px-1.5 rounded-full hover:bg-neutral-200 ${isLiked ? "text-primary" : "text-neutral-500 hover:text-primary"}`}>
                  {likeCount}
                </button>
              )}
            </div>
            
            {/* Nút Reply */}
            <button 
              type="button"
              onClick={() => {
                onReply?.(id, name);
                setIsRepliesExpanded(true);
              }}
              className="flex items-center gap-1.5 body-4-medium text-neutral-500 hover:text-primary transition"
            >
              <ReplyOutlined sx={{ fontSize: 16 }} />
              Reply
            </button>
          </div>
        </div>
      </div>

      {activeReplyId === id && (
        <div className="ml-12 mt-1 mb-2 pr-4">
          <CommentInput 
            replyingToName={name}
            onCancelReply={onCancelReply}
            onSubmit={(newContent) => onSubmitReply?.(id, newContent)}
          />
        </div>
      )}

      {safeReplies && safeReplies.length > 0 && (
        <div className="flex flex-col">
          {!isRepliesExpanded ? (
            <button onClick={handleViewReplies} className="ml-12 mt-2 flex items-center gap-2 text-neutral-500 body-4-medium hover:underline w-fit">
              <ReplyOutlined sx={{ fontSize: 16, transform: "scaleX(-1)" }} /> 
              View {safeReplies.length} replies
            </button>
          ) : (
            <>
              {safeReplies.slice(0, visibleRepliesCount).map((reply: CommentItemProps, index: number) => (
                <CommentItem 
                  key={index}
                  id={reply.id}
                  avatarUrl={reply.avatarUrl}
                  userId={reply.userId}
                  name={reply.name}
                  date={reply.date}
                  content={reply.content}
                  replyingToName={reply.replyingToName}
                  likes={reply.likes}
                  isReply={true} 
                  replies={reply.replies}
                  onReply={onReply}
                  activeReplyId={activeReplyId}
                  onCancelReply={onCancelReply}
                  onSubmitReply={onSubmitReply}
                />
              ))}

              {visibleRepliesCount < safeReplies.length && (
                <button onClick={handleViewMoreReplies} className="ml-12 mt-4 flex items-center gap-2 text-neutral-500 body-4-medium hover:underline w-fit">
                  <ReplyOutlined sx={{ fontSize: 16, transform: "scaleX(-1)" }} /> 
                  View {safeReplies.length - visibleRepliesCount} more replies
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}