import { Close, Groups, Business, PushPinOutlined, PushPin } from '@mui/icons-material';
import { Button } from '../../../components/common/Buttons/Button';
import { useCallback, useEffect, useState } from 'react';
import { OptionCard } from './Card/OptionCard';
import { RichTextEditor } from '../../../components/common/RichTextEditor/RichTextEditor';
import { AttachmentSection } from '../../../components/common/Attachment/AttachmentSection';
import { announcementApi } from '../services/announcementApi';
import type { DepartmentType } from '../types/AnnouncementTypes';

import { toast } from 'react-toastify'; 
import { useAuth } from '../../../hooks/useAuth';
import { userApi } from '../../profile/services/userApi';
import type { FullUserProfile } from '../../../types/userType';

interface AnnouncementFormProps {
  onClose: () => void;
  onSuccess: (status: 'DRAFT' | 'PUBLISHED') => void;
}

export function AnnouncementForm({ onClose, onSuccess }: AnnouncementFormProps) {

  const { user } = useAuth();
  
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

  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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
    const fetchDepartments = async () => {
      try {
        const data = await announcementApi.getMyDepartments();
        if (data && data.length > 0) {
          setMyDepartment(data[0]); 
        }
      } catch (error) {
        console.error("No department available", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleSelectOption = (id: string) => {
    setSelectedOption(id);
  }

  const handleContentChange = useCallback((html: string) => {
    setErrors(prev => (prev.content ? { ...prev, content: undefined } : prev));
    setMessageContent(html);
    if (formError) setFormError(null); 
  }, [formError]);

  const submitAnnouncement = async (status: 'DRAFT' | 'PUBLISHED') => {
    setFormError(null); 
    
    const cleanContent = messageContent ? messageContent.replace(/<\/?p[^>]*>/g, "") : '';

    if (status === 'PUBLISHED') {
      const newErrors: { title?: string; content?: string } = {};

      if (!title.trim()) {
        newErrors.title = "Subject is required when publishing.";
      }

      if (!cleanContent || cleanContent.trim().length === 0) {
        newErrors.content = "Message content is required when publishing.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const formData = new FormData();

    if (draftId) {
      formData.append('id', draftId); 
    }

    formData.append('title', title);
    formData.append('content', cleanContent.trim());
    formData.append('scope', selectedOption);
    formData.append('status', status);
    
    if (selectedOption === 'department' && myDepartment) {
      formData.append('departments', JSON.stringify([myDepartment.id]));
    } else {
      formData.append('departments', JSON.stringify([]));
    }

    attachmentFile.forEach((file) => {
      formData.append('attachments', file);
    });
    formData.append('isPinned', isPinned.toString());

    try {
      await announcementApi.createAnnouncement(formData);

      toast.success(status === 'PUBLISHED' ? "Published successfully!" : "Draft saved!")
      
      if (status === 'PUBLISHED') {
          setDraftId(null);
      }

      if (onSuccess) onSuccess(status);
      onClose();
    } catch (error: unknown) {
      console.error(error);
      setFormError("An error occurred while saving. Please try again: ");
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