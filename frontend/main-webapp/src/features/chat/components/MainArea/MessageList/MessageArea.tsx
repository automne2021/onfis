import { useEffect, useRef } from 'react';
import type { ChatChannel, ChatMessage } from '../../../types/chatTypes';
import { useAuth } from '../../../../../hooks/useAuth';
import { DateSeparator } from './DateSeparator';
import { MessageBubble } from './MessageBubble';
// import { MeetingCard } from './MeetingCard';
// import { CallRoomModal } from '../../Modal/CallRoomModal';
import { useCall } from '../../../context/CallContext';

interface MessageAreaProps {
  channel?: ChatChannel | null;
  messages: ChatMessage[];
}

export function MessageArea({ channel, messages }: MessageAreaProps) {
  const { user } = useAuth();
  const { startLiveKit } = useCall()

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const [callToken, setCallToken] = useState<string | null>(null);
  // const [roomName, setRoomName] = useState<string>("");

  // const handleOpenCall = (token: string, room: string) => {
  //   setCallToken(token);
  //   setRoomName(room);
  // };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderEmptyState = () => {
    if (!channel || messages.length > 0) return null;
    const messageText = channel.type === 'direct' 
      ? `This is the beginning of your direct message history with ${channel.name}.`
      : channel.type === 'self'
      ? `This is your space. Draft messages, list your to-dos, or keep links and files handy.`
      : `This is the beginning of the ${channel.name} channel.`;

    return (
      <div className="w-full text-center py-10 px-4">
        <p className="body-3-regular text-neutral-500">{messageText}</p>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 bg-neutral-50 custom-scrollbar">
      <div className="flex flex-col justify-end min-h-full gap-3">
        {renderEmptyState()}
        {messages.map((msg) => {
          const isOwn = msg.sender.id === user?.id;
          
          return (
            <div key={msg.id} className="flex flex-col w-full">
              {msg.dateSeparator && <DateSeparator date={msg.dateSeparator} />}
              {/* {msg.type === 'meeting' ? (
                <MeetingCard 
                    msg={msg} 
                    onJoin={(token, room) => startLiveKit(token, room)} 
                />
              ) : (
                <MessageBubble msg={msg} isOwn={isOwn} />
              )} */}
              <MessageBubble msg={msg} isOwn={isOwn} onJoinCall={startLiveKit} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* {callToken && (
        <CallRoomModal 
          token={callToken} 
          roomName={roomName}
          onDisconnect={() => setCallToken(null)} 
        />
      )} */}
    </div>
  );
}