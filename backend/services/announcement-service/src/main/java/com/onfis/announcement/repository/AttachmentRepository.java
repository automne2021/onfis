package com.onfis.announcement.repository;

import com.onfis.announcement.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);

    void deleteByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);
}