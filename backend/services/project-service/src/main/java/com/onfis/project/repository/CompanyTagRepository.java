package com.onfis.project.repository;

import com.onfis.project.entity.CompanyTagEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface CompanyTagRepository extends JpaRepository<CompanyTagEntity, UUID> {

    List<CompanyTagEntity> findByTenantIdOrderByNameAsc(UUID tenantId);

    Optional<CompanyTagEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndNormalizedName(UUID tenantId, String normalizedName);

    boolean existsByTenantIdAndNormalizedNameAndIdNot(UUID tenantId, String normalizedName, UUID id);

    List<CompanyTagEntity> findByTenantIdAndNormalizedNameIn(UUID tenantId, Set<String> normalizedNames);
}
