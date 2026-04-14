package com.onfis.position.repository;

import com.onfis.position.entity.DepartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<DepartmentEntity, UUID> {

    List<DepartmentEntity> findByTenantId(UUID tenantId);

    Optional<DepartmentEntity> findByIdAndTenantId(UUID id, UUID tenantId);
}
