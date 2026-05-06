import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer, 
  ControlBar, 
  Chat, 
  LayoutContextProvider, 
  useLayoutContext,
  GridLayout,
  ParticipantTile,
  useParticipantContext,
  type ParticipantTileProps,
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

interface CallRoomModalProps {
  token: string;
  roomName: string;
  isVideo: boolean;
  onDisconnect: () => void;
}

export function CallRoomModal({ token, roomName, isVideo, onDisconnect }: CallRoomModalProps) {
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
            <AudioConferenceLayout />
          </LayoutContextProvider>
        )}

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function AudioConferenceLayout() {
  const layoutContext = useLayoutContext();
  const showChat = layoutContext?.widget?.state?.showChat ?? false;

  const tracks = useTracks(
    [
      { source: Track.Source.Microphone, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="flex-1 flex w-full h-full">
      <div className="flex-1 flex flex-col items-center justify-between relative">
        
        <div className='flex-1 w-full p-4'>
          <GridLayout tracks={tracks} style={{ height: '100%' }}>
            <CustomParticipantTile />
          </GridLayout>
        </div>
        
        <div className="pb-8 w-full z-10 flex justify-center">
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

function CustomParticipantTile(props: ParticipantTileProps) {
  return (
    <ParticipantTile {...props}>
      <TileOverlay isScreenShare={props.trackRef?.source === Track.Source.ScreenShare} />
    </ParticipantTile>
  );
}

// ================================
// COMPONENT LỚP PHỦ (TỰ ĐỘNG CẬP NHẬT TÊN & HIỆU ỨNG LOADING)
// ================================
function TileOverlay({ isScreenShare }: { isScreenShare: boolean }) {
  const participant = useParticipantContext();
  
  // LiveKit đang đồng bộ data từ Server về
  const name = participant?.name;
  const identity = participant?.identity;
  
  // Trạng thái "Đang chờ dữ liệu" (chưa có cả tên lẫn ID)
  const isSyncing = !name && !identity;
  
  // Tên hiển thị cuối cùng
  const displayName = name || identity || 'Unknown';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128&bold=true`;

  return (
    <>
      {!isScreenShare && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {isSyncing ? (
            <div className="w-24 h-24 rounded-full bg-neutral-800 animate-pulse shadow-xl border-4 border-neutral-700 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-neutral-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-24 h-24 rounded-full shadow-xl border-4 border-neutral-700 object-cover animate-in zoom-in duration-200"
            />
          )}
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-10">
        {isSyncing ? (
          <div className="h-7 w-24 bg-neutral-800/80 animate-pulse rounded-md"></div>
        ) : (
          <div className="bg-black/70 px-2.5 py-1 rounded-md text-white text-sm font-medium shadow animate-in fade-in duration-200">
            {displayName}
          </div>
        )}
      </div>

      <style>{`
        .lk-participant-name { display: none !important; }
        .lk-participant-tile { background-color: #1e1e1e !important; }
      `}</style>
    </>
  );
}