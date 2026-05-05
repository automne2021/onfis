import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer, 
  ControlBar, 
  Chat, 
  LayoutContextProvider, 
  useLayoutContext 
} from '@livekit/components-react';
import '@livekit/components-styles'; 
import { User } from 'lucide-react';

interface CallRoomModalProps {
  token: string;
  roomName: string;
  isVideo: boolean;
  avatarUrl?: string;
  callerName?: string;
  onDisconnect: () => void;
}

export function CallRoomModal({ token, roomName, isVideo, avatarUrl, callerName, onDisconnect }: CallRoomModalProps) {
  if (!token) return null;

  const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL || "wss://onfis-hzzdnptp.livekit.cloud";

  return (
    <div className="fixed inset-0 z-[9999] bg-[#111] flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black/50 text-white absolute top-0 w-full z-10">
        <h2 className="font-semibold text-lg">Meeting Room - {roomName}</h2>
      </div>

      <LiveKitRoom
        video={isVideo}
        audio={true} 
        token={token}
        serverUrl={liveKitUrl}
        data-lk-theme="default"
        onDisconnected={onDisconnect}
        className="flex-1 w-full h-full pt-16 flex justify-center"
      >
        {isVideo ? (
          <VideoConference />
        ) : (
          <LayoutContextProvider>
            <AudioCallLayout avatarUrl={avatarUrl} callerName={callerName} />
          </LayoutContextProvider>
        )}

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function AudioCallLayout({ avatarUrl, callerName }: { avatarUrl?: string, callerName?: string }) {
  const layoutContext = useLayoutContext();
  const showChat = layoutContext?.widget?.state?.showChat ?? false;

  return (
    <div className="flex-1 flex w-full h-full">
      {/* CỘT TRÁI: Giao diện Avatar */}
      <div className="flex-1 flex flex-col items-center justify-between relative">
        <div className='flex-1 w-full flex flex-col items-center justify-center'>
          <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-pulse overflow-hidden border-4 border-neutral-700">
            {avatarUrl ? (
              <img src={avatarUrl} alt={callerName} className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-neutral-500" />
            )}
          </div>
          
          <p className="text-white text-xl font-medium mb-12">
            {callerName ? callerName : 'Audio Call in progress...'}
          </p>
        </div>
        
        <div className="pb-8 w-full z-10">
            <ControlBar controls={{ microphone: true, camera: false, screenShare: true, leave: true, chat: true }} />
        </div>
      </div>

      {showChat && (
        <div className="w-80 bg-[#191919] border-l border-neutral-800 flex flex-col animate-in slide-in-from-right-10 duration-200">
          <Chat />
        </div>
      )}
    </div>
  );
}