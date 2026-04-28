import { Close, Groups, Business, PushPinOutlined, PushPin } from '@mui/icons-material';
import { Button } from '../../../components/common/Buttons/Button';
import { useCallback, useEffect, useState } from 'react';
import { OptionCard } from './Card/OptionCard';
import { RichTextEditor } from '../../../components/common/RichTextEditor/RichTextEditor';
import { AttachmentSection } from '../../../components/common/Attachment/AttachmentSection';
import { announcementApi } from '../services/announcementApi';
import type { AnnouncementData, AttachmentResponseDTO, DepartmentType } from '../types/AnnouncementTypes';

import { toast } from 'react-toastify'; 
import { useAuth } from '../../../hooks/useAuth';
import { userApi } from '../../profile/services/userApi';
import type { FullUserProfile } from '../../../types/userType';

interface AnnouncementFormProps {
  onClose: () => void;
  onSuccess: (status: 'DRAFT' | 'PUBLISHED') => void;
  editData?: AnnouncementData | null;
}

export function AnnouncementForm({ onClose, onSuccess, editData }: AnnouncementFormProps) {

  const { dbUser: user } = useAuth();
  
  // State Managements
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedOption, setSelectedOption] = useState('department');
  const [myDepartment, setMyDepartment] = useState<DepartmentType | null>(null);

  const [title, setTitle] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<AttachmentResponseDTO[]>([]);

  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const userRole = user.role?.toUpperCase() || "";
      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        setIsAdmin(true);
        setSelectedOption('company');
      } else {
        setIsAdmin(false);
        setSelectedOption('department');
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchMyDepartment = async () => {
      try {
        const res = await announcementApi.getMyDepartments();
        if (res && res.length > 0) {
          setMyDepartment(res[0]);
        }
      } catch (error) {
        console.error("Error fetching department:", error);
      }
    };
    fetchMyDepartment();
  }, []);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || '');
      setMessageContent(editData.content || '');
      setIsPinned(editData.isPinned || false);
      setSelectedOption(editData.targetDepartmentId ? 'department' : (editData.scope || 'company'));
      
      if (editData.attachments) {
        setExistingAttachments(editData.attachments as unknown as AttachmentResponseDTO[]);
      }
      return; 
    }

    // Nếu không Edit thì fetch Draft
    const fetchDraft = async () => {
      try {
        const draft = await announcementApi.getMyDraft();
        if (draft && draft.id) {
          setDraftId(draft.id);
          setTitle(draft.title || '');
          setMessageContent(draft.content || '');
          setIsPinned(draft.isPinned || false);
          setSelectedOption(draft.scope || 'company');
        }
      } catch (error: unknown) {
        console.error("No draft found or error fetching draft: ", error);
      }
    };
    fetchDraft();
  }, [editData]);

  useEffect(() => {
    if (user?.id) {
      userApi.getFullUserProfile(user.id)
        .then((res: FullUserProfile) => {
          const userRole = res.role?.toUpperCase() || "";
          if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPER ADMIN') {
            setIsAdmin(true);
          }
        })
        .catch((err: unknown) => { 
        console.error("Failed to fetch user role:", err);
      });
    }
  }, [user?.id]);


  useEffect(() => {
    if (editData && editData.attachments) {
      setExistingAttachments(editData.attachments);
    }
  }, [editData]);

  const handleContentChange = useCallback((content: string) => {
    setMessageContent(content);
    if (errors.content) setErrors(prev => ({ ...prev, content: undefined }));
  }, [errors.content]);

  const handleDeleteExistingAttachment = async (fileId: string | number) => {
    if (window.confirm("Are you sure you want to remove this attachment?")) {
      try {
        await announcementApi.deleteAttachment(fileId);
        setExistingAttachments(prev => prev.filter(file => file.id !== fileId));
        toast.success("Attachment removed successfully!");
      } catch (error: unknown) {
        console.error("Failed: ", error);
        toast.error("Failed to remove attachment.");
      }
    }
  };

  const handleSelectOption = (id: string) => {
    setSelectedOption(id);
  }

  const submitAnnouncement = async (status: 'DRAFT' | 'PUBLISHED') => {
    setFormError(null); 
    
    const cleanContent = messageContent ? messageContent.replace(/<\/?p[^>]*>/g, "") : '';

    if (status === 'PUBLISHED') {
      const newErrors: { title?: string; content?: string } = {};
      if (!title.trim()) newErrors.title = "Subject is required when publishing.";
      if (!cleanContent || cleanContent.trim().length === 0) newErrors.content = "Message content is required when publishing.";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const formData = new FormData();

    if (editData) {
      formData.append('id', editData.id.toString());
    } else if (draftId) {
      formData.append('id', draftId); 
    }

    formData.append('title', title);
    formData.append('content', messageContent?.trim() || ""); // Gửi HTML đi thay vì cleanContent (tuỳ logic DB của bạn)
    formData.append('scope', selectedOption);
    formData.append('status', status);
    
    if (selectedOption === 'department' && myDepartment) {
      formData.append('departments', JSON.stringify([myDepartment.id]));
    } else {
      formData.append('departments', JSON.stringify([]));
    }

    attachmentFile.forEach((file) => formData.append('attachments', file));
    formData.append('isPinned', isPinned.toString());

    try {
      if (editData) {
        await announcementApi.updateAnnouncement(editData.id, formData);
        toast.success("Announcement updated successfully!");
      } else {
        await announcementApi.createAnnouncement(formData);
        toast.success(status === 'PUBLISHED' ? "Published successfully!" : "Draft saved!");
      }
      
      if (status === 'PUBLISHED') setDraftId(null);
      if (onSuccess) onSuccess(status);
      onClose();
    } catch (error: unknown) {
      console.error(error);
      setFormError("An error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Data
  const optionItems = [
    {
      id: 'department',
      title: 'My Department',
      description: 'Visible to your department',
      icon: <Groups />,
      permission: true,
    },
    {
      id: 'company',
      title: 'Whole Company',
      description: isAdmin ? 'Visible to the entire company' : 'Require Admin Approval',
      icon: <Business />,
      permission: isAdmin 
    },
  ];

  return (
    <form className="bg-white rounded-xl w-[420px] md:w-[590px] lg:w-[732px] shadow-xl border border-neutral-200">
      {/* Header - Title */}
      <div className="border-b border-neutral-200 flex justify-between items-center px-4 py-2">
        <div className='flex items-center gap-1'>
          <p className="text-base font-bold text-neutral-900 leading-snug">New Announcement</p>
          <button
            type='button'
            onClick={() => setIsPinned(prev => !prev)}
            className='p-2 rounded-full hover:bg-neutral-200 transition'
          >
            {isPinned
              ? <PushPin className='text-primary' fontSize='small' />
              : <PushPinOutlined className='text-neutral-500' fontSize='small' />
            }
          </button>
        </div>
        <button
          type='button'
          onClick={onClose}
          className='p-2 rounded-full hover:bg-neutral-100 transition'
        >
          <Close className='text-neutral-500' />
        </button>
      </div>

      {/* Body */}
      <div className='py-3 flex flex-col gap-3 min-h-[280px] max-h-[400px] overflow-y-auto custom-scrollbar'>

        {formError && (
          <div className="mx-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
            {formError}
          </div>
        )}

        {/* Audience Scope */}
        <div className='flex flex-col gap-3 px-4 '>
          <p className="body-3-medium text-neutral-900">
            Audience Scope
          </p>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            {optionItems.map((item) => (
              <OptionCard
                key={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                permission={item.permission}
                isActive={selectedOption === item.id}
                onClick={() => handleSelectOption(item.id)}
              />
            ))}
          </div>
          
          {selectedOption === "department" && myDepartment && (
            <div className="mt-1 pl-1">
              <p className="body-4-regular text-neutral-500">
                Targeting: <span className="body-4-regular text-primary bg-secondary px-2 py-0.5 rounded-md border border-primary">{myDepartment.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Subject */}
        <div className='flex flex-col gap-3 px-4 '>
          <p className="body-3-medium text-neutral-900">
            Subject <span className='text-red-500'>*</span>
          </p>
          <input
            name='subject'
            type="text"
            placeholder='Enter announcement title...'
            minLength={1}
            maxLength={256}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              if (formError) setFormError(null);
            }}
            value={title}
            className={`w-full body-3-regular text-neutral-900 border px-4 py-3 rounded-lg transition-all outline-none 
            ${errors.title ? 'border-red-500' : (title.length > 0 ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50')}
            focus:border-primary focus:bg-white`}
          />

          {errors.title && (
            <span className="body-4-regular text-red-500 ml-1">*{errors.title}</span>
          )}
        </div>

        {/* Message Content */}
        <div className='flex flex-col gap-3 px-4 '>
          <p className="body-3-medium text-neutral-900">
            Message Content <span className='text-red-500'>*</span>
          </p>

          <RichTextEditor
            onChange={handleContentChange}
          />

          {errors.content && (
            <span className="body-4-regular text-red-500 ml-1">*{errors.content}</span>
          )}
        </div>

        {/* Attachments */}
        <div className='flex flex-col gap-3 px-4 '>
          <p className="body-3-medium text-neutral-900">
            Attachments
          </p>
          {existingAttachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              <p className="text-xs text-neutral-500 italic">Existing files:</p>
              {existingAttachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-neutral-50 border rounded-lg">
                  <span className="text-sm text-neutral-700 truncate max-w-[80%]">{file.fileName}</span>
                  <button 
                    type="button"
                    onClick={() => handleDeleteExistingAttachment(file.id!)}
                    className="text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm border"
                  >
                    <Close fontSize="small" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <AttachmentSection
            files={attachmentFile}
            setFiles={setAttachmentFile}
          />
        </div>

      </div>

      {/* Footer - Save + Publish buttons */}
      <div className='py-2 border-t border-neutral-200 flex items-center justify-end gap-2 px-4'>
        <Button
          title='Save as Draft'
          onClick={() => submitAnnouncement('DRAFT')}
          style='sub'
        />
        <Button
          title='Publish Now'
          onClick={() => submitAnnouncement('PUBLISHED')}
          style='primary'
          loading={isSubmitting}
        />
      </div>

    </form>
  )
}