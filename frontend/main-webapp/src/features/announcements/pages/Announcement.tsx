import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';

import { Navbar } from "../components/Navbar";
import { Button } from '../../../components/common/Buttons/Button';
import { Add, PushPin } from '@mui/icons-material'; 
import { TabGroup } from '../../../components/common/Tab/TabGroup';
import { AnnouncementCard } from '../components/Card/AnnouncementCard';
import { useSearchParams } from 'react-router-dom';
import { useRole } from '../../../hooks/useRole';
import { announcementApi } from '../services/announcementApi';
import { type AnnouncementData } from '../types/AnnouncementTypes';
import { useAuth } from '../../../hooks/useAuth';
import { formatAnnouncementData } from '../utils/announcementFormatter';

import { Pagination } from '../components/Pagination';
import { AnnouncementLoading } from '../components/Loadings/AnnouncementLoading';
import { AnnouncementFormLoading } from '../components/Loadings/AnnouncementFormLoading';

// 🌟 1. ÁP DỤNG LAZY LOAD CHO FORM (Vì form này chứa bộ Rich Text Editor rất nặng)
const AnnouncementForm = React.lazy(() => import('../components/AnnouncementForm').then(m => ({ default: m.AnnouncementForm })));

const tabItems = [
  { id: 'all', label: "All News", isDisplay: true },
  { id: 'department', label: "My Department", isDisplay: true },
  { id: 'company', label: "Company Wide", isDisplay: true },
  { id: 'pinned', label: "Pinned", icon: <PushPin fontSize='small' />, isDisplay: true },
]

export function Announcement() {

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openAddForm, setOpenAddForm] = useState(false);
  const [openProfileId, setOpenProfileId] = useState<string | number | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const { isManager } = useRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'all';
  const currentUserId = user?.id || "";

  useEffect(() => {
    setCurrentPage(0);
  }, [currentView]);

  const fetchMyAnnouncements = useCallback(async (isMounted: boolean = true) => {
    try {
      setIsLoading(true);
      let responseData;

      if (currentView === 'department' && !currentUserId) {
         setIsLoading(false);
         return;
      }

      switch (currentView) {
        case 'company':
          responseData = await announcementApi.getCompanyAnnouncements(currentPage);
          break;
        case 'department':
          responseData = await announcementApi.getDepartmentAnnouncements(currentUserId, currentPage);
          break;
        case 'pinned':
          responseData = await announcementApi.getPinnedAnnouncements(currentPage); 
          break;
        case 'all':
        default:
          responseData = await announcementApi.getAll(currentPage);
          break;
      }

      const formattedData = formatAnnouncementData(responseData.content);

      if (isMounted) {
        setAnnouncements(formattedData);
        setTotalPages(responseData.totalPages); 
      }
    } catch (error) {
      console.error("Announcement Errors:", error);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, [currentView, currentUserId, currentPage]); 

  useEffect(() => {
    let isMounted = true;
    fetchMyAnnouncements(isMounted);
    return () => { isMounted = false; };
  }, [fetchMyAnnouncements]);

  useEffect(() => {
    document.body.style.overflow = openAddForm ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [openAddForm]);

  const handleToggleAddForm = () => setOpenAddForm((prev) => !prev);
  const handleToggleProfile = (id: string | number) => setOpenProfileId((prevId) => (prevId === id ? null : id));

  const handleLike = (id: string | number, newStatus: boolean) => {
    setAnnouncements(prev => prev.map(item => {
      if (item.id === id) {
        const currentLikes = item.numberOfLike || 0;
        return {
          ...item,
          initialIsLike: newStatus,
          numberOfLike: newStatus ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        };
      }
      return item;
    }));
  }

  return (
    <>
      <section className="onfis-section flex flex-col min-h-screen">
        <Navbar />
        <div className="w-full md:px-6 lg:px-8 flex-1 flex flex-col">
          <p className="header-h6 text-neutral-900 mt-5 mb-2 leading-none">
            Announcements & News
          </p>
          <p className="body-4-regular text-neutral-500">
            Stay updated with the latest company-wide and department-specific news.
          </p>

          <div className="flex items-center justify-between border-b border-neutral-300 px-3 py-1.5 mt-3">
            <TabGroup tabItems={tabItems} defaultTab='all' />
            {isManager && (
              <Button
                title='Post Announcement'
                iconLeft={<Add sx={{ fontSize: 18 }} />}
                onClick={handleToggleAddForm}
                style='primary'
              />
            )}
          </div>

          <div className='flex flex-col gap-3 mt-3 pb-8'>
            {isLoading ? (
              <>
                <AnnouncementLoading />
              </>
            ) : announcements.length > 0 ? (
              <>
                {announcements.map((item) => (
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
                    targetDepartmentName={item.targetDepartmentName}
                    title={item.title}
                    content={item.content}
                    attachments={item.attachments || []}
                    numberOfComments={item.numberOfComments} 
                    numberOfLike={item.numberOfLike}
                    initialIsLike={item.initialIsLike}
                    onToggleLike={handleLike}
                    isProfileOpen={openProfileId === item.id}
                    onToggleProfile={() => handleToggleProfile(item.id)}
                  />
                ))}

                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                />
              </>
            ) : (
              <div className='text-center py-12 text-neutral-500 body-3-medium bg-neutral-50 rounded-xl border border-dashed border-neutral-300'>
                No announcements found in this view
              </div>
            )}
          </div>
        </div>
      </section>

      {openAddForm && createPortal(
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn' onClick={handleToggleAddForm} />
          
          <div className='relative z-10 animate-slideUp w-full max-w-3xl'>
            {/* 🌟 2. BỌC FORM TRONG SUSPENSE (Kèm giao diện Fallback mượt mà) */}
            <Suspense fallback={<AnnouncementFormLoading />}>
              <AnnouncementForm 
                onClose={handleToggleAddForm} 
                onSuccess={() => {
                  handleToggleAddForm();
                  setCurrentPage(0); 
                  fetchMyAnnouncements();
                }} 
              />
            </Suspense>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}