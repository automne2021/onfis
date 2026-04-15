import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { BreadCrumb } from "../components/navigation/BreadCrumb"
import { getTimeAgo } from "../../../utils/getTime"
import { Tags } from "../components/Tags/Tags"

import { Public, PushPinOutlined, AttachFileOutlined, FileDownloadOutlined, ModeCommentOutlined, CommentOutlined, ThumbUp, ThumbUpOutlined, Groups } from '@mui/icons-material';

import userProfileImg from "../../../assets/images/user-profile-img.png"
import { getFileType } from "../../../config/fileConfig"
import { AttachmentTags } from "../components/Tags/AttachmentTag"
import { CommentItem } from "../components/Comment/CommentItem"
import { CommentInput } from "../components/Comment/CommentInput"
import { AnnouncementDetailLoading } from "../components/Loadings/AnnouncementDetailLoading"
import { findUserById } from "../../../data/mockUserData"
import { ProfileCard } from "../../../components/common/Card/ProfileCard"
import type { AnnouncementData, CommentData } from "../types/AnnouncementTypes"
import type { UserProfile } from "../../../types/userType"
import { StatusBubble } from "../../../components/common/StatusBubble"

import { announcementApi } from "../services/announcementApi"
import { formatAnnouncementData } from "../utils/announcementFormatter"

const flattenAllReplies = (replies: CommentData[], parentName?: string): CommentData[] => {
  let flat: CommentData[] = [];
  replies.forEach(reply => {
    const { replies: nestedReplies, ...rest } = reply; 
    flat.push({ ...rest, replyingToName: parentName, replies: [] } as CommentData); 
    
    if (nestedReplies && nestedReplies.length > 0) {
      flat = flat.concat(flattenAllReplies(nestedReplies, reply.name));
    }
  });
  
  return flat.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
};

