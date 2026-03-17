package com.onfis.shared.security;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

/**
 * Thread-safe context holder for multi-tenancy
 */
@Component
@RequestScope
public class TenantContext {

    private String tenantId;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getCompanyId() {
        return tenantId;
    }

    public void setCompanyId(String companyId) {
        this.tenantId = companyId;
    }

    public void clear() {
        this.tenantId = null;
    }
}
