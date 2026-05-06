package com.onfis.project.repository;

import com.onfis.project.entity.AttachmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, UUID> {

    List<AttachmentEntity> findByTenantIdAndTaskIdAndType(UUID tenantId, UUID taskId, String type);

    List<AttachmentEntity> findByTenantIdAndProjectId(UUID tenantId, UUID projectId);
}
