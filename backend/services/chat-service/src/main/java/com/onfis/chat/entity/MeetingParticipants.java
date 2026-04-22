package com.onfis.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "meeting_participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingParticipants {
  @Id
  @Column(name = "meeting_id")
  private UUID meetingId;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "status")
  private String status;

  @Column(name = "role")
  private String role;

  @Column(name = "joined_at")
  private ZonedDateTime joinedAt;

  @Column(name = "left_at")
  private ZonedDateTime leftAt;
}
