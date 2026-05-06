package com.onfis.admin.service;

import com.onfis.admin.dto.TenantUpdateRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Handles tenant-level updates (company info, setup status).
 * Only SUPER_ADMIN (leader) is allowed to use this during initial setup.
 */
@Service
@RequiredArgsConstructor
public class TenantService {

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService accessService;

    public Map<String, Object> updateTenant(String tenantIdHeader, String userIdHeader,
            TenantUpdateRequest request) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");

        // Only SUPER_ADMIN (leader) can update tenant info during setup
        accessService.requireSuperAdmin(tenantId, userId);

        if (request.name() != null && !request.name().isBlank()) {
            jdbcTemplate.update("UPDATE tenants SET name = ? WHERE id = ?",
                    request.name().trim(), tenantId);
        }

        if (request.companySize() != null && !request.companySize().isBlank()) {
            jdbcTemplate.update("UPDATE tenants SET company_size = ? WHERE id = ?",
                    request.companySize().trim(), tenantId);
        }

        if (request.logoUrl() != null && !request.logoUrl().isBlank()) {
            jdbcTemplate.update("UPDATE tenants SET logo_url = ? WHERE id = ?",
                    request.logoUrl().trim(), tenantId);
        }

        if (request.setupCompleted() != null) {
            jdbcTemplate.update("UPDATE tenants SET setup_completed = ? WHERE id = ?",
                    request.setupCompleted(), tenantId);
        }

        // Return the updated tenant info
        Map<String, Object> result = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT id, name, company_size, logo_url, setup_completed FROM tenants WHERE id = ? LIMIT 1",
                rs -> {
                    result.put("id", rs.getString("id"));
                    result.put("name", rs.getString("name"));
                    result.put("companySize", rs.getString("company_size"));
                    result.put("logoUrl", rs.getString("logo_url"));
                    result.put("setupCompleted", rs.getBoolean("setup_completed"));
                },
                tenantId);

        return result;
    }
}
