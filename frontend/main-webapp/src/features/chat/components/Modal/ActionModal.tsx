import { createPortal } from 'react-dom'; 
import { Button } from "../../../../components/common/Buttons/Button";
import type { ActionModalState } from "../../types/chatTypes";

interface ActionModalProps {
  actionModal: ActionModalState;
  newChannelName: string;
  setNewChannelName: (value: string) => void;
  setActionModal: (state: ActionModalState) => void;
  isActionLoading: boolean;
  handleActionSubmit: () => void;
}

export function ActionModal({ 
  actionModal, 
  newChannelName, 
  setNewChannelName,
  setActionModal,
  isActionLoading,
  handleActionSubmit
} : ActionModalProps) {
  
  if (!actionModal.type) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={() => !isActionLoading && setActionModal({ type: null, channelId: '', channelName: '' })} 
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          {actionModal.type === 'rename' ? 'Rename Channel' : 'Delete Channel'}
        </h2>
        
        <p className="text-sm text-neutral-500 mb-4">
          {actionModal.type === 'rename' 
            ? `Enter a new name for #${actionModal.channelName}.`
            : `Are you absolutely sure you want to delete #${actionModal.channelName}? This action cannot be undone and all messages will be lost.`
          }
        </p>

        {actionModal.type === 'rename' && (
          <div className="relative flex items-center mb-4">
            <span className="absolute left-3 text-neutral-400 font-medium">#</span>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="new-channel-name"
              className="w-full h-11 pl-7 pr-3 border border-neutral-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleActionSubmit()}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-2">
          <Button 
            style="sub" 
            onClick={() => setActionModal({ type: null, channelId: '', channelName: '' })} 
            disabled={isActionLoading} 
            border={false}
          >
            Cancel
          </Button>
          
          <Button 
            style={actionModal.type === 'delete' ? 'danger' : 'primary'} 
            onClick={handleActionSubmit} 
            disabled={isActionLoading || (actionModal.type === 'rename' && !newChannelName.trim())}
          >
            {isActionLoading ? 'Processing...' : actionModal.type === 'rename' ? 'Save Changes' : 'Yes, Delete'}
          </Button>
        </div>
      </div>
    </div>,
    document.body // Đích đến của Portal
  );
}