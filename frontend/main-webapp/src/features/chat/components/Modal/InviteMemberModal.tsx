import { useState, useEffect } from 'react';
import { X, Search, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '../../../../components/common/Buttons/Button';
import { chatApi } from '../../services/chatApi';
import api from '../../../../services/api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  channelName: string;
  onSuccess?: () => void;
}

interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export function InviteMemberModal({ isOpen, onClose, conversationId, channelName, onSuccess }: InviteMemberModalProps) {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State cho Toaster cảnh báo
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoading(true);
        try {
          const res = await api.get('/users');
          setUsers(res.data);
        } catch (e) { console.error(e); }
        setIsLoading(false);
      };
      fetchUsers();
    } else {
      setSearchQuery('');
      setToastMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddMember = async (userId: string) => {
    setIsSubmitting(true);
    setToastMessage(null);
    try {
      await chatApi.addMemberToGroup(conversationId, userId);
      setToastMessage({ type: 'success', text: 'Member added successfully!' });
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1500); 
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response && err.response.status === 400) {
        setToastMessage({ type: 'error', text: 'This person is already in the group!' });
      } else {
        setToastMessage({ type: 'error', text: 'An error occurred while adding the member.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {toastMessage && (
          <div className={`p-3 body-4-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-full duration-300 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {toastMessage.type === 'error' && <AlertCircle size={16} />}
            {toastMessage.text}
          </div>
        )}

        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-lg font-semibold text-neutral-900">Invite to #{channelName}</h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full h-10 pl-9 pr-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto custom-scrollbar border border-neutral-100 rounded-lg p-1">
          {isLoading ? (
            <div className="p-4 flex justify-center text-neutral-400"><Loader2 className="animate-spin" size={18}/></div>
          ) : filteredUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3">
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName)}&background=random`} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-900">{user.firstName} {user.lastName}</span>
                  <span className="text-[11px] text-neutral-500">{user.email}</span>
                </div>
              </div>
              <Button 
                style="sub" border={true} 
                onClick={() => handleAddMember(user.id)}
                disabled={isSubmitting}
                iconLeft={<UserPlus size={14}/>}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}