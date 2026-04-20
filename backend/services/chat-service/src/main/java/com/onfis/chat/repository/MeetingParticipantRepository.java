package com.onfis.chat.repository;

import com.onfis.chat.entity.MeetingParticipants;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipants, UUID> {
    boolean existsByMeetingIdAndUserId(UUID meetingId, UUID userId);
    
}