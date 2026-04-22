package com.onfis.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "meetings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meetings {
  
  @Id
  @GeneratedValue(strategy = GenerationType.UUID) 
  @Column(name = "id")
  private UUID id;

  @Column(name = "tenant_id")
  private UUID tenantId;

  @Column(name = "conversation_id")
  private UUID conversationId;

  @Column(name = "title")
  private String title;

  @Column(name = "type")
  private String type;

  @Column(name = "status")
  private String status;

  @Column(name = "start_time")
  private ZonedDateTime startTime;

  @Column(name = "end_time")
  private ZonedDateTime endTime;

  @Column(name = "meeting_link")
  private String meetingLink;

  @org.hibernate.annotations.CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "host_id")
  private UUID hostId;
}