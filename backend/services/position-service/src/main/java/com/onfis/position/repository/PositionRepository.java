package com.onfis.position.repository;

import com.onfis.position.entity.PositionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PositionRepository extends JpaRepository<PositionEntity, UUID> {

    List<PositionEntity> findByTenantId(UUID tenantId);

    Optional<PositionEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    List<PositionEntity> findByTenantIdAndDepartmentId(UUID tenantId, UUID departmentId);

    List<PositionEntity> findByTenantIdAndParentId(UUID tenantId, UUID parentId);

    List<PositionEntity> findByTenantIdAndParentIdIsNull(UUID tenantId);
}
