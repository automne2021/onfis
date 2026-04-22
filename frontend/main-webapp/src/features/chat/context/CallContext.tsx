import React, { createContext, useContext, useState } from 'react';
import { CallRoomModal } from '../components/Modal/CallRoomModal';
import { IncomingCallModal } from '../components/Modal/IncomingCallModal';
import { chatApi } from '../services/chatApi';

interface IncomingCall {
  meetingId: string;
  callerName: string;
  isVideo: boolean;
  avatarUrl?: string;
}

interface CallContextType {
  startLiveKit: (token: string, roomName: string, meetingId: string, isHost: boolean, isVideo: boolean, avatarUrl?: string, name?: string) => void;
  triggerIncomingCall: (call: IncomingCall) => void;
  forceTerminate: (meetingId: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const [callToken, setCallToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  
  const [activeMeeting, setActiveMeeting] = useState<{ id: string; isHost: boolean; isVideo: boolean; avatarUrl?: string; name?: string } | null>(null);

  const forceTerminate = (id: string) => {
    if (activeMeeting?.id === id) {
      setCallToken(null);
      setRoomName("");
      setActiveMeeting(null);
    }
  };

  const startLiveKit = (token: string, room: string, meetingId: string, isHost: boolean, isVideo: boolean, avatarUrl?: string, name?: string) => {
    setCallToken(token);
    setRoomName(room);
    setActiveMeeting({ id: meetingId, isHost, isVideo, avatarUrl, name });
    setIncomingCall(null);
  };

  const triggerIncomingCall = (call: IncomingCall) => {
    if (!callToken) setIncomingCall(call);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const data = await chatApi.joinMeeting(incomingCall.meetingId);
      startLiveKit(data.token, data.roomName, incomingCall.meetingId, false, incomingCall.isVideo, incomingCall.avatarUrl, incomingCall.callerName);
    } catch (error) { console.error(error); }
  };

  const handleDisconnect = async () => {
    if (activeMeeting?.isHost) {
      try {
        await chatApi.endMeeting(activeMeeting.id); 
      } catch (err) {
        console.error("Lỗi khi end meeting", err);
      }
    }
    setCallToken(null);
    setRoomName("");
    setActiveMeeting(null);
  };

  return (
    <CallContext.Provider value={{ startLiveKit, triggerIncomingCall, forceTerminate }}>
      {children}
      {callToken && activeMeeting && (
        <CallRoomModal
          token={callToken}
          roomName={roomName}
          isVideo={activeMeeting.isVideo}
          avatarUrl={activeMeeting.avatarUrl} 
          callerName={activeMeeting.name}     
          onDisconnect={handleDisconnect}
        />
      )}
      {incomingCall && !callToken && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          isVideo={incomingCall.isVideo}
          onAccept={acceptCall}
          onDecline={() => setIncomingCall(null)}
        />
      )}
    </CallContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};