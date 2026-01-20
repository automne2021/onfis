package com.onfis.shared.security;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

/**
 * Thread-safe context holder for multi-tenancy
 */
@Component
@RequestScope
public class TenantContext {
    
    private String companyId;
    
    public String getCompanyId() {
        return companyId;
    }
    
    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }
    
    public void clear() {
        this.companyId = null;
    }
}
