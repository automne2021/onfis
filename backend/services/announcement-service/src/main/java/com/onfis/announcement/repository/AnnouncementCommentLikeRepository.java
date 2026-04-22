package com.onfis.announcement.repository;

import com.onfis.announcement.entity.AnnouncementCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface AnnouncementCommentLikeRepository extends JpaRepository<AnnouncementCommentLike, UUID> {
    boolean existsByTenantIdAndCommentIdAndUserId(UUID tenantId, UUID commentId, UUID userId);
    void deleteByTenantIdAndCommentIdAndUserId(UUID tenantId, UUID commentId, UUID userId);
    List<AnnouncementCommentLike> findByTenantIdAndCommentId(UUID tenantId, UUID commentId);
}