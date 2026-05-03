package com.onfis.announcement.repository;

import com.onfis.announcement.entity.AnnouncementLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementLikeRepository extends JpaRepository<AnnouncementLike, UUID> {
    
    long countByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);
    
    boolean existsByTenantIdAndAnnouncementIdAndUserId(UUID tenantId, UUID announcementId, UUID userId);

    void deleteByTenantIdAndAnnouncementIdAndUserId(UUID tenantId, UUID announcementId, UUID userId);
    
    List<AnnouncementLike> findByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);

    void deleteByTenantIdAndAnnouncementId(UUID tenantId, UUID announcementId);
}