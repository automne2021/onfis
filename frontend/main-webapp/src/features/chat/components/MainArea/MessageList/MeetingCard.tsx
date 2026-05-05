import { Video, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ChatMessage } from "../../../types/chatTypes";
import { Button } from '../../../../../components/common/Buttons/Button';
import { chatApi } from '../../../services/chatApi';
import { useCall } from '../../../context/CallContext';

interface MeetingCardProps {
  msg: ChatMessage;
}

type MeetingInfo = NonNullable<ChatMessage['meeting']>;

export function MeetingCard({ msg } : MeetingCardProps) {

  const { startLiveKit } = useCall();

  const [meeting, setMeeting] = useState<MeetingInfo | null>(msg.meeting || null);
  const [isLoading, setIsLoading] = useState(!msg.meeting); 
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Kiểm tra xem content có phải là UUID hợp lệ không (UUID chuẩn dài 36 ký tự)
    const isValidId = msg.content && msg.content.length >= 32;

    if (!msg.meeting && isValidId) {
      chatApi.getMeeting(msg.content)
        .then((data: MeetingInfo) => { 
          if (isMounted) setMeeting(data);
        })
        .catch((_err) => {
          console.warn("Meeting not found in DB. Marking as ENDED.");
          if (isMounted) {
            setMeeting({
              id: msg.content,
              hostId: msg.sender?.id || '',
              type: 'VIDEO',
              status: 'ENDED',
            } as MeetingInfo); 
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
        
    } else if (msg.meeting) {
      setMeeting(msg.meeting);
      setIsLoading(false);
      
    } else {
      if (isMounted) {
        setMeeting({
          id: 'old_meeting_fallback',
          hostId: msg.sender?.id || '', 
          type: 'VIDEO',
          status: 'ENDED'
        } as MeetingInfo); 
        setIsLoading(false); 
      }
    }
    
    return () => { isMounted = false };
  }, [msg]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (isLoading) return <div className="p-4 text-sm text-neutral-500 animate-pulse">Loading meeting status...</div>;
  if (!meeting) return <div className="p-4 text-sm text-red-500 italic">Call ended or unavailable.</div>;

  const isEnded = meeting.status === 'ENDED';
  const isVideo = meeting.type === 'VIDEO';
  
  const handleJoinClick = async () => {
    if (isEnded) return;
    
    setIsLoading(true);
    setToastMessage(null);
    try {
      // Gọi API lấy token
      const data = await chatApi.joinMeeting(meeting.id);
      
      // 4. Áp dụng logic Y HỆT như acceptCall trong CallContext
      startLiveKit(
        data.token, 
        data.roomName, 
        meeting.id, 
        false, // isHost = false vì mình là người bấm join
        meeting.type === 'VIDEO', 
        msg.sender?.avatarUrl, 
        msg.sender?.name
      );
      
    } catch (error) { 
      console.error("Lỗi Join Meeting:", error);
      setToastMessage("Cannot join. The meeting might have ended or you lack permission.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center bg-white">
      {toastMessage && (
        <div className="absolute -top-10 z-10 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-md text-xs animate-in fade-in">
          <AlertCircle size={14} /> {toastMessage}
        </div>
      )}

      <div className={`w-[260px] p-5 flex flex-col items-center transition-all ${isEnded ? 'opacity-70' : ''}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isEnded ? 'bg-neutral-200 text-neutral-500' : 'bg-primary/10 text-primary'}`}>
          {isVideo ? <Video size={24} /> : <Phone size={24} />}
        </div>
        
        <p className="font-semibold text-neutral-900 mb-3 text-center text-sm">
          {isVideo ? 'Video Meeting' : 'Audio Meeting'}
        </p>

        <div className={`flex items-center gap-2 font-medium mb-5 uppercase tracking-wider text-[10px] ${isEnded ? 'text-neutral-400' : 'text-green-500'}`}>
          <span className={`w-2 h-2 rounded-full ${isEnded ? 'bg-neutral-400' : 'bg-green-500 animate-pulse'}`} />
          {isEnded ? 'ENDED CALL' : 'ONGOING CALL'}
        </div>

        <Button
          id="join-meeting"
          title={isEnded ? "Call Ended" : (isLoading ? "Joining..." : "Join meeting")}
          onClick={handleJoinClick}
          style={isEnded ? 'sub' : 'primary'}
          type="button"
          width='w-full'
          disabled={isEnded || isLoading}
          iconLeft={isLoading ? <Loader2 className="animate-spin" size={16} /> : undefined}
        />
      </div>
    </div>
  );
}