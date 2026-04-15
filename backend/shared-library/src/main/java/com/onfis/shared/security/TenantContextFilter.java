package com.onfis.shared.security;

import jakarta.persistence.EntityManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.sql.PreparedStatement;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantContextFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-Company-ID";
    private static final String USER_HEADER = "X-User-ID";
    private static final String NOT_FOUND_MESSAGE = "Tenant not found or inactive";

    private final TenantContext tenantContext;
    private final EntityManager entityManager;

    public TenantContextFilter(TenantContext tenantContext, EntityManager entityManager) {
        this.tenantContext = tenantContext;
        this.entityManager = entityManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String tenantId = request.getHeader(TENANT_HEADER);
        String userId = request.getHeader(USER_HEADER);
        if (!StringUtils.hasText(tenantId)) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("text/plain");
            response.getWriter().write(NOT_FOUND_MESSAGE);
            return;
        }

        Session session = entityManager.unwrap(Session.class);
        try {
            tenantContext.setTenantId(tenantId);
    
            Filter filter = session.enableFilter("tenantFilter");
            filter.setParameter("tenantId", tenantId);
            setJwtClaims(session, tenantId, userId);
            filterChain.doFilter(request, response);
        } finally {
            tenantContext.clear();
            clearJwtClaims(session);
            session.disableFilter("tenantFilter");
        }
    }

    private void setJwtClaims(Session session, String tenantId, String userId) {
        String claimsJson = buildClaimsJson(tenantId, userId);
        session.doWork(connection -> {
            try (PreparedStatement statement = connection.prepareStatement(
                    "select set_config('request.jwt.claims', ?, true)")) {
                statement.setString(1, claimsJson);
                statement.execute();
            }
        });
    }

    private void clearJwtClaims(Session session) {
        session.doWork(connection -> {
            try (PreparedStatement statement = connection.prepareStatement(
                    "select set_config('request.jwt.claims', '{}', true)")) {
                statement.execute();
            }
        });
    }

    private String buildClaimsJson(String tenantId, String userId) {
        StringBuilder builder = new StringBuilder("{");
        boolean hasValue = false;

        if (StringUtils.hasText(userId)) {
            builder.append("\"sub\":\"").append(escapeJson(userId)).append("\"");
            hasValue = true;
        }

        if (StringUtils.hasText(tenantId)) {
            if (hasValue) {
                builder.append(',');
            }
            builder.append("\"tenant_id\":\"").append(escapeJson(tenantId)).append("\"");
        }

        builder.append('}');
        return builder.toString();
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
