import { Close, Groups, Business, KeyboardArrowDown,KeyboardArrowUp, PushPinOutlined, PushPin } from '@mui/icons-material';
import { Button } from '../../../components/common/Buttons/Button';
import { useCallback, useState } from 'react';
import { OptionCard } from './Card/OptionCard';
import Dropdown from '../../../components/common/Dropdown/Dropdown';
import { ContentList, type ContentItem } from '../../../components/common/Dropdown/ContentList';
import { OptionTag } from './Tags/OptionTag';
import { RichTextEditor } from '../../../components/common/RichTextEditor/RichTextEditor';
import { AttachmentSection } from '../../../components/common/Attachment/AttachmentSection';

// MOCK DATA
const DEPARTMENT_NAMES = [
  'Development',
  'Human Resources',
  'Marketing',
  'ABC',
  'DEF',
  'XYZ',
  'GHI'
];

interface AnnouncementFormProps {
  onClose: () => void
}

export function AnnouncementForm({ onClose } : AnnouncementFormProps) {

  // State Managements
  const [isPinned, setIsPinned] = useState(false)
  const [selectedOption, setSelectedOption] = useState('department')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [title, setTitle] = useState<string>('')
  const [messageContent, setMessageContent] = useState<string | null>(null)
  const [attachmentFile, setAttachmentFile] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

  // Functions
  const handleSelectOption = (id: string) => {
    setSelectedOption(id)
    console.log("Select: ", id)
    if (id !== "department") setActiveMenu(null)
  }

  const toggleMenu = (menuId: string) => {
    setActiveMenu(prev => prev === menuId ? null : menuId)
  }

  const handleSelectedDepartment = (deptName: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptName)) {
        return prev
      }
      return [...prev, deptName];
    });
  };

  const handleDeleteSelectedDepartment = (deptName: string) => {
    setSelectedDepartments(prev => {
      return prev.filter(name => name !== deptName)
    })
  }

  const handleContentChange = useCallback((html: string) => {
    setErrors(prev => (prev.content ? { ...prev, content: undefined } : prev));
    setMessageContent(html);
  }, []);

  const submitAnnouncement = async (status: 'draft' | 'published') => {
    // Check basic validation before publishing
    if (status === 'published') {
      const newErrors: { title?: string; content?: string } = {};
      
      if (!title.trim()) {
        newErrors.title = "Subject is required when publishing.";
      }
      
      if (!messageContent || messageContent.replace(/<[^>]*>/g, '').trim().length === 0) {
        newErrors.content =   "Message content is required when publishing.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return; 
      }
    }

    setIsSubmitting(true);

    const formData = new FormData() 
    formData.append('title', title)
    formData.append('content', messageContent || '')
    formData.append('scope', selectedOption)
    formData.append('status', status)
    formData.append('departments', JSON.stringify(selectedDepartments))

    attachmentFile.forEach((file) => {
      formData.append('attachments', file)
    })
    formData.append('isPinned', isPinned.toString())

    try {
      console.log(`Action: ${status}`, Object.fromEntries(formData));
      
      // Gọi API thực tế ở đây
      // const response = await api.post('/announcements', formData);
      
      alert(status === 'published' ? "Announcement published!" : "Draft saved successfully!");
      onClose(); 
    } catch (error) {
      console.error("Failed to process announcement", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Derived data
  const departmentListItems: ContentItem[] = DEPARTMENT_NAMES.map((name) => ({ content: name, onClick: () => handleSelectedDepartment(name)}))

  // Data
  const optionItems = [
    {
      id: 'department', 
      title: 'My Departments', 
      description: 'Visible to Departments', 
      icon: <Groups />, 
      permission: true, 
      content: <ContentList data={departmentListItems} emptyLabel='No department available' onItemClick={() => toggleMenu}/>
    },
    {
      id: 'company', 
      title: 'Whole Company', 
      description: 'Require Admin Approval', 
      icon: <Business />, 
      permission: false
    },
  ]

  return(
    <form className="bg-white rounded-2xl w-[480px] md:w-[620px] lg:w-[760px]">
      {/* Header - Title */}
      <div className="border-b border-neutral-200 flex justify-between items-center px-6 ">
        <div className='flex items-center gap-1'>
          <p className="header-h6 text-neutral-900">New Announcement</p>
          <button
            type='button'
            onClick={() => setIsPinned(prev => !prev)}
            className='p-2 rounded-full hover:bg-neutral-200 transition'
          >
            {isPinned 
              ? <PushPin className='text-primary' fontSize='small'/> 
              : <PushPinOutlined className='text-neutral-500' fontSize='small'/>
            }
          </button>
        </div>
        <button 
          type='button'
          onClick={onClose}
          className='p-2 rounded-full hover:bg-neutral-100 transition'
        >
          <Close className='text-neutral-500'/>
        </button>
      </div>

      {/* Body */}
      <div className='py-6 flex flex-col gap-6 min-h-[520px] max-h-[760px] overflow-y-auto'>

        {/* Audience Scope */}
        <div className='flex flex-col gap-4 px-6 '>
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
          {selectedOption === "department" && (
            <>
              <div className='relative w-fit'>
                <p className='body-4-regular text-neutral-500 mb-2'>Choose departments</p>
                <Dropdown
                  key={"department"}
                  isOpen={activeMenu === "department"}
                  trigger={
                    <Button 
                      title='Your Departments'
                      iconRight={activeMenu === "department" ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      onClick={() => toggleMenu("department")}
                      style='sub'
                    />
                  }
                  children={optionItems.find(i => i.id === "department")?.content}
                  onClose={() => setActiveMenu(null)}
                />
              </div>
              <div className='flex flex-wrap items-center gap-2 w-fit max-w-full max-h-[88px] overflow-y-auto'>
                {selectedDepartments.map((item) => (
                  <OptionTag label={item} onDelete={() => handleDeleteSelectedDepartment(item)}/>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Subject */}
        <div className='flex flex-col gap-4 px-6 '>
          <p className="body-3-medium text-neutral-900">
            Subject <span className='text-red-500'>*</span>
          </p>
          {/* Input */}
          <input 
            name='subject'
            type="text" 
            placeholder='Enter announcement title...'
            minLength={1}
            maxLength={32}
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            className={`w-full body-2-regular text-neutral-900 border px-4 py-3 rounded-lg transition-all outline-none 
            ${errors.title ? 'border-red-500' : (title.length > 0 ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50')}
            focus:border-primary focus:bg-white`}
          />
          
          {errors.title && (
            <span className="body-4-regular text-red-500 ml-1">*{errors.title}</span>
          )}
        </div>

        {/* Message Content */}
        <div className='flex flex-col gap-4 px-6 '>
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
        <div className='flex flex-col gap-4 px-6 '>
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
      <div className='py-2 border-t border-neutral-200 flex items-center justify-end gap-3 px-6'>
        <Button
          title='Save as Draft'
          onClick={() => submitAnnouncement('draft')}
          style='sub'
        />
        <Button 
          title='Publish Now'
          onClick={() => submitAnnouncement('published')}
          style='primary'
          loading={isSubmitting}
        />
      </div>

    </form>
  )
}