import { useEditor, EditorContent } from '@tiptap/react'

import { StarterKit } from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import { TextSelection } from '@tiptap/pm/state'

import { 
  FormatBold, FormatItalic, FormatUnderlined,
  FormatListBulleted, FormatListNumbered, 
  FormatColorText, FormatColorFill, FormatSize,
  InsertLink,
  KeyboardArrowDown, 
} from '@mui/icons-material'
import { ToolbarButton } from './ToolbarButton'
import { useRef, useState } from 'react'
import { LinkModal } from './LinkModal'

interface RichTextEditorProps {
  limit?: number
  onChange: (html: string) => void
  initialContent?: string
}

export function RichTextEditor({ limit = 5000, onChange, initialContent = '' } : RichTextEditorProps) {

  // useState
  const [_, setUpdateTick] = useState(0)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [selectedHighlight, setSelectedHighlight] = useState('#ffec3d')
  const [isFocused, setIsFocused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ text: '', url: '' });

  // useRef
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit, TextStyle, Color, 
      Highlight.configure({ multicolor: true }), 
      Placeholder.configure({
        placeholder: 'Enter message content...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: limit,
      }),
      Link.configure({
        openOnClick: false,           // To open: Ctrl + Click instead of only click
        autolink: true,               // Automatically recognize link when typing
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-blue-500 underline hover:text-blue-700',
          target: '_blank',           // Always open on new tab
          rel: 'noopener noreferrer'  // Security when open new tab
        }

      })
    ],
    content: initialContent,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onTransaction: () => {
      setUpdateTick(tick => tick + 1);

      // For text color
      const activeColor = editor.getAttributes('textStyle').color
      if (activeColor) {
        setSelectedColor(activeColor)
      } else if (!editor.isEmpty) {
        setSelectedColor('#000000')
      }

      // For Highlight
      const activeHighlight = editor.getAttributes('highlight').color;
      if (activeHighlight) {
        setSelectedHighlight(activeHighlight)
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML() // Lấy nội dung dưới dạng HTML
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none w-full break-words focus:outline-none min-h-[150px] p-4 text-neutral-900`,
      },
      // --- XỬ LÝ CLICK VÀO LINK ---
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement;
          const link = target.closest('a');

          if (link) {
            const url = link.getAttribute('href');
            if (event.ctrlKey || event.metaKey) {
              if (url) {
                window.open(url, '_blank');
              }
              return true; 
            }

            event.preventDefault();
            event.stopPropagation(); 
            
            const text = link.textContent || '';
            const currentUrl = url || '';

            const pos = view.posAtDOM(link, 0);
            const { tr } = view.state;
            tr.setSelection(TextSelection.near(view.state.doc.resolve(pos)));
            view.dispatch(tr);

            // Mở Modal
            setModalData({ text, url: currentUrl });
            setModalOpen(true);
            
            return true; 
          }
          return false; 
        }
      }
    },
  })

  if (!editor) return null

  const isActive = isFocused || editor.getText().trim().length > 0;

  // --- Functions ---
  // Handle color + highlight
  const handleColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor); 
    editor.chain().focus().setColor(newColor).run(); 
  }

  const handleHighlightPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedHighlight(newColor);
    editor.chain().focus().setHighlight({ color: newColor }).run();
  }

  const applyCurrentColor = () => {
    editor.chain().focus().setColor(selectedColor).run();
  }
  
  const applyCurrentHighlight = () => {
    editor.chain().focus().setHighlight({ color: selectedHighlight }).run();
  }

  // Handle Link 
  const handleToolbarLinkClick = () => {
    const currentUrl = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    setModalData({
      text: selectedText,
      url: currentUrl
    });
    setModalOpen(true);
  };

  const handleSaveLink = (textLabel: string, url: string) => {
    // Nếu URL rỗng -> Unset link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setModalOpen(false)
      return
    }

    // Logic insert/update link
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .insertContent({
        type: 'text',
        text: textLabel,
        marks: [
          {
            type: 'link',
            attrs: {
              href: url,
              target: '_blank',
            },
          },
        ],
      })
      .setLink({ href: url })
      .run();

    setModalOpen(false);
  };

  return(
    <div className={`rounded-lg overflow-y-auto overflow-x-hidden border focus-within:border-primary transition-all border-neutral-200
      ${isActive ? 'bg-white' : 'bg-neutral-50'}
    `}>
      <div className='flex flex-wrap items-center gap-1 px-2 py-1 border-b border-neutral-200 bg-neutral-50'>

        {/* Bold, Italic, Underline */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={<FormatBold fontSize="small" />}
        />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={<FormatItalic fontSize="small" />}
        />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={<FormatUnderlined fontSize="small" />}
        />

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        {/* --- Text color --- */}
        <div className="relative flex items-center gap-0.5">
          <ToolbarButton 
            onClick={applyCurrentColor}
            isActive={editor.isActive('textStyle')}
            icon={
              <div className="relative flex flex-col items-center">
                <FormatColorText fontSize="small" />
                <div className="absolute bottom-0 w-5 h-1 transition" style={{ backgroundColor: selectedColor }} />
              </div>
            }
          />
          
          <button
            type='button'
            onClick={() => colorInputRef.current?.click()}
            className="text-neutral-500 hover:bg-neutral-200 rounded p-0.5 flex items-center justify-center transition"
             title="Choose text color"
          >
             <KeyboardArrowDown style={{ fontSize: 16 }} />
          </button>

          <input 
            ref={colorInputRef}
            type="color"
            className="absolute top-0 right-0 invisible"
            onChange={handleColorPick}
          />
        </div>

        {/* Highlight Color Picker */}
        <div className="relative flex items-center gap-0.5">
          <ToolbarButton 
            onClick={applyCurrentHighlight}
            isActive={editor.isActive('highlight')}
            icon={
              <div className="relative flex flex-col items-center">
                <FormatColorFill fontSize="small" />
                <div className="absolute bottom-0 w-5 h-1 transition" style={{ backgroundColor: selectedHighlight }} />
              </div>
            }
          />

          <button
            type='button'
            onClick={() => highlightInputRef.current?.click()}
            className="text-neutral-500 hover:bg-neutral-200 rounded p-0.5 flex items-center justify-center transition"
            title="Choose highlight color"
          >
             <KeyboardArrowDown style={{ fontSize: 16 }} />
          </button>

          <input 
            ref={highlightInputRef}
            type="color"
            className="absolute top-0 right-0 invisible"
            onChange={handleHighlightPick}
          />
        </div>
        
        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={<FormatSize fontSize="small" />}
        />

        {/* List */}
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={<FormatListBulleted fontSize="small" />}
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={<FormatListNumbered fontSize="small" />}
        />

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        {/* Link */}
        <div className="relative">
          <ToolbarButton 
            onClick={handleToolbarLinkClick}
            isActive={editor.isActive('link')}
            icon={<InsertLink fontSize="small" />}
          />

          {/* Đặt Modal ngay tại đây */}
          {modalOpen && (
            <div className="absolute top-full right-0 mt-2 z-50">
              <LinkModal 
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveLink}
                initialText={modalData.text}
                initialUrl={modalData.url}
              />
            </div>
          )}
        </div>
      </div>

      <EditorContent editor={editor} className='flex-1 body-3-regular'/>
      {/* Count number of characters */}
      <div className={`px-3 py-2 text-xs text-neutral-500 flex justify-end items-center border-t transition
        ${isActive ? 'bg-white' : 'bg-neutral-50'}
      `}>
        <span className={editor.storage.characterCount.characters() === limit ? 'text-red-500 body-4-regular' : ''}>
          {editor.storage.characterCount.characters()}
        </span>
        <span className="mx-1">/</span>
        <span>{limit} characters</span>
      </div>
    </div>
  )
}