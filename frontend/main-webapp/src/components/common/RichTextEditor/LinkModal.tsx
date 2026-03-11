import { useState } from 'react';
import { Button } from '../Buttons/Button';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, url: string) => void;
  initialText?: string;
  initialUrl?: string;
}

interface CustomInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

const CustomInput = ({ value, onChange, placeholder, autoFocus = false }: CustomInputProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="text"
        className="w-full px-3 py-2 body-4-regular border border-neutral-300 rounded-lg focus:outline-none focus:border-primary transition-all"
        placeholder={placeholder}
        value={value}
        // Sửa logic onChange để trả về string trực tiếp cho gọn
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export function LinkModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialText = '', 
  initialUrl = '' 
}: LinkModalProps) {
  
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    // Nếu người dùng không nhập Text, tự động lấy URL làm Text
    const textToSave = text.trim() === '' ? url : text;
    onSave(textToSave, url);
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-2xl w-[300px] border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()} // Ngăn click vào modal bị đóng
      >
        <div className="p-4 flex flex-col gap-3">
          <CustomInput 
            placeholder="Text to display"
            value={text}       
            onChange={setText} 
            autoFocus={false}
          />

          <CustomInput 
            placeholder="Paste URL"
            value={url}
            onChange={setUrl}
            autoFocus={true}
          />
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-2 bg-white flex justify-end gap-2">
          <Button
            title='Cancel'
            onClick={onClose}
            style='sub'
            textStyle='body-4-medium'
          />
          <Button
            title='Apply'
            onClick={handleSave}
            style='primary'
            textStyle='body-4-medium'
          />
        </div>
      </div>
    </>
  );
}