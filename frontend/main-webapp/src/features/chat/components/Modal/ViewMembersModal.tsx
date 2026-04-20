import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { chatApi } from '../../services/chatApi';
import { createPortal } from 'react-dom';

interface MemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export function ViewMembersModal({ isOpen, onClose, conversationId }: { isOpen: boolean, onClose: () => void, conversationId: string }) {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true; 
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const data = await chatApi.getConversationMembers(conversationId);
        if (isMounted) setMembers(data);
      } catch (error) {
        console.error("Loading members error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isOpen && conversationId) {
      fetchMembers();
    }

    return () => {
      isMounted = false; 
    };
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-neutral-900">
            Channel Members {members.length > 0 && !loading ? `(${members.length})` : ''}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0" />
                <div className="flex flex-col gap-1 w-full">
                  <div className="h-3.5 bg-neutral-200 rounded w-1/2" />
                  <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : members.length > 0 ? (
            members.map(m => {
              const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim();
              return (
                <div key={m.id} className="flex items-center gap-3 p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-50 transition-colors">
                  <img 
                    src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`} 
                    alt={fullName}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-200" 
                  />
                  <span className="body-3-regular text-neutral-900 truncate">{fullName}</span>
                </div>
              );
            })
          ) : (
            <div className="body-3-medium text-neutral-500 text-center py-4">
              No members found.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}