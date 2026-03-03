// SVG Icons
const BoldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4H13C14.0609 4 15.0783 4.42143 15.8284 5.17157C16.5786 5.92172 17 6.93913 17 8C17 9.06087 16.5786 10.0783 15.8284 10.8284C15.0783 11.5786 14.0609 12 13 12H6V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12H14C15.0609 12 16.0783 12.4214 16.8284 13.1716C17.5786 13.9217 18 14.9391 18 16C18 17.0609 17.5786 18.0783 16.8284 18.8284C16.0783 19.5786 15.0609 20 14 20H6V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 20H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UnderlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 3V10C6 11.5913 6.63214 13.1174 7.75736 14.2426C8.88258 15.3679 10.4087 16 12 16C13.5913 16 15.1174 15.3679 16.2426 14.2426C17.3679 13.1174 18 11.5913 18 10V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BulletListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="4" cy="6" r="1" fill="currentColor"/>
    <circle cx="4" cy="12" r="1" fill="currentColor"/>
    <circle cx="4" cy="18" r="1" fill="currentColor"/>
  </svg>
);

const NumberedListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="3" y="8" fontSize="8" fill="currentColor" fontWeight="bold">1</text>
    <text x="3" y="14" fontSize="8" fill="currentColor" fontWeight="bold">2</text>
    <text x="3" y="20" fontSize="8" fill="currentColor" fontWeight="bold">3</text>
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6897C16.4231 14.4391 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.479 3.53087C19.552 2.60383 18.2979 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.47L11.75 5.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60706C11.7642 9.26329 11.0685 9.05886 10.3533 9.00765C9.63816 8.95643 8.92037 9.05961 8.24861 9.3103C7.57685 9.56099 6.96684 9.95291 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3962 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

function ToolbarButton({ icon, title, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 transition-colors"
      title={title}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-neutral-200 mx-1" />;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  height = "h-48",
}: RichTextEditorProps) {
  // Note: These are placeholder handlers - in a real app you'd integrate
  // with a proper rich text editor like TipTap, Quill, or Slate
  const handleBold = () => {
    // Implement bold formatting
  };

  const handleItalic = () => {
    // Implement italic formatting
  };

  const handleUnderline = () => {
    // Implement underline formatting
  };

  const handleBulletList = () => {
    // Implement bullet list
  };

  const handleNumberedList = () => {
    // Implement numbered list
  };

  const handleLink = () => {
    // Implement link insertion
  };

  return (
    <div
      className={`bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden flex flex-col ${height}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-neutral-200 bg-neutral-100">
        <ToolbarButton icon={<BoldIcon />} title="Bold" onClick={handleBold} />
        <ToolbarButton
          icon={<ItalicIcon />}
          title="Italic"
          onClick={handleItalic}
        />
        <ToolbarButton
          icon={<UnderlineIcon />}
          title="Underline"
          onClick={handleUnderline}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={<BulletListIcon />}
          title="Bullet List"
          onClick={handleBulletList}
        />
        <ToolbarButton
          icon={<NumberedListIcon />}
          title="Numbered List"
          onClick={handleNumberedList}
        />
        <ToolbarDivider />
        <ToolbarButton icon={<LinkIcon />} title="Link" onClick={handleLink} />
      </div>

      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full flex-1 p-4 bg-transparent border-none focus:ring-0 text-neutral-900 resize-none text-sm leading-relaxed placeholder:text-neutral-400"
      />
    </div>
  );
}
