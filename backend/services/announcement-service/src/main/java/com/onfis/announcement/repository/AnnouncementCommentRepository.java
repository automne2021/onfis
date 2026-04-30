package com.onfis.announcement.repository;

import com.onfis.announcement.entity.AnnouncementComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementCommentRepository extends JpaRepository<AnnouncementComment, UUID> {
    List<AnnouncementComment> findByTenantIdAndAnnouncementIdOrderByCreatedAtAsc(UUID tenantId, UUID announcementId);

    List<AnnouncementComment> findByTenantIdAndAnnouncementIdAndParentIdIsNullOrderByCreatedAtAsc(UUID tenantId,
            UUID announcementId);

    long countByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);

    List<AnnouncementComment> findByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);

    void deleteByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);
}