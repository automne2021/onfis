import { Hash, Lock } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../../components/common/Buttons/Button';
import { chatApi } from '../../services/chatApi';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: { id: string; type: string };
  onUpdate: () => void;
}

export function GroupSettingsModal({ isOpen, onClose, channel, onUpdate }: GroupSettingsModalProps) {
  const [type, setType] = useState(channel?.type);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await chatApi.updateConversation(channel.id, { type });
      onUpdate();
      onClose();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Channel Settings</h2>
        <div className="space-y-3">
          <div 
            onClick={() => setType('public_group')}
            className={`body-3-medium text-neutral-500 p-3 border rounded-xl cursor-pointer flex gap-3 hover:bg-neutral-200/40 transition ${type === 'public_group' ? 'border-primary bg-primary/5 text-primary' : ''}`}
          >
            <Hash size={18} /> <span>Public</span>
          </div>
          <div 
            onClick={() => setType('private_group')}
            className={`body-3-medium text-neutral-500 p-3 border rounded-xl cursor-pointer flex gap-3 hover:bg-neutral-200/40 transition ${type === 'private_group' ? 'border-primary bg-primary/5 text-primary' : ''}`}
          >
            <Lock size={18} /> <span>Private</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button style="sub" onClick={onClose} border={false}>Cancel</Button>
          <Button style="primary" onClick={handleSave} disabled={loading}>Save</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}