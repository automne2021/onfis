import { useEffect, useMemo, useState, Suspense } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { BreadCrumb } from "../components/navigation/BreadCrumb"
import { getTimeAgo } from "../../../utils/getTime"
import { Tags } from "../components/Tags/Tags"

import { Public, PushPinOutlined, AttachFileOutlined, FileDownloadOutlined, ModeCommentOutlined, CommentOutlined, ThumbUp, ThumbUpOutlined, Groups, PushPin, MoreVert, EditOutlined, DeleteOutline, Edit, Delete } from '@mui/icons-material';

import userProfileImg from "../../../assets/images/user-profile-img.png"
import { getFileType } from "../../../config/fileConfig"
import { AttachmentTags } from "../components/Tags/AttachmentTag"
import { CommentItem } from "../components/Comment/CommentItem"
import { CommentInput } from "../components/Comment/CommentInput"
import { AnnouncementDetailLoading } from "../components/Loadings/AnnouncementDetailLoading"
import { ProfileCard } from "../../../components/common/Card/ProfileCard"
import type { AnnouncementData, CommentData } from "../types/AnnouncementTypes"
import type { FullUserProfile } from "../../../types/userType"

import { announcementApi } from "../services/announcementApi"
import { formatAnnouncementData } from "../utils/announcementFormatter"
import { userApi } from "../../profile/services/userApi"
import { useAuth } from "../../../hooks/useAuth"
import { useRole } from "../../../hooks/useRole"
import { toast } from "react-toastify"
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal"
import { AnnouncementFormLoading } from "../components/Loadings/AnnouncementFormLoading"
import React from "react"
import { createPortal } from "react-dom"
import { useTenantPath } from "../../../hooks/useTenantPath"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Menu from '@mui/material/Menu';

