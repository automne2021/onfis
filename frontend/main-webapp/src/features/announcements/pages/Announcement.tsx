import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Navbar } from "../components/Navbar";
import { Button } from '../../../components/common/Buttons/Button';

import { Add, PushPin } from '@mui/icons-material';
import { TabGroup } from '../../../components/common/Tab/TabGroup';
import { AnnouncementForm } from '../components/AnnouncementForm';
import { MOCK_ANNOUNCEMENTS } from '../../../data/mockAnnouncement';
import { AnnouncementCard } from '../components/Card/AnnouncementCard';
import { useSearchParams } from 'react-router-dom';


const tabItems = [
  { id: 'all', label: "All News", isDisplay: true },
  { id: 'department', label: "My Department", isDisplay: true },
  { id: 'company', label: "Company Wide", isDisplay: true },
  { id: 'pinned', label: "Pinned", icon: <PushPin fontSize='small' />, isDisplay: true },
]

export function Announcement() {

  // State Managements
  const [openAddForm, setOpenAddForm] = useState(false)
  const [openProfileId, setOpenProfileId] = useState<string | number | null>(null);

  const [searchParams] = useSearchParams()
  const currentView = searchParams.get('view') || 'all'

  // Escape key + body scroll lock (matching Modal.tsx pattern)
  useEffect(() => {
    if (openAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [openAddForm]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenAddForm(false);
    };
    if (openAddForm) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => { document.removeEventListener('keydown', handleEscape); };
  }, [openAddForm]);

  // Functions
  const handleToggleAddForm = () => {
    setOpenAddForm((prev) => !prev);
  };

  const handleLike = (id: string | number, status: boolean) => {
    console.log(`User liked post ${id}: ${status}`);
    // Logic gọi API update like ở đây
  }

  const handleComment = (id: string | number) => {
    console.log(`Open comment for post ${id}`);
  }

  const handleToggleProfile = (id: string | number) => {
    setOpenProfileId((prevId) => (prevId === id ? null : id));
  };

  const filteredAnnouncement = useMemo(() => {
    // Lọc dữ liệu theo Tab (View)
    const filtered = MOCK_ANNOUNCEMENTS.filter((item) => {
      switch (currentView) {
        case 'company':
          return item.scope === 'company'
        case 'department':
          return item.scope === 'department'
        case 'pinned':
          return item.isPinned === true
        case 'all':
        default:
          return true
      }
    });

    // Duyệt qua mảng đã lọc để tính toán số Like và Comment
    return filtered.map((item) => {
      // Tính tổng số Like
      const calculatedLikes = Array.isArray(item.likes)
        ? item.likes.length
        : 0;

      // Tính tổng số Comment + Replies
      let calculatedComments = 0;
      if (item.comments && Array.isArray(item.comments)) {
        calculatedComments = item.comments.reduce((total, comment) => {
          const repliesCount = comment.replies ? comment.replies.length : 0;
          return total + 1 + repliesCount;
        }, 0);
      }

      // Trả về item gốc kèm theo 2 biến mới chứa kết quả đã tính
      return {
        ...item,
        calculatedLikes,
        calculatedComments
      };
    });
  }, [currentView])

  return (
    <>
      <section className="onfis-section">
        <Navbar />
        <div className="w-full md:px-6 lg:px-8">
          {/* Title text */}
          <p className="header-h6 text-neutral-900 mt-5 mb-2 leading-none">
            Announcements & News
          </p>
          <p className="body-4-regular text-neutral-500">
            Stay updated with the latest company-wide and department-specific news, updates, and events.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-300 px-3 py-1.5 mt-3">
            {/* Tab group*/}
            <TabGroup tabItems={tabItems} defaultTab='all' />

            {/* Add button */}
            <Button
              title='Post Announcement'
              iconLeft={<Add sx={{ fontSize: 18 }} />}
              onClick={handleToggleAddForm}
              style='primary'
            />
          </div>

          {/* Body */}
          <div className='flex flex-col gap-3 mt-3'>
            {filteredAnnouncement.length > 0 ? (
              filteredAnnouncement.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  id={item.id}
                  authId={item.authId}
                  authName={item.authName}
                  position={item.position}
                  date={item.date}
                  avatarUrl={item.avatarUrl}
                  isPinned={item.isPinned}
                  scope={item.scope}
                  departments={item.departments}
                  title={item.title}
                  content={item.content}
                  attachments={item.attachments}
                  initialIsLike={item.initialIsLike}
                  numberOfLike={item.calculatedLikes}
                  numberOfComments={item.calculatedComments}
                  onToggleLike={handleLike}
                  onToggleComment={handleComment}
                  isProfileOpen={openProfileId === item.id}
                  onToggleProfile={() => handleToggleProfile(item.id)}
                />
              ))) : (
              <div className='text-center py-6 text-neutral-500 body-3-medium'>
                No announcements found in this view
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add form — portal-based modal with matching transitions */}
      {openAddForm && createPortal(
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          {/* Backdrop — animate-fadeIn matching Modal.tsx */}
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn'
            onClick={handleToggleAddForm}
          />

          {/* Panel — animate-slideUp matching Modal.tsx */}
          <div className='relative z-10 animate-slideUp'>
            <AnnouncementForm onClose={handleToggleAddForm} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}