import { useEffect, useRef, useState } from 'react';
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { AttachedFilesPreview } from './AttachedFilesPreview';
import { announcementApi } from '../../../services/announcementApi';

interface ChatInputProps {
  label?: string;
  channelType?: string;
  onSendMessage?: (content: string, type: 'TEXT' | 'FILE', attachmentId?: string) => void;
  disabled?: boolean;
}

const AI_COMMANDS = [
  { command: '@tasks',         description: 'Xem danh sách công việc hôm nay' },
  { command: '@summarize',     description: 'Tóm tắt tin nhắn một kênh' },
  { command: '@announcements', description: 'Tóm tắt thông báo 7 ngày gần nhất' },
];

export function ChatInput({ label, channelType, onSendMessage, disabled }: ChatInputProps) {

  // useState
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCommandIdx, setActiveCommandIdx] = useState(0);

  // useRef
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive command suggestions from current message
  const commandMatch = channelType === 'assistant' ? message.match(/^@(\w*)$/) : null;
  const filteredCommands = commandMatch
    ? AI_COMMANDS.filter(c => c.command.startsWith('@' + commandMatch[1].toLowerCase()))
    : [];
  const showCommands = filteredCommands.length > 0;

  // Reset active index when suggestion list changes
  useEffect(() => {
    setActiveCommandIdx(0);
  }, [filteredCommands.length]);

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

  const handleSelectCommand = (cmd: string) => {
    setMessage(cmd + ' ');
    setActiveCommandIdx(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCommands) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCommandIdx(i => (i + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCommandIdx(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectCommand(filteredCommands[activeCommandIdx].command);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMessage('');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  if (!message.trim() && attachedFiles.length === 0) return;

  if (attachedFiles.length > 0) {
    setIsUploading(true);
    try {
      // Chạy vòng lặp upload từng file
      for (const file of attachedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResult = await announcementApi.uploadStandaloneFile(formData);
        
        // Gửi tin nhắn chứa ID file qua STOMP
        onSendMessage?.('', 'FILE', uploadResult.id); 
      }
    } catch (error) {
      console.error("Lỗi khi upload file", error);
      // Có thể thêm Toast báo lỗi ở đây
    } finally {
      setIsUploading(false);
    }
  } else {
    // Gửi text bình thường
    onSendMessage?.(message, 'TEXT'); 
  }

  setMessage('');
  setAttachedFiles([]);
  setShowEmojiPicker(false);
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

      {/* @ Command suggestions */}
      {showCommands && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-1.5 text-xs text-neutral-400 border-b border-neutral-100 font-medium select-none">
            Lệnh AI — ↑↓ để chọn, Enter để xác nhận
          </div>
          {filteredCommands.map((item, idx) => (
            <button
              key={item.command}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelectCommand(item.command); }}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                idx === activeCommandIdx ? 'bg-violet-50' : 'hover:bg-neutral-50'
              }`}
            >
              <span className="font-mono text-sm font-semibold text-violet-600">{item.command}</span>
              <span className="text-xs text-neutral-500">{item.description}</span>
            </button>
          ))}
        </div>
      )}

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
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isUploading
              ? 'Uploading file...'
              : channelType === 'assistant'
              ? 'Nhập: @summarize <tên kênh>, @tasks, @announcements...'
              : `Type a message to ${label ? `# ${label}` : '...'}`
          }
          className="flex-1 h-full bg-transparent border-none focus:outline-none text-neutral-900 placeholder:text-neutral-400 px-2 py-2 body-3-regular"
          disabled={disabled || isUploading} 
        />

        <button
          type="button"
          onClick={() => setShowEmojiPicker(prev => !prev)}
          className="text-neutral-400 hover:text-amber-500 transition-colors p-1 flex-shrink-0 outline-none"
          disabled={disabled || isUploading}
        >
          <Smile size={20} strokeWidth={2} />
        </button>

        <button
          type="submit"
          disabled={(!message.trim() && attachedFiles.length === 0) || isUploading}
          className={`p-1 ml-1 flex-shrink-0 transition-colors outline-none ${
            message.trim() || attachedFiles.length > 0
              ? 'text-primary hover:text-blue-700 cursor-pointer'
              : 'text-neutral-300 cursor-not-allowed'
          }`}
        >
          {isUploading ? (
             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <SendHorizontal size={20} strokeWidth={2} />
          )}
        </button>

      </div>

      <div className="text-center mt-1 body-4-regular text-neutral-400 select-none">
        Tip: Press Enter to send, Shift + Enter for new line
      </div>

    </form>
  );
}