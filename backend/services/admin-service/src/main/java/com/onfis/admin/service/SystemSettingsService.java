package com.onfis.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.admin.dto.ModuleSettingsDto;
import com.onfis.admin.dto.OperationalSettingsDto;
import com.onfis.admin.dto.SecuritySettingsDto;
import com.onfis.admin.dto.StorageSettingsDto;
import com.onfis.admin.dto.TenantSettingsDto;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private static final String CACHE_TENANT = "admin:settings:tenant";
    private static final String CACHE_STORAGE = "admin:settings:storage";
    private static final String CACHE_MODULES = "admin:settings:modules";
    private static final String CACHE_SECURITY = "admin:settings:security";
    private static final String CACHE_OPERATIONS = "admin:settings:operations";

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };
    private static final TypeReference<List<Map<String, String>>> MAP_LIST = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final CacheManager cacheManager;
    private final AdminAccessService accessService;
    private final ObjectMapper objectMapper;

    // ─── Tenant Settings ─────────────────────────────────────────────────────

    public TenantSettingsDto getTenantSettings(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Cache cache = cacheManager.getCache(CACHE_TENANT);
        if (cache != null) {
            TenantSettingsDto cached = cache.get(tenantId.toString(), TenantSettingsDto.class);
            if (cached != null)
                return cached;
        }

        TenantSettingsDto result = loadTenantSettings(tenantId);
        if (cache != null)
            cache.put(tenantId.toString(), result);
        return result;
    }

    public TenantSettingsDto updateTenantSettings(
            String tenantIdHeader, String userIdHeader, TenantSettingsDto dto) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        if (dto.name() != null) {
            jdbcTemplate.update("UPDATE tenants SET name = ? WHERE id = ?", dto.name(), tenantId);
        }

        Map<String, String> kvs = new LinkedHashMap<>();
        if (dto.legalName() != null)
            kvs.put("legalName", dto.legalName());
        if (dto.taxCode() != null)
            kvs.put("taxCode", dto.taxCode());
        if (dto.address() != null)
            kvs.put("address", dto.address());
        if (dto.timezone() != null)
            kvs.put("timezone", dto.timezone());
        if (dto.dateFormat() != null)
            kvs.put("dateFormat", dto.dateFormat());
        if (dto.workingDays() != null)
            kvs.put("workingDays", toJson(dto.workingDays()));
        if (dto.publicHolidays() != null)
            kvs.put("publicHolidays", toJson(dto.publicHolidays()));

        upsertSettings(tenantId, "TENANT", kvs, userId);

        Cache cache = cacheManager.getCache(CACHE_TENANT);
        if (cache != null)
            cache.evict(tenantId.toString());
        return loadTenantSettings(tenantId);
    }

    private TenantSettingsDto loadTenantSettings(UUID tenantId) {
        Map<String, Object> tenantRow = jdbcTemplate.query(
                "SELECT id, name, logo_url FROM tenants WHERE id = ? LIMIT 1",
                rs -> rs.next()
                        ? Map.of(
                                "id", rs.getString("id") != null ? rs.getString("id") : tenantId.toString(),
                                "name", rs.getString("name") != null ? rs.getString("name") : "",
                                "logoUrl", rs.getString("logo_url") != null ? rs.getString("logo_url") : "")
                        : Map.of("id", tenantId.toString(), "name", "", "logoUrl", ""),
                tenantId);

        Map<String, String> settings = loadSection(tenantId, "TENANT");

        List<String> workingDays = fromJson(settings.get("workingDays"), STRING_LIST,
                List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"));
        List<Map<String, String>> publicHolidays = fromJson(settings.get("publicHolidays"), MAP_LIST, List.of());

        return new TenantSettingsDto(
                (String) tenantRow.get("id"),
                (String) tenantRow.get("name"),
                settings.getOrDefault("legalName", ""),
                settings.getOrDefault("taxCode", ""),
                settings.getOrDefault("address", ""),
                settings.getOrDefault("timezone", "Asia/Ho_Chi_Minh"),
                settings.getOrDefault("dateFormat", "DD/MM/YYYY"),
                workingDays,
                publicHolidays,
                (String) tenantRow.get("logoUrl"));
    }

    // ─── Storage Settings ────────────────────────────────────────────────────

    public StorageSettingsDto getStorageSettings(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Cache cache = cacheManager.getCache(CACHE_STORAGE);
        if (cache != null) {
            StorageSettingsDto cached = cache.get(tenantId.toString(), StorageSettingsDto.class);
            if (cached != null)
                return cached;
        }

        StorageSettingsDto result = loadStorageSettings(tenantId);
        if (cache != null)
            cache.put(tenantId.toString(), result);
        return result;
    }

    public StorageSettingsDto updateStorageSettings(
            String tenantIdHeader, String userIdHeader, StorageSettingsDto dto) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Map<String, String> kvs = new LinkedHashMap<>();
        kvs.put("totalQuotaMb", String.valueOf(dto.totalQuotaMb()));
        kvs.put("maxFileSizeMb", String.valueOf(dto.maxFileSizeMb()));
        kvs.put("allowedExtensions", toJson(dto.allowedExtensions()));
        kvs.put("bucketName", dto.bucketName() != null ? dto.bucketName() : "onfis-uploads");

        upsertSettings(tenantId, "STORAGE", kvs, userId);

        Cache cache = cacheManager.getCache(CACHE_STORAGE);
        if (cache != null)
            cache.evict(tenantId.toString());
        return loadStorageSettings(tenantId);
    }

    private StorageSettingsDto loadStorageSettings(UUID tenantId) {
        Map<String, String> settings = loadSection(tenantId, "STORAGE");

        long usedMb = queryLong(
                "SELECT COALESCE(SUM(size), 0) / 1048576 FROM attachments WHERE tenant_id = ?", tenantId);
        long totalQuotaMb = parseLong(settings.get("totalQuotaMb"), 10240L);
        int maxFileSizeMb = parseInt(settings.get("maxFileSizeMb"), 10);
        List<String> allowedExtensions = fromJson(settings.get("allowedExtensions"), STRING_LIST,
                List.of("jpg", "jpeg", "png", "gif", "pdf", "docx", "xlsx", "pptx", "zip"));
        String bucketName = settings.getOrDefault("bucketName", "onfis-uploads");

        return new StorageSettingsDto(totalQuotaMb, usedMb, maxFileSizeMb, allowedExtensions, bucketName);
    }

    // ─── Module Settings ─────────────────────────────────────────────────────

    public ModuleSettingsDto getModuleSettings(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Cache cache = cacheManager.getCache(CACHE_MODULES);
        if (cache != null) {
            ModuleSettingsDto cached = cache.get(tenantId.toString(), ModuleSettingsDto.class);
            if (cached != null)
                return cached;
        }

        ModuleSettingsDto result = loadModuleSettings(tenantId);
        if (cache != null)
            cache.put(tenantId.toString(), result);
        return result;
    }

    public ModuleSettingsDto updateModuleSettings(
            String tenantIdHeader, String userIdHeader, ModuleSettingsDto dto) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Map<String, String> kvs = new LinkedHashMap<>();
        kvs.put("chatEnabled", String.valueOf(dto.chatEnabled()));
        kvs.put("announcementsEnabled", String.valueOf(dto.announcementsEnabled()));
        kvs.put("meetingsEnabled", String.valueOf(dto.meetingsEnabled()));
        kvs.put("projectManagementEnabled", String.valueOf(dto.projectManagementEnabled()));

        upsertSettings(tenantId, "MODULES", kvs, userId);

        Cache cache = cacheManager.getCache(CACHE_MODULES);
        if (cache != null)
            cache.evict(tenantId.toString());
        return loadModuleSettings(tenantId);
    }

    private ModuleSettingsDto loadModuleSettings(UUID tenantId) {
        Map<String, String> s = loadSection(tenantId, "MODULES");
        return new ModuleSettingsDto(
                parseBoolean(s.get("chatEnabled"), true),
                parseBoolean(s.get("announcementsEnabled"), true),
                parseBoolean(s.get("meetingsEnabled"), true),
                parseBoolean(s.get("projectManagementEnabled"), true));
    }

    // ─── Security Settings ────────────────────────────────────────────────────

    public SecuritySettingsDto getSecuritySettings(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Cache cache = cacheManager.getCache(CACHE_SECURITY);
        if (cache != null) {
            SecuritySettingsDto cached = cache.get(tenantId.toString(), SecuritySettingsDto.class);
            if (cached != null)
                return cached;
        }

        SecuritySettingsDto result = loadSecuritySettings(tenantId);
        if (cache != null)
            cache.put(tenantId.toString(), result);
        return result;
    }

    public SecuritySettingsDto updateSecuritySettings(
            String tenantIdHeader, String userIdHeader, SecuritySettingsDto dto) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Map<String, String> kvs = new LinkedHashMap<>();
        kvs.put("passwordMinLength", String.valueOf(dto.passwordMinLength()));
        kvs.put("sessionTimeoutMinutes", String.valueOf(dto.sessionTimeoutMinutes()));
        kvs.put("mfaRequired", String.valueOf(dto.mfaRequired()));
        kvs.put("loginMaxAttempts", String.valueOf(dto.loginMaxAttempts()));
        kvs.put("accountLockoutMinutes", String.valueOf(dto.accountLockoutMinutes()));

        upsertSettings(tenantId, "SECURITY", kvs, userId);

        Cache cache = cacheManager.getCache(CACHE_SECURITY);
        if (cache != null)
            cache.evict(tenantId.toString());
        return loadSecuritySettings(tenantId);
    }

    private SecuritySettingsDto loadSecuritySettings(UUID tenantId) {
        Map<String, String> s = loadSection(tenantId, "SECURITY");
        return new SecuritySettingsDto(
                parseInt(s.get("passwordMinLength"), 8),
                parseInt(s.get("sessionTimeoutMinutes"), 480),
                parseBoolean(s.get("mfaRequired"), false),
                parseInt(s.get("loginMaxAttempts"), 5),
                parseInt(s.get("accountLockoutMinutes"), 30));
    }

    // ─── Operational Settings ─────────────────────────────────────────────────

    public OperationalSettingsDto getOperationalSettings(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Cache cache = cacheManager.getCache(CACHE_OPERATIONS);
        if (cache != null) {
            OperationalSettingsDto cached = cache.get(tenantId.toString(), OperationalSettingsDto.class);
            if (cached != null)
                return cached;
        }

        OperationalSettingsDto result = loadOperationalSettings(tenantId);
        if (cache != null)
            cache.put(tenantId.toString(), result);
        return result;
    }

    public OperationalSettingsDto updateOperationalSettings(
            String tenantIdHeader, String userIdHeader, OperationalSettingsDto dto) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        Map<String, String> kvs = new LinkedHashMap<>();
        kvs.put("maintenanceMode", String.valueOf(dto.maintenanceMode()));
        kvs.put("newUserRegistrationEnabled", String.valueOf(dto.newUserRegistrationEnabled()));
        kvs.put("dataExportEnabled", String.valueOf(dto.dataExportEnabled()));
        if (dto.supportContactEmail() != null)
            kvs.put("supportContactEmail", dto.supportContactEmail());

        upsertSettings(tenantId, "OPERATIONS", kvs, userId);

        Cache cache = cacheManager.getCache(CACHE_OPERATIONS);
        if (cache != null)
            cache.evict(tenantId.toString());
        return loadOperationalSettings(tenantId);
    }

    private OperationalSettingsDto loadOperationalSettings(UUID tenantId) {
        Map<String, String> s = loadSection(tenantId, "OPERATIONS");
        return new OperationalSettingsDto(
                parseBoolean(s.get("maintenanceMode"), false),
                parseBoolean(s.get("newUserRegistrationEnabled"), true),
                parseBoolean(s.get("dataExportEnabled"), true),
                s.getOrDefault("supportContactEmail", ""));
    }

    // ─── Common helpers ───────────────────────────────────────────────────────

    private Map<String, String> loadSection(UUID tenantId, String section) {
        Map<String, String> result = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT setting_key, setting_value FROM tenant_settings WHERE tenant_id = ? AND section = ?",
                (RowCallbackHandler) rs -> result.put(rs.getString("setting_key"), rs.getString("setting_value")),
                tenantId, section);
        return result;
    }

    private void upsertSettings(UUID tenantId, String section, Map<String, String> kvs, UUID updatedBy) {
        for (Map.Entry<String, String> entry : kvs.entrySet()) {
            jdbcTemplate.update(
                    """
                            INSERT INTO tenant_settings (tenant_id, section, setting_key, setting_value, updated_at, updated_by)
                            VALUES (?, ?, ?, ?, NOW(), ?)
                            ON CONFLICT (tenant_id, section, setting_key) DO UPDATE
                                SET setting_value = EXCLUDED.setting_value,
                                    updated_at    = NOW(),
                                    updated_by    = EXCLUDED.updated_by
                            """,
                    tenantId, section, entry.getKey(), entry.getValue(), updatedBy);
        }
    }

    private long queryLong(String sql, UUID tenantId) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class, tenantId);
        return val == null ? 0L : val;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    private <T> T fromJson(String json, TypeReference<T> type, T defaultValue) {
        if (json == null || json.isBlank())
            return defaultValue;
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null)
            return defaultValue;
        return "true".equalsIgnoreCase(value);
    }

    private int parseInt(String value, int defaultValue) {
        if (value == null)
            return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private long parseLong(String value, long defaultValue) {
        if (value == null)
            return defaultValue;
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