export function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>()

  const [detail, setDetail] = useState<AnnouncementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  
  const [replyingTo, setReplyingTo] = useState<{ id: string | number, name: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true)
      try {
        if (id) {
          const rawData = await announcementApi.getById(id);
          const formattedData = formatAnnouncementData([rawData])[0];

          if (formattedData && formattedData.comments) {
            formattedData.comments = formattedData.comments.map(rootComment => ({
              ...rootComment,
              replies: rootComment.replies ? flattenAllReplies(rootComment.replies) : []
            }));
          }

          setDetail(formattedData || null);

          if (formattedData) {
            setIsLiked(formattedData.initialIsLike || false);
            setLikeCount(formattedData.calculatedLikes || 0);
            setCommentCount(formattedData.calculatedComments || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcement detail:", error);
        setDetail(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail()
  }, [id])

  // Functions
  const togglePersonalInformationCard = () => {
    setIsProfileOpen(prev => !prev);
  }

  const handleLike = async () => {
    try {
      const isNowLiked = await announcementApi.toggleAnnouncementLike(id!);
      setIsLiked(isNowLiked);
      setLikeCount(prev => isNowLiked ? prev + 1 : Math.max(0, prev - 1));
    } catch (error) {
      console.error("Toggling like announcement error:", error);
    }
  }

  const handleClickReply = (commentId: string | number, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
  };

  if (isLoading) {
    return <AnnouncementDetailLoading />
  }

  if (!detail) {
    return <div className="p-4 text-center text-neutral-500">No announcement available!</div>;
  }

  const avatarImg = detail.avatarUrl ? detail.avatarUrl : userProfileImg;
  const safeUtcDate = detail.date ? (detail.date.endsWith('Z') ? detail.date : `${detail.date}Z`) : "";
  const timeAgoString = safeUtcDate ? getTimeAgo(safeUtcDate) : "";
  
  const authorProfile = findUserById(detail.authId)
  const profileCardData: UserProfile = authorProfile || {
    id: "unknown",
    name: "N/A",
    position: "N/A",
    department: "Company",
    email: "unknown@company.com",
    avatarUrl: userProfileImg
  };

  const displayDeptName = detail.targetDepartmentName || "My department";

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)]">
      <section className="onfis-section">
        {/* Toolbar */}
        <nav className="navbar-style">
          <BreadCrumb title={detail.title} />
        </nav>

        {/* Body */}
        <div className="w-full pt-6 md:px-5 xl:px-8 2xl:px-10 flex flex-col justify-center bg-white border-b-2 border-neutral-200 mt-2 rounded-xl shadow-sm">
          {/* Header */}
          <p className="header-h4 leading-snug text-neutral-900">{detail.title}</p>
          <div className="flex items-center justify-between pt-4 pb-3 border-b border-neutral-200">

            {/* Avt + Name + Position */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  onClick={() => togglePersonalInformationCard()}
                  className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={avatarImg} alt="User Avatar" className="w-full h-full object-cover" />
                  <StatusBubble />
                </div>

                {isProfileOpen && (
                  <ProfileCard user={profileCardData} onClose={() => setIsProfileOpen(false)} />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="body-3-medium text-neutral-900">{detail.authName}</p>
                <p className="body-4-regular text-neutral-500">
                  {detail.position}<span className="mx-1">•</span>{timeAgoString}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              {detail.isPinned && <Tags label="Pinned" icon={<PushPinOutlined sx={{ fontSize: 16 }} />} />}
              {(!detail.targetDepartmentId && detail.scope !== 'department') ? (
                <Tags label="Global" icon={<Public sx={{ fontSize: 16 }} />} />
              ) : (
                <Tags label={displayDeptName} icon={<Groups sx={{ fontSize: 16 }} />} bgColor="bg-cyan-100" textColor="text-cyan-500" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="py-6">
            <div className="body-3-regular text-neutral-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: detail.content }} />
          </div>

          {/* Attachments */}
          <div className="pb-2">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 text-neutral-900 body-2-medium">
                <span className="text-neutral-500"><AttachFileOutlined fontSize="small" /></span>
                Attachments
                <span className="body-2-regular text-neutral-500">({detail.attachments ? detail.attachments.length : 0})</span>
              </p>
              {detail.attachments && detail.attachments.length > 0 && (
                <button type="button" className="text-primary hover:underline flex items-center gap-1 transition body-4-regular">
                  <FileDownloadOutlined sx={{ fontSize: 16 }} /> Download All
                </button>
              )}
            </div>
            {detail.attachments && detail.attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 my-5 pl-3">
                {detail.attachments.map((file, index) => {
                  const type = getFileType(file.fileName)
                  return (
                    <a key={`${file.id}-${index}`} href={file.url} download={file.fileName}>
                      <AttachmentTags type={type} fileName={file.fileName} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Like & Comments */}
          <div className="flex items-center py-2.5 justify-start gap-4 border-t border-neutral-200">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLike}
                className={`py-2 transition hover:text-primary ${isLiked ? "text-primary" : "text-neutral-500"} flex items-center gap-2 body-3-regular`}
              >
                {isLiked ? <ThumbUp sx={{ fontSize: 16 }} /> : <ThumbUpOutlined sx={{ fontSize: 16 }} />}
                {likeCount === 0 && "Like"}
              </button>
              {likeCount > 0 && (
                <button type="button" className={`p-2 rounded-full transition hover:bg-neutral-200 ${isLiked ? "text-primary" : "text-neutral-500"} flex items-center gap-2 body-3-regular`}>
                  {likeCount}
                </button>
              )}
            </div>

            <a href="#comment-section" className="p-2 rounded-full text-neutral-500 transition hover:bg-neutral-200 flex items-center gap-2 body-3-regular">
              <CommentOutlined sx={{ fontSize: 18 }} />
              <span>{commentCount === 0 ? "Comment" : commentCount}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Comment section */}
      <section id={`comment-section`} className="onfis-section flex-1 flex flex-col bg-neutral-50">
        <div className="pt-3 px-6 pb-6">
          <p className="flex items-center gap-2 header-h6 text-neutral-900 border-b border-neutral-300 leading-none pb-4 mt-6">
            <span className="text-neutral-500"><ModeCommentOutlined fontSize="medium" /></span>
            Comments
          </p>
          <div className="flex flex-col gap-1 mt-4">
            {detail.comments && detail.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                id={comment.id}
                avatarUrl={comment.avatarUrl}
                userId={comment.userId}
                name={comment.name}
                date={comment.date}
                content={comment.content}
                replyingToName={comment.replyingToName}
                likes={comment.likes || []}
                replies={comment.replies || []}
                onReply={handleClickReply}
                activeReplyId={replyingTo?.id}
                onCancelReply={() => setReplyingTo(null)}
                
                onSubmitReply={async (targetId, content) => {
                  const fakeReplyId = `temp-${Date.now()}`;
                  const fakeReply: CommentData = {
                    id: fakeReplyId,
                    userId: "temp_user",
                    name: "(Đang gửi...)", 
                    avatarUrl: userProfileImg,
                    date: new Date().toISOString(),
                    content: content,
                    likes: [],
                    replies: [] 
                  };

                  setReplyingTo(null);

                  setDetail(prev => {
                    if (!prev) return prev;
                    const updatedComments = prev.comments?.map(root => {
                      if (root.id === targetId) {
                        return { ...root, replies: [...(root.replies || []), fakeReply] };
                      }
                      const isTargetInside = root.replies?.some(r => r.id === targetId);
                      if (isTargetInside) {
                        return { ...root, replies: [...(root.replies || []), fakeReply] };
                      }
                      return root;
                    });
                    return { ...prev, comments: updatedComments };
                  });
                  setCommentCount(prev => prev + 1);

                  try {
                    const realReply = await announcementApi.createComment(id!, content, targetId);
                    
                    setDetail(prev => {
                      if (!prev) return prev;
                      const updatedComments = prev.comments?.map(root => ({
                        ...root,
                        replies: root.replies?.map(r => r.id === fakeReplyId ? realReply : r)
                      }));
                      return { ...prev, comments: updatedComments };
                    });
                  } catch (error) {
                    console.error("Lỗi khi gửi reply:", error);
                    // Lỗi -> Trừ ngược comment đi
                    setDetail(prev => {
                      if (!prev) return prev;
                      const updatedComments = prev.comments?.map(root => ({
                        ...root,
                        replies: root.replies?.filter(r => r.id !== fakeReplyId)
                      }));
                      return { ...prev, comments: updatedComments };
                    });
                    setCommentCount(prev => prev - 1);
                  }
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-neutral-200 sticky bottom-0 bg-neutral-50 pb-6 px-6 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <CommentInput
            onSubmit={async (content) => {
              const fakeCommentId = `temp-${Date.now()}`;
              const fakeComment: CommentData = {
                id: fakeCommentId,
                userId: "temp_user",
                name: "(Đang gửi...)",
                avatarUrl: userProfileImg,
                date: new Date().toISOString(),
                content: content,
                replyingToName: replyingTo?.name,
                likes: [],
                replies: []
              };

              setDetail(prev => {
                if (!prev) return prev;
                return { ...prev, comments: [fakeComment, ...(prev.comments || [])] };
              });
              setCommentCount(prev => prev + 1); 

              try {
                const realComment = await announcementApi.createComment(id!, content);
                setDetail(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    comments: prev.comments?.map(c => c.id === fakeCommentId ? realComment : c)
                  };
                });
              } catch (error) {
                console.error("Sending comment error:", error);
                setDetail(prev => {
                  if (!prev) return prev;
                  return { ...prev, comments: prev.comments?.filter(c => c.id !== fakeCommentId) };
                });
                setCommentCount(prev => prev - 1);
              }
            }}
          />
        </div>
      </section>
    </div>
  )
}