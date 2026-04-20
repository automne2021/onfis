package com.onfis.announcement.repository;

import com.onfis.announcement.entity.Announcement;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

  // Lấy tất cả thông báo của một công ty 
  Page<Announcement> findByTenantId(UUID tenantId, Pageable pageable);

  Page<Announcement> findByTenantIdAndIsPinnedTrue(UUID tenantId, Pageable pageable);

  Page<Announcement> findByTenantIdAndTargetDepartmentIdIsNull(UUID tenantId, Pageable pageable);

  Page<Announcement> findByTenantIdAndTargetDepartmentId(UUID tenantId, UUID targetDepartmentId, Pageable pageable);

  Page<Announcement> findByTenantIdAndTitleContainingIgnoreCase(UUID tenantId, String title, Pageable pageable);
}