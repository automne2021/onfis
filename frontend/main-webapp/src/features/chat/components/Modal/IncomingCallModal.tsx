import { Phone, Video, PhoneOff } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  isVideo: boolean;
  avatarUrl?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({ callerName, isVideo, avatarUrl, onAccept, onDecline }: IncomingCallModalProps) {  
  return (
    <div className="fixed top-6 right-6 z-[9999] bg-neutral-900 text-white w-80 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-top-10 fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
          {avatarUrl ? (
            <img src={avatarUrl} alt="caller" className="w-full h-full object-cover" />
          ) : (
            isVideo ? <Video size={24} /> : <Phone size={24} />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{callerName}</h3>
          <p className="text-neutral-400 text-sm">Incoming {isVideo ? 'video' : 'audio'} call...</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button onClick={onDecline} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 font-medium transition">
          <PhoneOff size={18} /> Decline
        </button>
        <button onClick={onAccept} className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 font-medium transition animate-bounce">
          {isVideo ? <Video size={18} /> : <Phone size={18} />} Accept
        </button>
      </div>
    </div>
  );
}