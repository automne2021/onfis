import React, { useState, useEffect } from 'react';
import { X, Hash, Lock, Search, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/common/Buttons/Button';
import api from '../../../../services/api'; 
import { useAuth } from '../../../../hooks/useAuth';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; type: 'public_group' | 'private_group'; memberIds: string[] }) => Promise<void> | void; 
}

interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const [companyUsers, setCompanyUsers] = useState<UserDTO[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // 1. Gọi API lấy danh sách User khi mở Modal
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const response = await api.get('/users'); 
          setCompanyUsers(response.data);
        } catch (error) {
          console.error("Lỗi khi tải danh sách nhân viên:", error);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    } else {
      setName('');
      setIsPrivate(false);
      setSearchQuery('');
      setSelectedMembers([]);
      setIsSubmitting(false);
      setToastMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = companyUsers.filter(u => {
    if (user && u.id === user.id) return false;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    if (isPrivate && selectedMembers.length < 2) {
      setToastMessage({ type: 'error', text: 'A private group must have at least 3 members (including you). Please select at least 2 people.' });
      return;
    }

    setToastMessage(null);
    setIsSubmitting(true);
    try {
      const finalMemberIds = isPrivate 
        ? selectedMembers 
        : companyUsers.filter(u => user && u.id !== user.id).map(u => u.id);

      await onSubmit({
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        type: isPrivate ? 'private_group' : 'public_group',
        memberIds: finalMemberIds, 
      });
      onClose();
    } catch (error) {
      const err = error as { response?: { status: number, data: string } };
      if (err.response && err.response.status === 400) {
        setToastMessage({ type: 'error', text: err.response.data || 'A group must have at least 3 members.' });
      } else {
        setToastMessage({ type: 'error', text: 'An error occurred while creating the channel.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

        {toastMessage && (
          <div className={`p-3 z-10 text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-full duration-300 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {toastMessage.type === 'error' && <AlertCircle size={16} />}
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="header-h6 leading-none text-neutral-900">Create a channel</h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form id="create-group-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6 custom-scrollbar">

          <div className="flex flex-col gap-2">
            <label className="body-3-medium text-neutral-900">Name</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-neutral-400">
                {isPrivate ? <Lock size={18} /> : <Hash size={18} />}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. project-alpha"
                className="w-full h-11 pl-10 pr-3 border border-neutral-300 rounded-lg focus:border-primary focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="body-3-medium text-neutral-900">Visibility</label>
            
            <div 
              onClick={() => setIsPrivate(false)}
              className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${!isPrivate ? 'border-primary bg-primary/5' : 'border-neutral-200'}`}
            >
              <Hash size={20} className={!isPrivate ? 'text-primary' : 'text-neutral-500'} />
              <div>
                <p className={`body-3-medium ${!isPrivate ? 'text-primary' : 'text-neutral-900'}`}>Public</p>
                <p className="body-4-regular text-neutral-500">Anyone in your company can find and join.</p>
              </div>
            </div>

            <div 
              onClick={() => setIsPrivate(true)}
              className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isPrivate ? 'border-primary bg-primary/5' : 'border-neutral-200'}`}
            >
              <Lock size={20} className={isPrivate ? 'text-primary' : 'text-neutral-500'} />
              <div>
                <p className={`body-3-medium ${isPrivate ? 'text-primary' : 'text-neutral-900'}`}>Private</p>
                <p className="body-4-regular text-neutral-500">Only specific people you invite can join.</p>
              </div>
            </div>
          </div>

          {isPrivate && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="body-3-medium text-neutral-900">Invite Members</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full h-10 pl-9 pr-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="mt-2 flex flex-col gap-1 max-h-[160px] overflow-y-auto border border-neutral-100 rounded-lg p-1 min-h-[100px]">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center h-full text-neutral-400 gap-2 p-4">
                    <Loader2 className="animate-spin" size={16} /> Loading users...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    const isSelected = selectedMembers.includes(user.id);
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                    const displayAvatar = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

                    return (
                      <div 
                        key={user.id} 
                        onClick={() => toggleMember(user.id)} 
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-neutral-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={displayAvatar} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-neutral-900">{fullName}</span>
                            <span className="text-[11px] text-neutral-500">{user.email}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-neutral-300'}`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-neutral-500">No users found.</div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
          <Button type="button" style="sub" onClick={onClose} border={false}>Cancel</Button>
          <Button type="submit" form="create-group-form" style="primary" disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Channel'}
          </Button>
        </div>
      </div>
    </div>
  );
}