package com.onfis.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
class ConversationMemberId implements Serializable {
    private UUID conversationId;
    private UUID userId;
}

@Entity
@Table(name = "conversation_members")
@IdClass(ConversationMemberId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMember {

    @Id
    @Column(name = "conversation_id")
    private UUID conversationId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "role") // ADMIN, MEMBER
    private String role;

    @Column(name = "joined_at")
    private ZonedDateTime joinedAt;

    @Column(name = "read_at")
    private ZonedDateTime readAt;
}