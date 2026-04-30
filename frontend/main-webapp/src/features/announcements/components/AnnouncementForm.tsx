import { Close, Groups, Business, PushPinOutlined, PushPin, AttachFile } from '@mui/icons-material';
import { Button } from '../../../components/common/Buttons/Button';
import { useCallback, useEffect, useState } from 'react';
import { OptionCard } from './Card/OptionCard';
import { RichTextEditor } from '../../../components/common/RichTextEditor/RichTextEditor';
import { AttachmentSection } from '../../../components/common/Attachment/AttachmentSection';
import { announcementApi } from '../services/announcementApi';
import type { AnnouncementData, AttachmentItem, DepartmentType } from '../types/AnnouncementTypes';

import { toast } from 'react-toastify'; 
import { useAuth } from '../../../hooks/useAuth';
import { userApi } from '../../profile/services/userApi';
import type { FullUserProfile } from '../../../types/userType';

interface AnnouncementFormProps {
  onClose: () => void;
  onSuccess: () => void;
  /** Set to enable edit mode */
  announcementId?: string | number;
  initialData?: AnnouncementData;
}

export function AnnouncementForm({ onClose, onSuccess, announcementId, initialData }: AnnouncementFormProps) {
  const isEditMode = !!announcementId;
  const { user } = useAuth();
  
  // State Managements
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinned, setIsPinned] = useState(initialData?.isPinned ?? false);
  const [selectedOption, setSelectedOption] = useState(initialData?.scope ?? 'department');
  const [myDepartment, setMyDepartment] = useState<DepartmentType | null>(null);

  const [title, setTitle] = useState<string>(initialData?.title ?? '');
  const [messageContent, setMessageContent] = useState<string | null>(initialData?.content ?? null);
  const [attachmentFile, setAttachmentFile] = useState<File[]>([]);
  /** Existing attachments (edit mode) — track which to keep */
  const [existingAttachments, setExistingAttachments] = useState<AttachmentItem[]>(initialData?.attachments ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      userApi.getFullUserProfile(user.id)
        .then((res: FullUserProfile) => {
          const userRole = res.role?.toUpperCase() || "";
          if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPER ADMIN') {
            setIsAdmin(true);
          }
        })
        .catch((err: unknown) => { // Thay any bằng unknown
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

  const submitAnnouncement = async (status: 'draft' | 'published') => {
    setFormError(null); 
    
    const cleanContent = messageContent ? messageContent.replace(/<\/?p[^>]*>/g, "") : '';

    if (status === 'published') {
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
    formData.append('title', title);
    formData.append('content', cleanContent.trim());
    formData.append('scope', selectedOption);
    formData.append('status', status);
    formData.append('isPinned', isPinned.toString());
    
    if (selectedOption === 'department' && myDepartment) {
      formData.append('departments', JSON.stringify([myDepartment.id]));
    } else {
      formData.append('departments', JSON.stringify([]));
    }

    try {
      if (isEditMode) {
        // Edit mode: include kept existing attachment IDs + new files
        existingAttachments.forEach((att) => {
          formData.append('existingAttachmentIds', String(att.id));
        });
        attachmentFile.forEach((file) => {
          formData.append('newAttachments', file);
        });
        await announcementApi.updateAnnouncement(announcementId!, formData);
        toast.success("Announcement updated successfully!", { position: "top-right", autoClose: 1500 });
      } else {
        // Create mode
        attachmentFile.forEach((file) => {
          formData.append('attachments', file);
        });
        await announcementApi.createAnnouncement(formData);
        toast.success(status === 'published' ? "Announcement published successfully!" : "Draft saved successfully!", {
          position: "top-right",
          autoClose: 1500,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Failed to process announcement", error);
      setFormError("An error occurred while saving the announcement. Please check your connection or try again later.");
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
          <p className="text-base font-bold text-neutral-900 leading-snug">
            {isEditMode ? 'Edit Announcement' : 'New Announcement'}
          </p>
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
            initialContent={initialData?.content ?? ''}
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

          {/* Existing attachments in edit mode */}
          {isEditMode && existingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {existingAttachments.map((att) => (
                <div key={att.id} className="flex items-center gap-1 bg-neutral-100 rounded-lg px-2 py-1 text-sm text-neutral-700">
                  <AttachFile sx={{ fontSize: 14 }} />
                  <span className="max-w-[120px] truncate">{att.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setExistingAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="ml-1 text-neutral-400 hover:text-red-500 transition"
                    title="Remove attachment"
                  >
                    <Close sx={{ fontSize: 14 }} />
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
        {!isEditMode && (
          <Button
            title='Save as Draft'
            onClick={() => submitAnnouncement('draft')}
            style='sub'
          />
        )}
        <Button
          title={isEditMode ? 'Save Changes' : 'Publish Now'}
          onClick={() => submitAnnouncement('published')}
          style='primary'
          loading={isSubmitting}
        />
      </div>

    </form>
  )
}