const AnnouncementForm = React.lazy(() => import('../components/AnnouncementForm').then(m => ({ default: m.AnnouncementForm })));

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { withTenant } = useTenantPath();
  const { isSuperAdmin, isAdmin, isManagerLike } = useRole();
  const { dbUser: currentUser } = useAuth();

  const [detail, setDetail] = useState<AnnouncementData | null>(null)
  const [authorProfile, setAuthorProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  
  const [replyingTo, setReplyingTo] = useState<{ id: string | number, name: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true)
      try {
        if (id) {
          const rawData = await announcementApi.getById(id);
          const data = await userApi.getFullUserProfile(String(rawData.authId));
          setAuthorProfile(data);

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

  const canEditDelete = useMemo(() => {
    if (!currentUser || !detail) return false;
    
    // Tác giả luôn có quyền
    if (String(detail.authId) === String(currentUser.id)) return true;

    const userRole = currentUser.role?.toUpperCase() || "";
    if (userRole === 'ADMIN' || userRole === "SUPER_ADMIN" || userRole === "SUPER ADMIN") return true;

    // Manager quản lý phòng ban của bài viết
    if (userRole === 'MANAGER') {
      return detail.targetDepartmentId === currentUser.departmentId;
    }

    return false;
  }, [currentUser, detail]);

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

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) return;
    try {
      setIsDeleting(true);
      await announcementApi.deleteAnnouncement(id);
      navigate(withTenant('/announcements'));
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      setIsDeleting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!detail?.attachments || detail.attachments.length === 0) return;

    for (let i = 0; i < detail.attachments.length; i++) {
      const file = detail.attachments[i];
      try {
        // Dùng fetch để ép tải file về máy dưới dạng Blob (tránh việc trình duyệt tự mở PDF/Ảnh)
        const response = await fetch(file.url);
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = file.fileName || `attachment-${i}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.warn(`Lỗi fetch (có thể do CORS), dùng fallback tải link cho file: ${file.fileName}`, error);
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.fileName || `attachment-${i}`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const canPin = useMemo(() => {
    // 1. Nếu chưa có thông tin user hoặc bài viết, mặc định không cho pin
    if (!currentUser || !detail) return false;

    const userRole = currentUser.role?.toUpperCase();

    if (userRole === 'ADMIN' || userRole === "SUPER_ADMIN") return true;

    if (userRole === 'MANAGER') {
      return detail.targetDepartmentId === currentUser.departmentId;
    }

    return false;
  }, [currentUser, detail]);

  const handleTogglePin = async () => {
    try {
      const newPinnedStatus = await announcementApi.toggleAnnouncementPin(id!);
      setDetail(prev => prev ? { ...prev, isPinned: newPinnedStatus } : prev);
    } catch (error) {
      console.error("Toggling pin announcement error:", error);
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleOpenEdit = () => { handleMenuClose(); setIsEditModalOpen(true); };
  const handleOpenDelete = () => { handleMenuClose(); setIsDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await announcementApi.deleteAnnouncement(id);
      toast.success("Announcement deleted successfully!");
      setIsDeleteModalOpen(false);
      navigate(withTenant('/announcements'));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete announcement.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <AnnouncementDetailLoading />
  }

  if (!detail) {
    return <div className="p-4 text-center text-neutral-500">No announcement available!</div>;
  }

  const avatarImg = detail.avatarUrl ? detail.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.authName)}&background=random`;
  const safeUtcDate = detail.date ? (detail.date.endsWith('Z') ? detail.date : `${detail.date}Z`) : "";
  const timeAgoString = safeUtcDate ? getTimeAgo(safeUtcDate) : "";

  // Can edit: SUPER_ADMIN / ADMIN = any; MANAGER = own only
  const canEdit = isSuperAdmin || isAdmin || (isManagerLike && String(detail.authId) === String(currentUser?.id));

  const profileCardData: FullUserProfile = authorProfile ? {
    id: authorProfile.id,
    email: authorProfile.email,
    avatarUrl: authorProfile.avatarUrl,
    firstName: authorProfile.firstName || '',
    lastName: authorProfile.lastName || '',
    positionName: authorProfile.positionName,
    departmentName: authorProfile.departmentName,
  } : {
    id: "unknown",
    email: "unknown@company.com",
    avatarUrl: userProfileImg,
  };

  const displayDeptName = authorProfile?.departmentName || "My department";

  return (
    <>
    <div className="flex flex-col min-h-[calc(100vh-70px)]">

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {isEditModalOpen && detail && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Suspense fallback={<AnnouncementFormLoading />}>
            <AnnouncementForm 
              onClose={() => setIsEditModalOpen(false)} 
              onSuccess={() => {
                setIsEditModalOpen(false);
                window.location.reload(); 
              }}
              announcementId={detail.id}
              initialData={detail}
            />
          </Suspense>
        </div>,
        document.body
      )}

      <section className="onfis-section">
        {/* Toolbar */}
        <nav className="navbar-style">
          <BreadCrumb title={detail.title} />
        </nav>

        {/* Body */}
        <div className="w-full pt-6 md:px-5 xl:px-8 2xl:px-10 flex flex-col justify-center bg-white border-b-2 border-neutral-200 mt-2 rounded-xl shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="header-h4 leading-snug text-neutral-900">{detail.title}</p>
              {canPin && (
                <button
                  onClick={handleTogglePin}
                  className={`p-2 shrink-0 rounded-full transition-colors duration-200 flex items-center justify-center
                    ${detail.isPinned 
                      ? "text-primary hover:bg-primary/10" 
                      : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                    }`}
                  title={detail.isPinned ? "" : "Is Pinned"}
                >
                  {detail.isPinned ? (
                    <PushPin
                      sx={{ 
                        fontSize: 22, 
                        transition: 'transform 0.2s' 
                      }} 
                    />
                  ) : (
                    <PushPinOutlined 
                      sx={{ 
                        fontSize: 22, 
                        transition: 'transform 0.2s' 
                      }} 
                    />
                  )}
                </button>
              )}
            </div>
            {canEditDelete && (
              <>
                <button 
                  onClick={handleMenuOpen}
                  className="text-neutral-500 hover:bg-neutral-200 p-1 px-1.5 rounded-full transition"
                >
                  <MoreVert sx={{ fontSize: 18 }} />
                </button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    elevation: 2,
                    sx: { mt: 1, minWidth: 150, borderRadius: 2 }
                  }}
                >
                  <MenuItem onClick={handleOpenEdit}>
                    <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14 }}>Edit</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleOpenDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14 }}>Delete</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 pb-3 border-b border-neutral-200">

            {/* Avt + Name + Position */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  onClick={() => togglePersonalInformationCard()}
                  className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={avatarImg} alt="User Avatar" className="w-full h-full object-cover" />
                  {/* <StatusBubble status={authorLiveStatus as "online" | "offline" | "busy"} /> */}
                </div>

                {isProfileOpen && (
                  <ProfileCard user={profileCardData} onClose={() => setIsProfileOpen(false)} />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="body-3-medium text-neutral-900">{detail.authName}</p>
                <p className="body-4-regular text-neutral-500">
                  {authorProfile?.positionName}<span className="mx-1">•</span>{timeAgoString}
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
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/10 transition"
                    title="Edit announcement"
                  >
                    <Edit sx={{ fontSize: 16 }} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete announcement"
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </button>
                </>
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
                <button 
                  type="button"
                  onClick={handleDownloadAll} 
                  className="text-primary hover:underline flex items-center gap-1 transition body-4-regular">
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

    {isEditOpen && detail && createPortal(
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn' onClick={() => setIsEditOpen(false)} />
        <div className='relative z-10 animate-slideUp w-full max-w-3xl'>
          <Suspense fallback={<AnnouncementFormLoading />}>
            <AnnouncementForm
              onClose={() => setIsEditOpen(false)}
              announcementId={id}
              initialData={detail}
              onSuccess={async () => {
                // Refresh detail after edit
                if (id) {
                  const rawData = await announcementApi.getById(id);
                  const formatted = formatAnnouncementData([rawData])[0];
                  if (formatted) setDetail(formatted);
                }
              }}
            />
          </Suspense>
        </div>
      </div>,
      document.body
    )}
  </>
  )
}