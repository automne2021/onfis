import { useEffect, useRef, useState } from 'react';
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { AttachedFilesPreview } from './AttachedFilesPreview';

interface ChatInputProps {
  label?: string;
  onSendMessage?: (content: string, type: 'TEXT' | 'FILE', attachmentId?: string) => void;
  disabled?: boolean;
}

export function ChatInput({ label, onSendMessage, disabled }: ChatInputProps) {

  // useState
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // useRef
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close emoji panel 
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node))
        setShowEmojiPicker(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setMessage((prev) => prev + emojiObject.emoji)
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files)
      setAttachedFiles((prev) => [...prev, ...newFilesArray]);
    }

    // Reset input to choose that file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() && attachedFiles.length === 0) return;

    if (attachedFiles.length > 0) {
      console.log("Attached files: ", attachedFiles.map(file => file.name));
    } else {
      // Gửi text bình thường
      onSendMessage?.(message, 'TEXT'); 
    }

    setMessage('');
    setAttachedFiles([]);
    setShowEmojiPicker(false)
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-3 py-2 bg-white border-t border-neutral-200 flex-shrink-0 relative"
    >
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .psd"
      />

      {/* Emoji */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-[80px] right-6 z-50 shadow-xl rounded-xl"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            theme={Theme.LIGHT}
            width={320}
            height={400}
          />
        </div>
      )}

      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <AttachedFilesPreview attachedFiles={attachedFiles} onRemove={handleRemoveFile} />
      )}

      <div className="w-full h-[34px] border border-neutral-200 focus-within:border-primary transition-colors rounded-lg px-3 flex items-center bg-white shadow-sm input-focus">

        <button
          type="button"
          onClick={handleAttachmentClick}
          className="text-neutral-400 hover:text-primary transition-colors p-1 -ml-1 flex-shrink-0 outline-none"
        >
          <PlusCircle size={20} strokeWidth={2} />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Type a message to ${label ? `# ${label}` : '...'}`}
          className="flex-1 h-full bg-transparent border-none focus:outline-none text-neutral-900 placeholder:text-neutral-400 px-2 py-2 body-3-regular"
          disabled={disabled}
        />

        <button
          type="button"
          onClick={() => setShowEmojiPicker(prev => !prev)}
          className="text-neutral-400 hover:text-amber-500 transition-colors p-1 flex-shrink-0 outline-none"
        >
          <Smile size={20} strokeWidth={2} />
        </button>

        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-1 ml-1 flex-shrink-0 transition-colors outline-none ${message.trim()
            ? 'text-primary hover:text-blue-700 cursor-pointer'
            : 'text-neutral-300 cursor-not-allowed'
            }`}
        >
          <SendHorizontal size={20} strokeWidth={2} />
        </button>

      </div>

      <div className="text-center mt-1 body-4-regular text-neutral-400 select-none">
        Tip: Press Enter to send, Shift + Enter for new line
      </div>

    </form>
  );
}