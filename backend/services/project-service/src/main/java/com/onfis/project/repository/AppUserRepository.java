package com.onfis.project.repository;

import com.onfis.project.entity.AppUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUserEntity, UUID> {
    Optional<AppUserEntity> findByIdAndTenantId(UUID id, UUID tenantId);
    List<AppUserEntity> findByTenantIdOrderByFirstNameAsc(UUID tenantId);
}
