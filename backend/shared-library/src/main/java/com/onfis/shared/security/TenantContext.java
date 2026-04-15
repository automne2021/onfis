package com.onfis.shared.security;

import org.springframework.stereotype.Component;
// import org.springframework.web.context.annotation.RequestScope;

/** Thread-safe context holder for multi-tenancy */
@Component
// @RequestScope
public class TenantContext {

    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public String getTenantId() {
        // return tenantId;
        return currentTenant.get();
    }

    public void setTenantId(String tenantId) {
        // this.tenantId = tenantId;
        currentTenant.set(tenantId);
    }

    public String getCompanyId() {
        // return tenantId;
        return currentTenant.get();
    }

    public void setCompanyId(String companyId) {
        // this.tenantId = companyId;
        currentTenant.set(companyId);
    }

    public void clear() {
        // this.tenantId = null;
        currentTenant.remove();
    }
}
