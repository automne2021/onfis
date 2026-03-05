import { useMemo, useState } from 'react';

import { Navbar } from "../components/Navbar";
import { Button } from '../../../components/common/Buttons/Button';

import { Add, PushPin } from '@mui/icons-material';
import { TabGroup } from '../../../components/common/Tab/TabGroup';
import { AnnouncementForm } from '../components/AnnouncementForm';
import { MOCK_ANNOUNCEMENTS } from '../../../data/mockAnnouncement';
import { AnnouncementCard } from '../components/Card/AnnouncementCard';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';


const tabItems = [
  { id: 'all', label: "All News", isDisplay: true },
  { id: 'department', label: "My Department", isDisplay: true },
  { id: 'company', label: "Company Wide", isDisplay: true },
  { id: 'pinned', label: "Pinned", icon: <PushPin fontSize='small'/>, isDisplay: true },
]

export function Announcement() {

  // State Managements
  const [openAddForm, setOpenAddForm] = useState(false)

  const [searchParams] = useSearchParams()
  const currentView = searchParams.get('view') || 'all'

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

  return(
    <>
      <section className="w-full px-4 md:px-5 xl:px-8 py-6 flex justify-center bg-neutral-50 flex-col pt-0">
        <Navbar />
        <div className="w-full px-0 lg:px-12">
          {/* Title text */}
          <p className="header-h4 text-neutral-900 mt-[24px]">
            Announcements & News
          </p>
          <p className="body-2-medium text-neutral-500">
            Stay updated with the latest company-wide and department-specific news, updates, and events.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-300 px-4 py-2 mt-[24px]">
            {/* Tab group*/}
            <TabGroup tabItems={tabItems} defaultTab='all' />

            {/* Add button */}
            <Button 
              title='Post Announcement'
              iconLeft={<Add />}
              onClick={handleToggleAddForm}
              style='primary'
            />
          </div>

          {/* Body */}
          <div className='flex flex-col gap-4 mt-6'>
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
                />
            ))) : (
              <div className='text-center py-10 text-neutral-500 body-2-medium'>
                No announcements found in this view
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add form */}
      {openAddForm && createPortal(
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm'>
          {/* Click ở ngoài để đóng form */}
          <div className='absolute inset-0' onClick={handleToggleAddForm}/>

          {/* Form Content */}
          <div className='relative z-10 w-full max-w-[800px] max-h-[90vh] overflow-y-auto px-4'>
            <AnnouncementForm onClose={handleToggleAddForm}/>
          </div>
        </div>,
        document.body // Dịch chuyển toàn bộ Modal ra thẳng thẻ <body>
      )}
    </>
  );
}