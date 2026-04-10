package com.onfis.position.repository;

import com.onfis.position.entity.AppUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUserEntity, UUID> {

    List<AppUserEntity> findByTenantId(UUID tenantId);

    List<AppUserEntity> findByPositionId(UUID positionId);

    List<AppUserEntity> findByTenantIdAndPositionIdIsNull(UUID tenantId);

    List<AppUserEntity> findByTenantIdAndPositionId(UUID tenantId, UUID positionId);
}
