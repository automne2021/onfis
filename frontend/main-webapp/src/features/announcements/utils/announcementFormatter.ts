import type { AnnouncementData } from '../types/AnnouncementTypes';

// Nhận vào mảng dữ liệu thô (bất kỳ) và trả về mảng dữ liệu chuẩn AnnouncementData
export const formatAnnouncementData = (rawAnnouncements: any[]): AnnouncementData[] => {
  if (!rawAnnouncements || !Array.isArray(rawAnnouncements)) return [];

  return rawAnnouncements.map((item: any) => {
    const calculatedLikes = item.likes?.length || 0;
    let calculatedComments = 0;
    
    if (item.comments && Array.isArray(item.comments)) {
      calculatedComments = item.comments.reduce((total: number, comment: any) => {
        const repliesCount = comment.replies ? comment.replies.length : 0;
        return total + 1 + repliesCount;
      }, 0);
    }

    return {
      ...item,
      date: item.createdAt || new Date().toISOString(),
      authId: item.authId || 'unknown',
      authName: item.authName || 'Unknown User', 
      position: item.authDepartment || 'Employee', 
      isPinned: item.pinned, 
      scope: item.scope || (item.targetDepartmentId === null ? 'company' : 'department'),
      calculatedLikes,
      calculatedComments
    };
  });
};