package com.onfis.announcement.repository;

import com.onfis.announcement.entity.Announcement;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

  // Lấy tất cả thông báo của một công ty 
  Page<Announcement> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);
    Page<Announcement> findByTenantIdAndIsPinnedTrueAndStatus(UUID tenantId, String status, Pageable pageable);
    Page<Announcement> findByTenantIdAndTargetDepartmentIdIsNullAndStatus(UUID tenantId, String status, Pageable pageable);
    Page<Announcement> findByTenantIdAndTargetDepartmentIdAndStatus(UUID tenantId, UUID departmentId, String status, Pageable pageable);
    Page<Announcement> findByTenantIdAndTitleContainingIgnoreCaseAndStatus(UUID tenantId, String keyword, String status, Pageable pageable);

  Optional<Announcement> findFirstByTenantIdAndAuthorIdAndStatusOrderByCreatedAtDesc(UUID tenantId, UUID authorId, String status);
}