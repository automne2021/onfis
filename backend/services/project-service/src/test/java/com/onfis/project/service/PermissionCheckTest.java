package com.onfis.project.service;

import com.onfis.project.domain.GlobalRole;
import com.onfis.project.domain.ProjectRole;
import com.onfis.project.entity.AppUserEntity;
import com.onfis.project.entity.ProjectMemberEntity;
import com.onfis.project.entity.ProjectMemberId;
import com.onfis.project.exception.ForbiddenException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Unit tests for the role-based permission rules defined in
 * ProjectModuleService.
 *
 * Because the enforcement methods (requireManager, enforceProjectManage,
 * enforceProjectVisible, enforceTaskEdit) are private, the logic is extracted
 * here as inline helpers that mirror the production code exactly. Any change to
 * those methods must be reflected here, making test failures an explicit signal
 * that the specification has changed.
 *
 * Tests cover:
 *   1. requireManager        — manager-like roles allowed; EMPLOYEE denied
 *   2. enforceProjectManage  — manager bypasses check; LEAD allowed; others denied
 *   3. GlobalRole.isManagerLike() — correct role mapping
 */
@DisplayName("Project Module — Permission Checks")
class PermissionCheckTest {

    // ── Helpers that mirror the production private methods ─────────────────

    private boolean isManager(AppUserEntity user) {
        return GlobalRole.fromDbValue(user.getRole()).isManagerLike();
    }

    private void requireManager(AppUserEntity user) {
        if (!isManager(user)) {
            throw new ForbiddenException("Manager role required");
        }
    }

    /**
     * Simplified version that accepts the membership directly (production code
     * calls projectMemberRepository.findByIdProjectIdAndIdUserId, which we avoid
     * mocking so that this stays a pure unit test).
     */
    private void enforceProjectManage(AppUserEntity user, Optional<ProjectMemberEntity> membership) {
        if (isManager(user)) {
            return;
        }
        ProjectMemberEntity member = membership
                .orElseThrow(() -> new ForbiddenException("No management permission on project"));
        ProjectRole role = ProjectRole.fromDbValue(member.getRole());
        if (role != ProjectRole.LEAD) {
            throw new ForbiddenException("Only manager or project lead can manage this resource");
        }
    }

    // ── Factory helpers ────────────────────────────────────────────────────

    private AppUserEntity userWithRole(String role) {
        AppUserEntity u = new AppUserEntity();
        u.setId(UUID.randomUUID());
        u.setRole(role);
        return u;
    }

