package com.onfis.shared.security;

import org.springframework.stereotype.Component;

/** Thread-safe context holder for multi-tenancy */
@Component
public class TenantContext {

    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();

    public String getTenantId() {
        return TENANT_ID.get();
    }

    public void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }

    public String getCompanyId() {
        return TENANT_ID.get();
    }

    public void setCompanyId(String companyId) {
        TENANT_ID.set(companyId);
    }

    public void clear() {
        TENANT_ID.remove();
    }
}
