import { Video } from 'lucide-react';
import type { ChatMessage } from "../../../types/chatTypes";
import { Button } from '../../../../../components/common/Buttons/Button';

interface MeetingCardProps {
  msg: ChatMessage;
}

export function MeetingCard({ msg } : MeetingCardProps) {

  if (!msg.meeting) return null

  return(
    <div className="w-full flex justify-center my-4">
      <div className="w-[360px] bg-white rounded-2xl p-6 flex flex-col items-center shadow-lg">
        <div className="w-12 h-12 bg-secondary text-primary rounded-full flex items-center justify-center mb-6">
          <Video size={24} />
        </div>
        <p className="header-h6 leading-none text-neutral-900 mb-4">
          {msg.meeting.hostName} started a video meeting
        </p>

        <div className="flex items-center gap-2 body-3-regular text-neutral-500 mb-6 uppercase tracking-wider text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {msg.meeting.status} CALL • {msg.meeting.participantsCount} PARTICIPANTS
        </div>

        {/* Join button */}
        <Button
          id="join-meeting"
          title="Join meeting"
          onClick={() => console.log("Start the meeting")}
          style='primary'
          type="button"
          width='w-full'
        />
      </div>
    </div>
  )
}