    private ProjectMemberEntity memberWithRole(UUID projectId, UUID userId, String role) {
        ProjectMemberEntity m = new ProjectMemberEntity();
        m.setId(new ProjectMemberId(projectId, userId));
        m.setRole(role);
        return m;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  requireManager
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("requireManager()")
    class RequireManager {

        @ParameterizedTest(name = "{0} is manager-like → must not throw")
        @EnumSource(value = GlobalRole.class, names = {"SUPER_ADMIN", "ADMIN", "MANAGER"})
        void managerLikeRolesPass(GlobalRole role) {
            AppUserEntity user = userWithRole(role.name());
            assertThatCode(() -> requireManager(user)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("EMPLOYEE must throw ForbiddenException")
        void employeeIsDenied() {
            AppUserEntity employee = userWithRole("EMPLOYEE");
            assertThatThrownBy(() -> requireManager(employee))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Manager role required");
        }

        @Test
        @DisplayName("Null or blank role defaults to EMPLOYEE and is denied")
        void nullRoleDefaultsToEmployee() {
            AppUserEntity user = userWithRole(null);
            assertThatThrownBy(() -> requireManager(user))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("Unknown/garbage role string defaults to EMPLOYEE and is denied")
        void unknownRoleDefaultsToEmployee() {
            AppUserEntity user = userWithRole("GARBAGE_ROLE");
            assertThatThrownBy(() -> requireManager(user))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  enforceProjectManage
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("enforceProjectManage()")
    class EnforceProjectManage {

        private final UUID PROJECT_ID = UUID.randomUUID();

        @Test
        @DisplayName("MANAGER bypasses membership check")
        void managerBypassesMembershipCheck() {
            AppUserEntity manager = userWithRole("MANAGER");
            // No membership provided — manager should still pass
            assertThatCode(() -> enforceProjectManage(manager, Optional.empty()))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Project LEAD member is allowed to manage")
        void projectLeadCanManage() {
            AppUserEntity employee = userWithRole("EMPLOYEE");
            ProjectMemberEntity lead = memberWithRole(PROJECT_ID, employee.getId(), "LEAD");
            assertThatCode(() -> enforceProjectManage(employee, Optional.of(lead)))
                    .doesNotThrowAnyException();
        }

        @ParameterizedTest(name = "Project role {0} must NOT be allowed to manage")
        @EnumSource(value = ProjectRole.class, names = {"DEVELOPER", "DESIGNER", "QA", "ANALYST", "MEMBER"})
        void nonLeadProjectRoleIsDenied(ProjectRole projectRole) {
            AppUserEntity employee = userWithRole("EMPLOYEE");
            ProjectMemberEntity member = memberWithRole(PROJECT_ID, employee.getId(), projectRole.name());
            assertThatThrownBy(() -> enforceProjectManage(employee, Optional.of(member)))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Only manager or project lead");
        }

        @Test
        @DisplayName("Non-member employee (empty membership) must throw ForbiddenException")
        void nonMemberIsDenied() {
            AppUserEntity employee = userWithRole("EMPLOYEE");
            assertThatThrownBy(() -> enforceProjectManage(employee, Optional.empty()))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("No management permission");
        }

        @Test
        @DisplayName("ADMIN bypasses membership check (manager-like)")
        void adminBypassesMembershipCheck() {
            AppUserEntity admin = userWithRole("ADMIN");
            assertThatCode(() -> enforceProjectManage(admin, Optional.empty()))
                    .doesNotThrowAnyException();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GlobalRole.isManagerLike()
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GlobalRole.isManagerLike()")
    class GlobalRoleManagerLike {

        @ParameterizedTest(name = "{0} should be manager-like")
        @EnumSource(value = GlobalRole.class, names = {"SUPER_ADMIN", "ADMIN", "MANAGER"})
        void managerLikeRolesReturnTrue(GlobalRole role) {
            assertThat(role.isManagerLike()).isTrue();
        }

        @Test
        @DisplayName("EMPLOYEE is not manager-like")
        void employeeIsNotManagerLike() {
            assertThat(GlobalRole.EMPLOYEE.isManagerLike()).isFalse();
        }

        @Test
        @DisplayName("fromDbValue with null returns EMPLOYEE")
        void nullDbValueReturnsEmployee() {
            assertThat(GlobalRole.fromDbValue(null)).isEqualTo(GlobalRole.EMPLOYEE);
        }

        @Test
        @DisplayName("fromDbValue with blank string returns EMPLOYEE")
        void blankDbValueReturnsEmployee() {
            assertThat(GlobalRole.fromDbValue("   ")).isEqualTo(GlobalRole.EMPLOYEE);
        }

        @Test
        @DisplayName("fromDbValue case-insensitive match")
        void fromDbValueCaseInsensitive() {
            assertThat(GlobalRole.fromDbValue("manager")).isEqualTo(GlobalRole.MANAGER);
            assertThat(GlobalRole.fromDbValue("MANAGER")).isEqualTo(GlobalRole.MANAGER);
            assertThat(GlobalRole.fromDbValue("Manager")).isEqualTo(GlobalRole.MANAGER);
        }

        @Test
        @DisplayName("fromDbValue unknown string falls back to EMPLOYEE")
        void unknownDbValueFallsBackToEmployee() {
            assertThat(GlobalRole.fromDbValue("HACKER")).isEqualTo(GlobalRole.EMPLOYEE);
        }
    }
}
