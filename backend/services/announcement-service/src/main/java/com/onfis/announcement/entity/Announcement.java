package com.onfis.announcement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Data
@Builder            
@NoArgsConstructor   
@AllArgsConstructor
@Entity
@Table(name = "announcements")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@EntityListeners(AuditingEntityListener.class)
public class Announcement {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "tenant_id")
  private UUID tenantId;

  private String title;

  @Column(columnDefinition = "TEXT")
  private String content;

  @Column(name = "is_pinned")
  private boolean isPinned;

  @Column(name = "author_id")
  private UUID authorId;

  @CreatedDate
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "target_department_id")
  private UUID targetDepartmentId; // NULL = Toàn công ty, UUID = Phòng ban cụ thể

  @Column(name = "status")
  private String status;
}
