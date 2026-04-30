package com.onfis.project.service;

import com.onfis.project.domain.GlobalRole;
import com.onfis.project.domain.ProjectRole;
import com.onfis.project.domain.ProjectStatus;
import com.onfis.project.domain.ReviewAction;
import com.onfis.project.domain.TaskPriority;
import com.onfis.project.domain.TaskStatus;
import com.onfis.project.dto.CompanyTagResponse;
import com.onfis.project.dto.CompanyTagUpsertRequest;
import com.onfis.project.dto.CurrentUserResponse;
import com.onfis.project.dto.MilestoneUpsertRequest;
import com.onfis.project.dto.MilestoneResponse;
import com.onfis.project.dto.ProjectDetailResponse;
import com.onfis.project.dto.ProjectCustomRoleRequest;
import com.onfis.project.dto.ProjectCustomRoleResponse;
import com.onfis.project.dto.ProjectMemberRequest;
import com.onfis.project.dto.ProjectMemberResponse;
import com.onfis.project.dto.ProjectResponse;
import com.onfis.project.dto.ProjectUpsertRequest;
import com.onfis.project.dto.ReviewQueuePageResponse;
import com.onfis.project.dto.ReviewCreateRequest;
import com.onfis.project.dto.TaskDependencyRequest;
import com.onfis.project.dto.TaskActivityResponse;
import com.onfis.project.dto.TaskCommentRequest;
import com.onfis.project.dto.TaskCommentResponse;
import com.onfis.project.dto.TaskDetailResponse;
import com.onfis.project.dto.TaskPageResponse;
import com.onfis.project.dto.TaskResponse;
import com.onfis.project.dto.TaskStageUpdateRequest;
import com.onfis.project.dto.TaskReviewResponse;
import com.onfis.project.dto.TaskSubtaskRequest;
import com.onfis.project.dto.TaskSubtaskResponse;
import com.onfis.project.dto.TaskUpsertRequest;
import com.onfis.project.dto.UserSearchResponse;
import com.onfis.project.dto.UserSummaryResponse;
import com.onfis.project.dto.WorkflowStageReorderRequest;
import com.onfis.project.dto.WorkflowStageResponse;
import com.onfis.project.dto.WorkflowStageUpsertRequest;
import com.onfis.project.entity.AppUserEntity;
import com.onfis.project.entity.CompanyTagEntity;
import com.onfis.project.entity.ProjectEntity;
import com.onfis.project.entity.ProjectFavoriteEntity;
import com.onfis.project.entity.ProjectFavoriteId;
import com.onfis.project.entity.ProjectMemberEntity;
import com.onfis.project.entity.ProjectMemberId;
import com.onfis.project.entity.ProjectMilestoneEntity;
import com.onfis.project.entity.ProjectTagLinkEntity;
import com.onfis.project.entity.ProjectTagLinkId;
import com.onfis.project.entity.ProjectCustomRoleEntity;
import com.onfis.project.entity.ProjectMemberRoleEntity;
import com.onfis.project.entity.ProjectMemberRoleId;
import com.onfis.project.entity.TaskAssigneeEntity;
import com.onfis.project.entity.TaskAssigneeId;
import com.onfis.project.entity.TaskActivityEntity;
import com.onfis.project.entity.TaskCommentEntity;
import com.onfis.project.entity.TaskDependencyEntity;
import com.onfis.project.entity.TaskDependencyId;
import com.onfis.project.entity.TaskEntity;
import com.onfis.project.entity.TaskTagLinkEntity;
import com.onfis.project.entity.TaskTagLinkId;
import com.onfis.project.entity.TaskSubtaskEntity;
import com.onfis.project.entity.TaskReviewEntity;
import com.onfis.project.entity.WorkflowStageEntity;
import com.onfis.project.exception.BadRequestException;
import com.onfis.project.exception.ForbiddenException;
import com.onfis.project.exception.NotFoundException;
import com.onfis.project.repository.AppUserRepository;
import com.onfis.project.repository.CompanyTagRepository;
import com.onfis.project.repository.TaskDependencyRepository;
import com.onfis.project.repository.ProjectFavoriteRepository;
import com.onfis.project.repository.ProjectMemberRepository;
import com.onfis.project.repository.ProjectMilestoneRepository;
import com.onfis.project.repository.ProjectRepository;
import com.onfis.project.repository.ProjectTagLinkRepository;
import com.onfis.project.repository.ProjectCustomRoleRepository;
import com.onfis.project.repository.ProjectMemberRoleRepository;
import com.onfis.project.repository.TaskActivityRepository;
import com.onfis.project.repository.TaskAssigneeRepository;
import com.onfis.project.repository.TaskCommentRepository;
import com.onfis.project.repository.TaskRepository;
import com.onfis.project.repository.TaskReviewRepository;
import com.onfis.project.repository.TaskTagLinkRepository;
import com.onfis.project.repository.TaskSubtaskRepository;
import com.onfis.project.repository.WorkflowStageRepository;
import com.onfis.shared.security.TenantContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectModuleService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int DEFAULT_REVIEW_PAGE_SIZE = 20;
    private static final int MAX_REVIEW_PAGE_SIZE = 100;
    private static final int DEFAULT_MY_TASKS_PAGE_SIZE = 10;
    private static final int MAX_MY_TASKS_PAGE_SIZE = 100;
    private static final Map<TaskStatus, Set<TaskStatus>> TASK_TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW, TaskStatus.BLOCKED),
            TaskStatus.BLOCKED, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.IN_REVIEW, Set.of(TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.DONE, Set.of());

    private final TenantContext tenantContext;
    private final AppUserRepository appUserRepository;
    private final CompanyTagRepository companyTagRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final TaskReviewRepository taskReviewRepository;
    private final WorkflowStageRepository workflowStageRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskSubtaskRepository taskSubtaskRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final TaskDependencyRepository taskDependencyRepository;
    private final ProjectTagLinkRepository projectTagLinkRepository;
    private final TaskTagLinkRepository taskTagLinkRepository;
    private final ProjectCustomRoleRepository projectCustomRoleRepository;
    private final ProjectMemberRoleRepository projectMemberRoleRepository;

    public ProjectModuleService(
            TenantContext tenantContext,
            AppUserRepository appUserRepository,
            CompanyTagRepository companyTagRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            TaskRepository taskRepository,
            TaskAssigneeRepository taskAssigneeRepository,
            TaskReviewRepository taskReviewRepository,
            WorkflowStageRepository workflowStageRepository,
            ProjectMilestoneRepository projectMilestoneRepository,
            ProjectFavoriteRepository projectFavoriteRepository,
            TaskCommentRepository taskCommentRepository,
            TaskSubtaskRepository taskSubtaskRepository,
            TaskActivityRepository taskActivityRepository,
            TaskDependencyRepository taskDependencyRepository,
            ProjectTagLinkRepository projectTagLinkRepository,
            TaskTagLinkRepository taskTagLinkRepository,
            ProjectCustomRoleRepository projectCustomRoleRepository,
            ProjectMemberRoleRepository projectMemberRoleRepository) {
        this.tenantContext = tenantContext;
        this.appUserRepository = appUserRepository;
        this.companyTagRepository = companyTagRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.taskAssigneeRepository = taskAssigneeRepository;
        this.taskReviewRepository = taskReviewRepository;
        this.workflowStageRepository = workflowStageRepository;
        this.projectMilestoneRepository = projectMilestoneRepository;
        this.projectFavoriteRepository = projectFavoriteRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.taskSubtaskRepository = taskSubtaskRepository;
        this.taskActivityRepository = taskActivityRepository;
        this.taskDependencyRepository = taskDependencyRepository;
        this.projectTagLinkRepository = projectTagLinkRepository;
        this.taskTagLinkRepository = taskTagLinkRepository;
        this.projectCustomRoleRepository = projectCustomRoleRepository;
        this.projectMemberRoleRepository = projectMemberRoleRepository;
    }

    // ── Current user ──────────────────────────────────────────────────────────

    public CurrentUserResponse getCurrentUser(String userIdHeader) {
        UUID tenantId = tenantId();
        UUID userId = parseUserId(userIdHeader);
        AppUserEntity user = requireUser(userId, tenantId);
        GlobalRole role = GlobalRole.fromDbValue(user.getRole());
        Set<String> permissions = role.isManagerLike()
                ? Set.of("PROJECT_CREATE", "PROJECT_MANAGE", "TASK_REVIEW", "TASK_CREATE", "TASK_UPDATE")
                : Set.of("TASK_CREATE", "TASK_UPDATE");
        return new CurrentUserResponse(user.getId(), fullName(user), role.name(), permissions);
    }

    // ── Projects ─────────────────────────────────────────────────────────────

    public List<ProjectResponse> listProjects(String userIdHeader) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        GlobalRole role = GlobalRole.fromDbValue(currentUser.getRole());

        List<ProjectEntity> projects = role.isManagerLike()
                ? projectRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                : projectRepository.findVisibleByUser(tenantId, currentUser.getId());

        return toProjectResponses(projects, currentUser, tenantId);
    }

    public ProjectResponse getProject(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, project.getId());
        return toProjectResponse(project, currentUser);
    }

    public ProjectDetailResponse getProjectDetail(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, project.getId());

        List<ProjectMemberEntity> memberEntities = projectMemberRepository.findByIdProjectId(projectId);
        Set<UUID> userIds = new HashSet<>();
        if (project.getManagerId() != null) {
            userIds.add(project.getManagerId());
        }
        for (ProjectMemberEntity memberEntity : memberEntities) {
            userIds.add(memberEntity.getId().getUserId());
        }

        Map<UUID, AppUserEntity> usersById = appUserRepository
                .findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(AppUserEntity::getId, u -> u));

        String managerName = null;
        String managerAvatar = null;
        if (project.getManagerId() != null) {
            AppUserEntity manager = usersById.get(project.getManagerId());
            if (manager != null) {
                managerName = fullName(manager);
                managerAvatar = manager.getAvatarUrl();
            }
        }

        List<UserSummaryResponse> members = new ArrayList<>();
        for (ProjectMemberEntity m : memberEntities) {
            AppUserEntity user = usersById.get(m.getId().getUserId());
            if (user != null) {
                members.add(new UserSummaryResponse(user.getId(), fullName(user), user.getAvatarUrl()));
            }
        }

        // Starred
        boolean isStarred = projectFavoriteRepository.existsByIdProjectIdAndIdUserId(projectId, currentUser.getId());

        // Milestones (limit to first 6)
        List<MilestoneResponse> milestones = projectMilestoneRepository
                .findByProjectIdOrderBySortOrderAsc(projectId)
                .stream()
                .limit(6)
                .map(this::toMilestoneResponse)
                .collect(Collectors.toList());

        List<TaskEntity> recentTaskEntities = taskRepository
                .findByTenantIdAndProjectIdOrderByCreatedAtDesc(tenantId, projectId)
                .stream()
                .limit(5)
                .collect(Collectors.toList());
        List<TaskResponse> recentTasks = toTaskResponses(recentTaskEntities, currentUser, tenantId);

        // Days remaining
        int daysRemaining = 0;
        if (project.getDueDate() != null) {
            long diff = ChronoUnit.DAYS.between(LocalDate.now(), project.getDueDate());
            daysRemaining = (int) Math.max(0, diff);
        }

        return new ProjectDetailResponse(
                project.getId(),
                project.getSlug(),
                project.getName(),
                project.getDescription(),
                project.getManagerId(),
                managerName,
                managerAvatar,
                project.getCustomer(),
                toFrontendProjectStatus(safeProjectStatus(project).name()),
                safeProjectPriority(project).name().toLowerCase(),
                project.getProgress() == null ? 0 : project.getProgress(),
                project.getStartDate(),
                project.getEndDate(),
                project.getDueDate(),
                safeTags(project.getTags()),
                asOffset(project.getCreatedAt()),
                members,
                canManageProject(currentUser, projectId),
                isStarred,
                milestones,
                recentTasks,
                members.size(),
                daysRemaining);
    }

    @Transactional
    public ProjectResponse createProject(String userIdHeader, ProjectUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireManager(currentUser);

        ProjectEntity project = new ProjectEntity();
        project.setTenantId(tenantId);
        project.setCreatedBy(currentUser.getId());
        applyProjectUpsert(project, request);
        ProjectEntity saved = projectRepository.save(project);
        syncProjectTagLinks(tenantId, saved.getId(), saved.getTags());

        ProjectMemberEntity creatorMembership = new ProjectMemberEntity();
        creatorMembership.setId(new ProjectMemberId(saved.getId(), currentUser.getId()));
        creatorMembership.setRole(ProjectRole.LEAD.name());
        creatorMembership.setJoinedAt(Instant.now());
        projectMemberRepository.save(creatorMembership);

        return toProjectResponse(saved, currentUser);
    }

    @Transactional
    public ProjectResponse updateProject(String userIdHeader, UUID projectId, ProjectUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);
        applyProjectUpsert(project, request);
        ProjectEntity saved = projectRepository.save(project);
        syncProjectTagLinks(tenantId, saved.getId(), saved.getTags());
        return toProjectResponse(saved, currentUser);
    }

    @Transactional
    public void deleteProject(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireManager(currentUser);
        ProjectEntity project = requireProject(projectId, tenantId);
        projectRepository.delete(project);
    }

    @Transactional
    public boolean toggleFavorite(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        ProjectFavoriteId favId = new ProjectFavoriteId(projectId, currentUser.getId());
        if (projectFavoriteRepository.existsByIdProjectIdAndIdUserId(projectId, currentUser.getId())) {
            projectFavoriteRepository.deleteByIdProjectIdAndIdUserId(projectId, currentUser.getId());
            return false;
        } else {
            ProjectFavoriteEntity fav = new ProjectFavoriteEntity();
            fav.setId(favId);
            fav.setTenantId(tenantId);
            fav.setCreatedAt(Instant.now());
            projectFavoriteRepository.save(fav);
            return true;
        }
    }

    // ── Members ───────────────────────────────────────────────────────────────

    public List<ProjectMemberResponse> listMembers(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        List<ProjectCustomRoleEntity> allRoles = projectCustomRoleRepository
                .findByProjectIdOrderByCreatedAtAsc(projectId);
        Map<UUID, ProjectCustomRoleResponse> roleMap = allRoles.stream()
                .collect(Collectors.toMap(ProjectCustomRoleEntity::getId,
                        r -> new ProjectCustomRoleResponse(r.getId(), r.getName(), r.getColor(), r.getProjectId())));

        List<ProjectMemberRoleEntity> allMemberRoles = projectMemberRoleRepository.findByProjectId(projectId);
        Map<UUID, List<ProjectCustomRoleResponse>> memberCustomRoles = new java.util.HashMap<>();
        for (ProjectMemberRoleEntity mr : allMemberRoles) {
            ProjectCustomRoleResponse crResp = roleMap.get(mr.getId().getCustomRoleId());
            if (crResp != null) {
                memberCustomRoles.computeIfAbsent(mr.getId().getUserId(), k -> new ArrayList<>()).add(crResp);
            }
        }

        List<ProjectMemberEntity> members = projectMemberRepository.findByIdProjectId(projectId);
        List<ProjectMemberResponse> responses = new ArrayList<>();
        for (ProjectMemberEntity member : members) {
            AppUserEntity user = requireUser(member.getId().getUserId(), tenantId);
            long taskCount = taskAssigneeRepository.countAssignedInProject(projectId, user.getId());
            List<ProjectCustomRoleResponse> customRoles = memberCustomRoles.getOrDefault(user.getId(), List.of());
            responses.add(new ProjectMemberResponse(
                    user.getId(),
                    fullName(user),
                    user.getAvatarUrl(),
                    toFrontendProjectRole(member.getRole()),
                    asOffset(member.getJoinedAt()),
                    taskCount,
                    customRoles));
        }
        return responses;
    }

    @Transactional
    public ProjectMemberResponse addMember(String userIdHeader, UUID projectId, ProjectMemberRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        AppUserEntity memberUser = requireUser(request.userId(), tenantId);
        ProjectMemberId id = new ProjectMemberId(projectId, request.userId());
        ProjectMemberEntity member = projectMemberRepository.findById(id).orElseGet(ProjectMemberEntity::new);
        member.setId(id);
        member.setRole(ProjectRole.fromDbValue(request.role()).name());
        if (member.getJoinedAt() == null) {
            member.setJoinedAt(Instant.now());
        }
        projectMemberRepository.save(member);

        long taskCount = taskAssigneeRepository.countAssignedInProject(projectId, memberUser.getId());
        List<ProjectMemberRoleEntity> memberRoles = projectMemberRoleRepository.findByProjectIdAndUserId(projectId,
                memberUser.getId());
        List<ProjectCustomRoleResponse> customRoles = memberRoles.stream()
                .map(mr -> projectCustomRoleRepository.findById(mr.getId().getCustomRoleId())
                        .map(r -> new ProjectCustomRoleResponse(r.getId(), r.getName(), r.getColor(), r.getProjectId()))
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return new ProjectMemberResponse(
                memberUser.getId(),
                fullName(memberUser),
                memberUser.getAvatarUrl(),
                toFrontendProjectRole(member.getRole()),
                asOffset(member.getJoinedAt()),
                taskCount,
                customRoles);
    }

    @Transactional
    public ProjectMemberResponse updateMemberRole(String userIdHeader, UUID projectId, UUID memberId,
            ProjectMemberRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectMemberEntity member = projectMemberRepository
                .findByIdProjectIdAndIdUserId(projectId, memberId)
                .orElseThrow(() -> new NotFoundException("Project member not found"));
        member.setRole(ProjectRole.fromDbValue(request.role()).name());
        ProjectMemberEntity saved = projectMemberRepository.save(member);
        AppUserEntity user = requireUser(memberId, tenantId);

        long taskCount = taskAssigneeRepository.countAssignedInProject(projectId, user.getId());
        List<ProjectMemberRoleEntity> memberRoles = projectMemberRoleRepository.findByProjectIdAndUserId(projectId,
                memberId);
        List<ProjectCustomRoleResponse> customRoles = memberRoles.stream()
                .map(mr -> projectCustomRoleRepository.findById(mr.getId().getCustomRoleId())
                        .map(r -> new ProjectCustomRoleResponse(r.getId(), r.getName(), r.getColor(), r.getProjectId()))
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return new ProjectMemberResponse(
                user.getId(),
                fullName(user),
                user.getAvatarUrl(),
                toFrontendProjectRole(saved.getRole()),
                asOffset(saved.getJoinedAt()),
                taskCount,
                customRoles);
    }

    @Transactional
    public void removeMember(String userIdHeader, UUID projectId, UUID memberId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectMemberEntity member = projectMemberRepository
                .findByIdProjectIdAndIdUserId(projectId, memberId)
                .orElseThrow(() -> new NotFoundException("Project member not found"));
        projectMemberRepository.delete(member);
        // Also remove their custom role assignments for this project
        projectMemberRoleRepository.deleteByIdProjectIdAndIdUserId(projectId, memberId);
    }

    // ── Project custom roles ──────────────────────────────────────────────────

    public List<ProjectCustomRoleResponse> listProjectCustomRoles(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        return projectCustomRoleRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(r -> new ProjectCustomRoleResponse(r.getId(), r.getName(), r.getColor(), r.getProjectId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectCustomRoleResponse createProjectCustomRole(String userIdHeader, UUID projectId,
            ProjectCustomRoleRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        String name = request.name().trim();
        if (projectCustomRoleRepository.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
            throw new BadRequestException("A role with this name already exists in this project");
        }

        ProjectCustomRoleEntity role = new ProjectCustomRoleEntity();
        role.setTenantId(tenantId);
        role.setProjectId(projectId);
        role.setName(name);
        role.setColor(request.color() != null && !request.color().isBlank() ? request.color() : "#64748B");
        role.setCreatedBy(currentUser.getId());
        ProjectCustomRoleEntity saved = projectCustomRoleRepository.save(role);
        return new ProjectCustomRoleResponse(saved.getId(), saved.getName(), saved.getColor(), saved.getProjectId());
    }

    @Transactional
    public ProjectCustomRoleResponse updateProjectCustomRole(String userIdHeader, UUID projectId, UUID roleId,
            ProjectCustomRoleRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectCustomRoleEntity role = projectCustomRoleRepository.findByIdAndProjectId(roleId, projectId)
                .orElseThrow(() -> new NotFoundException("Project role not found"));

        String name = request.name().trim();
        // Check uniqueness only if name is changing
        if (!role.getName().equalsIgnoreCase(name)
                && projectCustomRoleRepository.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
            throw new BadRequestException("A role with this name already exists in this project");
        }
        role.setName(name);
        if (request.color() != null && !request.color().isBlank()) {
            role.setColor(request.color());
        }
        ProjectCustomRoleEntity saved = projectCustomRoleRepository.save(role);
        return new ProjectCustomRoleResponse(saved.getId(), saved.getName(), saved.getColor(), saved.getProjectId());
    }

    @Transactional
    public void deleteProjectCustomRole(String userIdHeader, UUID projectId, UUID roleId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectCustomRoleEntity role = projectCustomRoleRepository.findByIdAndProjectId(roleId, projectId)
                .orElseThrow(() -> new NotFoundException("Project role not found"));
        projectCustomRoleRepository.delete(role);
        // project_member_roles rows are cascade-deleted by FK
    }

    @Transactional
    public void assignMemberCustomRole(String userIdHeader, UUID projectId, UUID memberId, UUID roleId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        // Validate member exists in project
        projectMemberRepository.findByIdProjectIdAndIdUserId(projectId, memberId)
                .orElseThrow(() -> new NotFoundException("Member not found in this project"));

        // Validate role belongs to project
        projectCustomRoleRepository.findByIdAndProjectId(roleId, projectId)
                .orElseThrow(() -> new NotFoundException("Project role not found"));

        ProjectMemberRoleId id = new ProjectMemberRoleId(projectId, memberId, roleId);
        if (!projectMemberRoleRepository.existsById(id)) {
            ProjectMemberRoleEntity entity = new ProjectMemberRoleEntity();
            entity.setId(id);
            entity.setAssignedAt(Instant.now());
            projectMemberRoleRepository.save(entity);
        }
    }

    @Transactional
    public void removeMemberCustomRole(String userIdHeader, UUID projectId, UUID memberId, UUID roleId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectMemberRoleId id = new ProjectMemberRoleId(projectId, memberId, roleId);
        if (projectMemberRoleRepository.existsById(id)) {
            projectMemberRoleRepository.deleteById(id);
        }
    }

    // ── Workflow stages ────────────────────────────────────────────────────────

    public List<WorkflowStageResponse> listStages(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        return workflowStageRepository.findByProjectIdOrderByStageOrderAsc(projectId)
                .stream()
                .map(s -> new WorkflowStageResponse(s.getId().toString(), s.getName(), s.getStageOrder()))
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkflowStageResponse createStage(String userIdHeader, UUID projectId, WorkflowStageUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        WorkflowStageEntity stage = new WorkflowStageEntity();
        stage.setTenantId(tenantId);
        stage.setProjectId(projectId);
        stage.setName(request.name().trim());
        stage.setStageOrder(nextStageOrder(projectId));
        WorkflowStageEntity saved = workflowStageRepository.save(stage);
        return toWorkflowStageResponse(saved);
    }

    @Transactional
    public WorkflowStageResponse updateStage(String userIdHeader, UUID projectId, UUID stageId,
            WorkflowStageUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        WorkflowStageEntity stage = workflowStageRepository.findById(stageId)
                .orElseThrow(() -> new NotFoundException("Workflow stage not found"));
        if (!stage.getProjectId().equals(projectId)) {
            throw new BadRequestException("Workflow stage does not belong to this project");
        }

        stage.setName(request.name().trim());
        WorkflowStageEntity saved = workflowStageRepository.save(stage);
        return toWorkflowStageResponse(saved);
    }

    @Transactional
    public void deleteStage(String userIdHeader, UUID projectId, UUID stageId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        WorkflowStageEntity stage = workflowStageRepository.findById(stageId)
                .orElseThrow(() -> new NotFoundException("Workflow stage not found"));
        if (!stage.getProjectId().equals(projectId)) {
            throw new BadRequestException("Workflow stage does not belong to this project");
        }
        if (taskRepository.countByProjectIdAndStageId(projectId, stageId) > 0) {
            throw new BadRequestException("Cannot delete a stage with assigned tasks");
        }

        workflowStageRepository.delete(stage);
        resequenceStages(projectId);
    }

    @Transactional
    public List<WorkflowStageResponse> reorderStages(String userIdHeader, UUID projectId,
            WorkflowStageReorderRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        List<WorkflowStageEntity> stages = workflowStageRepository.findByProjectIdOrderByStageOrderAsc(projectId);
        if (request.orderedStageIds() == null || request.orderedStageIds().isEmpty()) {
            throw new BadRequestException("Stage order list cannot be empty");
        }

        Set<UUID> existingIds = stages.stream().map(WorkflowStageEntity::getId).collect(Collectors.toSet());
        Set<UUID> requestedIds = new HashSet<>(request.orderedStageIds());
        if (requestedIds.size() != request.orderedStageIds().size()) {
            throw new BadRequestException("Stage order list cannot contain duplicates");
        }
        if (!existingIds.equals(requestedIds)) {
            throw new BadRequestException("Stage order list must include all stages exactly once");
        }

        int order = 1;
        for (UUID stageId : request.orderedStageIds()) {
            WorkflowStageEntity stage = stages.stream()
                    .filter(s -> s.getId().equals(stageId))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Invalid stage in order list"));
            stage.setStageOrder(order++);
        }
        workflowStageRepository.saveAll(stages);

        return stages.stream()
                .sorted((a, b) -> Integer.compare(a.getStageOrder(), b.getStageOrder()))
                .map(this::toWorkflowStageResponse)
                .collect(Collectors.toList());
    }

    // ── Milestones ─────────────────────────────────────────────────────────────

    public List<MilestoneResponse> listMilestones(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        return projectMilestoneRepository.findByProjectIdOrderBySortOrderAsc(projectId)
                .stream()
                .map(this::toMilestoneResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MilestoneResponse createMilestone(String userIdHeader, UUID projectId, MilestoneUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("Milestone title is required");
        }

        int sortOrder = nextMilestoneOrder(projectId, request.sortOrder());
        LocalDate targetDate = request.targetDate();
        validateMilestoneDateWithinProject(project, targetDate);
        validateMilestoneChronology(projectId, null, sortOrder, targetDate);

        ProjectMilestoneEntity milestone = new ProjectMilestoneEntity();
        milestone.setTenantId(tenantId);
        milestone.setProjectId(projectId);
        milestone.setTitle(request.title().trim());
        milestone.setTargetDate(targetDate);
        milestone.setStatus(normalizeMilestoneStatus(request.status()));
        milestone.setSortOrder(sortOrder);
        milestone.setProgressOverride(normalizeMilestoneProgress(request.progress()));
        ProjectMilestoneEntity saved = projectMilestoneRepository.save(milestone);
        return toMilestoneResponse(saved);
    }

    @Transactional
    public MilestoneResponse updateMilestone(String userIdHeader, UUID projectId, UUID milestoneId,
            MilestoneUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectMilestoneEntity milestone = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new NotFoundException("Milestone not found"));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new BadRequestException("Milestone does not belong to this project");
        }

        LocalDate candidateTargetDate = request.targetDate() != null
                ? request.targetDate()
                : milestone.getTargetDate();
        Integer candidateSortOrder = request.sortOrder() != null
                ? request.sortOrder()
                : milestone.getSortOrder();

        validateMilestoneDateWithinProject(project, candidateTargetDate);
        validateMilestoneChronology(projectId, milestoneId, candidateSortOrder, candidateTargetDate);

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new BadRequestException("Milestone title cannot be blank");
            }
            milestone.setTitle(request.title().trim());
        }
        if (request.targetDate() != null) {
            milestone.setTargetDate(request.targetDate());
        }
        if (request.status() != null && !request.status().isBlank()) {
            milestone.setStatus(normalizeMilestoneStatus(request.status()));
        }
        if (request.sortOrder() != null) {
            milestone.setSortOrder(request.sortOrder());
        }
        if (request.progress() != null) {
            milestone.setProgressOverride(normalizeMilestoneProgress(request.progress()));
        }

        ProjectMilestoneEntity saved = projectMilestoneRepository.save(milestone);
        return toMilestoneResponse(saved);
    }

    @Transactional
    public void deleteMilestone(String userIdHeader, UUID projectId, UUID milestoneId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectMilestoneEntity milestone = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new NotFoundException("Milestone not found"));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new BadRequestException("Milestone does not belong to this project");
        }
        projectMilestoneRepository.delete(milestone);
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────

    public List<TaskResponse> listTasks(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        List<TaskEntity> tasks = taskRepository.findByTenantIdAndProjectIdOrderByCreatedAtDesc(tenantId, projectId);
        return toTaskResponses(tasks, currentUser, tenantId);
    }

    public TaskPageResponse listMyTasks(
            String userIdHeader,
            String tab,
            String search,
            String status,
            String priority,
            UUID stageId,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = normalizeMyTasksPageSize(size);
        String normalizedTab = normalizeMyTasksTab(tab);
        Set<TaskStatus> statusFilter = parseTaskStatusFilter(status);
        Set<TaskPriority> priorityFilter = parseTaskPriorityFilter(priority);

        List<TaskEntity> tasks = taskRepository.findAssignedOrReportedToUser(tenantId, currentUser.getId());
        if (tasks.isEmpty()) {
            return new TaskPageResponse(List.of(), normalizedPage, normalizedSize, 0, 0, false);
        }

        List<UUID> projectIds = tasks.stream().map(TaskEntity::getProjectId).distinct().toList();
        Set<UUID> visibleProjectIds;
        if (isManager(currentUser)) {
            visibleProjectIds = new HashSet<>(projectIds);
        } else {
            visibleProjectIds = projectMemberRepository.findByIdProjectIdIn(projectIds)
                    .stream()
                    .filter(member -> member.getId().getUserId().equals(currentUser.getId()))
                    .map(member -> member.getId().getProjectId())
                    .collect(Collectors.toSet());
        }

        List<UUID> taskIds = tasks.stream().map(TaskEntity::getId).toList();
        Map<UUID, Set<UUID>> assigneesByTaskId = taskAssigneeRepository.findByIdTaskIdIn(taskIds)
                .stream()
                .collect(Collectors.groupingBy(
                        assignee -> assignee.getId().getTaskId(),
                        Collectors.mapping(assignee -> assignee.getId().getUserId(), Collectors.toSet())));

        Map<UUID, ProjectEntity> projectsById = projectRepository.findAllById(projectIds)
                .stream()
                .filter(project -> tenantId.equals(project.getTenantId()))
                .collect(Collectors.toMap(ProjectEntity::getId, p -> p));

        List<TaskEntity> filteredTasks = tasks.stream()
                .filter(task -> visibleProjectIds.contains(task.getProjectId()))
                .filter(task -> matchesMyTaskTab(
                        task,
                        normalizedTab,
                        currentUser.getId(),
                        assigneesByTaskId.getOrDefault(task.getId(), Set.of())))
                .filter(task -> matchesTaskSearch(task, projectsById.get(task.getProjectId()), search))
                .filter(task -> statusFilter == null || statusFilter.contains(safeTaskStatus(task)))
                .filter(task -> priorityFilter == null || priorityFilter.contains(safeTaskPriority(task)))
                .filter(task -> stageId == null || Objects.equals(task.getStageId(), stageId))
                .collect(Collectors.toCollection(ArrayList::new));

        filteredTasks.sort(buildMyTasksComparator(sortBy, sortDir));

        long totalElements = filteredTasks.size();
        int fromIndex = Math.min(normalizedPage * normalizedSize, filteredTasks.size());
        int toIndex = Math.min(fromIndex + normalizedSize, filteredTasks.size());
        List<TaskEntity> pageTasks = fromIndex >= toIndex
                ? List.of()
                : filteredTasks.subList(fromIndex, toIndex);

        int totalPages = totalElements == 0
                ? 0
                : (int) Math.ceil((double) totalElements / normalizedSize);
        boolean hasNext = normalizedPage + 1 < totalPages;

        return new TaskPageResponse(
                toTaskResponses(pageTasks, currentUser, tenantId),
                normalizedPage,
                normalizedSize,
                totalElements,
                totalPages,
                hasNext);
    }

    public TaskResponse getTask(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());
        return toTaskResponse(task, currentUser);
    }

    public TaskDetailResponse getTaskDetail(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());
        return toTaskDetailResponse(task, currentUser, tenantId);
    }

    @Transactional
    public TaskResponse createTask(String userIdHeader, UUID projectId, TaskUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        TaskEntity task = new TaskEntity();
        task.setTenantId(tenantId);
        task.setProjectId(projectId);
        task.setCreatedBy(currentUser.getId());
        task.setUpdatedBy(currentUser.getId());
        TaskStatus requestedStatus = parseTaskStatus(request.status(), task.getStatus());
        validateTaskPrerequisitesForStatus(requestedStatus, request.assigneeIds(), request.reporterId(),
                request.progress(), request.actualEffort());
        if (request.reporterId() != null) {
            requireUser(request.reporterId(), tenantId);
        }
        applyTaskUpsert(task, request, currentUser);
        task.setTaskKey(generateTaskKey(tenantId, projectId));
        if (task.getStartDate() == null) {
            task.setStartDate(LocalDate.now());
        }

        TaskEntity saved = taskRepository.save(task);
        saveAssignees(tenantId, saved.getId(), request.assigneeIds());
        syncTaskTagLinks(tenantId, saved.getId(), saved.getTags());
        logActivity(tenantId, saved.getId(), currentUser.getId(), "created", saved.getTitle());
        logAssigneeChanges(tenantId, saved.getId(), currentUser.getId(), List.of(), request.assigneeIds());
        return toTaskResponse(saved, currentUser);
    }

    @Transactional
    public TaskResponse updateTask(String userIdHeader, UUID taskId, TaskUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        TaskStatus nextStatus = parseTaskStatus(request.status(), task.getStatus());
        if (nextStatus != task.getStatus()) {
            validateTaskTransition(task.getStatus(), nextStatus);
            UUID reporterId = request.reporterId() != null ? request.reporterId() : task.getReporterId();
            Integer effectiveProgress = request.progress() != null ? request.progress() : task.getProgress();
            BigDecimal effectiveEffort = request.actualEffort() != null ? request.actualEffort()
                    : task.getActualEffort();
            validateTaskPrerequisitesForStatus(nextStatus, request.assigneeIds(), reporterId, effectiveProgress,
                    effectiveEffort);
        }
        if (request.reporterId() != null && !request.reporterId().equals(task.getReporterId())) {
            requireUser(request.reporterId(), tenantId);
        }

        TaskStatus previousStatus = task.getStatus();
        TaskPriority previousPriority = task.getPriority();
        Integer previousProgress = task.getProgress();
        LocalDate previousDueDate = task.getDueDate();
        List<UUID> previousAssignees = taskAssigneeRepository.findByIdTaskId(taskId)
                .stream()
                .map(a -> a.getId().getUserId())
                .toList();

        applyTaskUpsert(task, request, currentUser);
        TaskEntity saved = taskRepository.save(task);
        saveAssignees(tenantId, saved.getId(), request.assigneeIds());
        syncTaskTagLinks(tenantId, saved.getId(), saved.getTags());
        logTaskChanges(
                tenantId,
                saved,
                currentUser.getId(),
                previousStatus,
                previousPriority,
                previousProgress,
                previousDueDate,
                previousAssignees,
                request.assigneeIds());
        return toTaskResponse(saved, currentUser);
    }

    @Transactional
    public TaskResponse updateTaskStage(String userIdHeader, UUID taskId, TaskStageUpdateRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        WorkflowStageEntity stage = workflowStageRepository.findById(request.stageId())
                .orElseThrow(() -> new NotFoundException("Workflow stage not found"));
        if (!stage.getProjectId().equals(task.getProjectId())) {
            throw new BadRequestException("Stage does not belong to the task's project");
        }

        TaskStatus previousStatus = task.getStatus();
        Integer previousProgress = task.getProgress();
        UUID previousStageId = task.getStageId();

        TaskStatus nextStatus = parseTaskStatus(request.status(), task.getStatus());
        if (nextStatus != task.getStatus()) {
            validateTaskTransition(task.getStatus(), nextStatus);
            List<UUID> assigneeIds = taskAssigneeRepository.findByIdTaskId(taskId)
                    .stream()
                    .map(a -> a.getId().getUserId())
                    .toList();
            Integer effectiveProgress = request.progress() != null ? request.progress() : task.getProgress();
            validateTaskPrerequisitesForStatus(nextStatus, assigneeIds, task.getReporterId(), effectiveProgress,
                    task.getActualEffort());
        }

        task.setStageId(request.stageId());
        task.setStatus(nextStatus);
        if (request.progress() != null) {
            task.setProgress(request.progress());
        }
        task.setUpdatedBy(currentUser.getId());

        TaskEntity saved = taskRepository.save(task);
        if (!Objects.equals(previousStatus, saved.getStatus())) {
            logActivity(tenantId, saved.getId(), currentUser.getId(), "status_changed",
                    formatChange(previousStatus, saved.getStatus()));
        }
        if (!Objects.equals(previousProgress, saved.getProgress())) {
            logActivity(tenantId, saved.getId(), currentUser.getId(), "progress_changed",
                    formatChange(previousProgress, saved.getProgress()));
        }
        if (!Objects.equals(previousStageId, saved.getStageId())) {
            logActivity(tenantId, saved.getId(), currentUser.getId(), "stage_changed",
                    formatChange(previousStageId, saved.getStageId()));
        }

        return toTaskResponse(saved, currentUser);
    }

    @Transactional
    public void deleteTask(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        // Nullify parent reference on child tasks
        List<TaskEntity> children = taskRepository.findByTenantIdAndParentTaskId(tenantId, taskId);
        for (TaskEntity child : children) {
            child.setParentTaskId(null);
            taskRepository.save(child);
        }

        // Delete all related entities
        taskAssigneeRepository.deleteByIdTaskId(taskId);
        taskTagLinkRepository.deleteByIdTaskId(taskId);
        taskDependencyRepository.deleteByIdTaskId(taskId);
        taskDependencyRepository.deleteByIdBlockedByTaskId(taskId);
        taskSubtaskRepository.deleteByTaskId(taskId);
        taskReviewRepository.deleteByTaskId(taskId);
        taskCommentRepository.deleteByTaskId(taskId);
        taskActivityRepository.deleteByTaskId(taskId);

        taskRepository.delete(task);
    }

    @Transactional
    public TaskResponse addDependency(String userIdHeader, UUID taskId, TaskDependencyRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        TaskEntity blocker = requireTask(request.blockedByTaskId(), tenantId);
        if (!task.getProjectId().equals(blocker.getProjectId())) {
            throw new BadRequestException("Tasks must belong to the same project");
        }
        if (taskId.equals(blocker.getId())) {
            throw new BadRequestException("A task cannot depend on itself");
        }
        if (taskDependencyRepository.existsByIdTaskIdAndIdBlockedByTaskId(taskId, blocker.getId())) {
            throw new BadRequestException("Dependency already exists");
        }
        if (hasDependencyPath(blocker.getId(), taskId)) {
            throw new BadRequestException("Circular dependency detected");
        }

        TaskDependencyEntity dependency = new TaskDependencyEntity();
        dependency.setId(new TaskDependencyId(taskId, blocker.getId()));
        taskDependencyRepository.save(dependency);
        logActivity(tenantId, taskId, currentUser.getId(), "dependency_added", blocker.getTitle());
        return toTaskResponse(task, currentUser);
    }

    @Transactional
    public TaskResponse removeDependency(String userIdHeader, UUID taskId, UUID blockedByTaskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        TaskEntity blocker = requireTask(blockedByTaskId, tenantId);
        if (!task.getProjectId().equals(blocker.getProjectId())) {
            throw new BadRequestException("Tasks must belong to the same project");
        }
        if (!taskDependencyRepository.existsByIdTaskIdAndIdBlockedByTaskId(taskId, blockedByTaskId)) {
            throw new NotFoundException("Dependency not found");
        }

        taskDependencyRepository.deleteByIdTaskIdAndIdBlockedByTaskId(taskId, blockedByTaskId);
        logActivity(tenantId, taskId, currentUser.getId(), "dependency_removed", blocker.getTitle());
        return toTaskResponse(task, currentUser);
    }

    @Transactional
    public TaskResponse reviewTask(String userIdHeader, UUID taskId, ReviewCreateRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());

        boolean canReview = isManager(currentUser)
                || (task.getReporterId() != null && task.getReporterId().equals(currentUser.getId()));
        if (!canReview) {
            throw new ForbiddenException("You do not have review permission for this task");
        }

        // Guard enum parsing to avoid NPEs and invalid enum values from client input.
        ReviewAction action = parseReviewAction(request.action());
        TaskReviewEntity review = new TaskReviewEntity();
        review.setTenantId(tenantId);
        review.setTaskId(taskId);
        review.setReviewerId(currentUser.getId());
        review.setAction(action.name());
        review.setContent(request.content());
        taskReviewRepository.save(review);

        if (action == ReviewAction.CHANGES_REQUESTED && request.content() != null && !request.content().isBlank()) {
            TaskCommentEntity rejection = new TaskCommentEntity();
            rejection.setTenantId(tenantId);
            rejection.setTaskId(taskId);
            rejection.setAuthorId(currentUser.getId());
            rejection.setContent("[REJECTION] " + request.content().trim());
            taskCommentRepository.save(rejection);
        }

        TaskStatus previousStatus = task.getStatus();

        if (action == ReviewAction.APPROVED) {
            task.setStatus(TaskStatus.DONE);
            task.setProgress(100);
        } else if (action == ReviewAction.CHANGES_REQUESTED) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }

        task.setUpdatedBy(currentUser.getId());
        taskRepository.save(task);
        String reviewValue = switch (action) {
            case APPROVED -> "Approved";
            case CHANGES_REQUESTED -> {
                if (request.content() != null && !request.content().isBlank()) {
                    yield "Changes requested: " + request.content().trim();
                }
                yield "Changes requested";
            }
            default -> request.content() == null ? "Commented" : request.content().trim();
        };
        logActivity(tenantId, task.getId(), currentUser.getId(), "reviewed", reviewValue);
        if (previousStatus != task.getStatus()) {
            logActivity(
                    tenantId,
                    task.getId(),
                    currentUser.getId(),
                    "status_changed",
                    formatChange(previousStatus, task.getStatus()));
        }
        return toTaskResponse(task, currentUser);
    }

    public ReviewQueuePageResponse reviewQueue(
            String userIdHeader,
            String projectIdentifier,
            String status,
            Boolean changesRequested,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);

        UUID projectId = null;
        if (projectIdentifier != null && !projectIdentifier.isBlank()) {
            projectId = resolveProjectId(projectIdentifier, tenantId);
        }

        Set<TaskStatus> statuses = parseReviewStatuses(status);
        Pageable pageable = buildReviewPageable(page, size, sortBy, sortDir);

        Page<TaskEntity> taskPage;
        if (isManager(currentUser)) {
            if (Boolean.TRUE.equals(changesRequested)) {
                // "Changes Requested" tab: tasks that have had changes requested
                taskPage = projectId == null
                        ? taskRepository.findReviewQueueWithChangesHistory(tenantId, statuses, pageable)
                        : taskRepository.findReviewQueueByProjectWithChangesHistory(tenantId, projectId, statuses,
                                pageable);
            } else if (Boolean.FALSE.equals(changesRequested)) {
                // "Pending Review" tab: fresh IN_REVIEW tasks with no CHANGES_REQUESTED history
                taskPage = projectId == null
                        ? taskRepository.findPendingReviewQueue(tenantId, pageable)
                        : taskRepository.findPendingReviewQueueByProject(tenantId, projectId, pageable);
            } else {
                // All other manager tabs (all, approved)
                taskPage = projectId == null
                        ? taskRepository.findReviewQueue(tenantId, statuses, pageable)
                        : taskRepository.findReviewQueueByProject(tenantId, projectId, statuses, pageable);
            }
        } else {
            if (Boolean.TRUE.equals(changesRequested)) {
                // "Rework Needed" tab: tasks that have had changes requested
                taskPage = projectId == null
                        ? taskRepository.findReviewQueueByAssigneeWithChangesHistory(tenantId, currentUser.getId(),
                                statuses, pageable)
                        : taskRepository.findReviewQueueByProjectAndAssigneeWithChangesHistory(
                                tenantId, projectId, currentUser.getId(), statuses, pageable);
            } else if (Boolean.FALSE.equals(changesRequested)) {
                // "Under Review" tab: fresh submissions with no CHANGES_REQUESTED history
                taskPage = projectId == null
                        ? taskRepository.findUnderReviewByAssignee(tenantId, currentUser.getId(), pageable)
                        : taskRepository.findUnderReviewByProjectAndAssignee(tenantId, projectId, currentUser.getId(),
                                pageable);
            } else {
                // All other employee tabs (all, approved)
                taskPage = projectId == null
                        ? taskRepository.findReviewQueueByAssignee(tenantId, currentUser.getId(), statuses, pageable)
                        : taskRepository.findReviewQueueByProjectAndAssignee(
                                tenantId,
                                projectId,
                                currentUser.getId(),
                                statuses,
                                pageable);
            }
        }

        List<TaskResponse> content = toTaskResponses(taskPage.getContent(), currentUser, tenantId);
        return new ReviewQueuePageResponse(
                content,
                taskPage.getNumber(),
                taskPage.getSize(),
                taskPage.getTotalElements(),
                taskPage.getTotalPages(),
                taskPage.hasNext());
    }

    // ── Task comments ─────────────────────────────────────────────────────────

    @Transactional
    public TaskCommentResponse addComment(String userIdHeader, UUID taskId, TaskCommentRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());

        TaskCommentEntity comment = new TaskCommentEntity();
        comment.setTenantId(tenantId);
        comment.setTaskId(taskId);
        comment.setAuthorId(currentUser.getId());
        comment.setContent(request.content());
        TaskCommentEntity saved = taskCommentRepository.save(comment);

        return new TaskCommentResponse(
                saved.getId(),
                saved.getAuthorId(),
                fullName(currentUser),
                currentUser.getAvatarUrl(),
                saved.getContent(),
                asOffset(saved.getCreatedAt()));
    }

    public List<TaskCommentResponse> listComments(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());

        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(c -> {
                    AppUserEntity author = appUserRepository.findById(c.getAuthorId()).orElse(null);
                    return new TaskCommentResponse(
                            c.getId(),
                            c.getAuthorId(),
                            author == null ? "Unknown" : fullName(author),
                            author == null ? null : author.getAvatarUrl(),
                            c.getContent(),
                            asOffset(c.getCreatedAt()));
                })
                .collect(Collectors.toList());
    }

    // ── Task subtasks ───────────────────────────────────────────────────────

    @Transactional
    public TaskSubtaskResponse createSubtask(String userIdHeader, UUID taskId, TaskSubtaskRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("Subtask title is required");
        }

        TaskSubtaskEntity subtask = new TaskSubtaskEntity();
        subtask.setTenantId(tenantId);
        subtask.setTaskId(taskId);
        subtask.setTitle(request.title().trim());
        subtask.setCompleted(Boolean.TRUE.equals(request.completed()));
        TaskSubtaskEntity saved = taskSubtaskRepository.save(subtask);

        logActivity(tenantId, taskId, currentUser.getId(), "subtask_added", saved.getTitle());
        return new TaskSubtaskResponse(saved.getId(), saved.getTitle(), Boolean.TRUE.equals(saved.getCompleted()));
    }

    @Transactional
    public TaskSubtaskResponse updateSubtask(String userIdHeader, UUID taskId, UUID subtaskId,
            TaskSubtaskRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        TaskSubtaskEntity subtask = taskSubtaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new NotFoundException("Subtask not found"));

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new BadRequestException("Subtask title cannot be blank");
            }
            subtask.setTitle(request.title().trim());
        }
        if (request.completed() != null) {
            subtask.setCompleted(request.completed());
        }

        TaskSubtaskEntity saved = taskSubtaskRepository.save(subtask);
        logActivity(tenantId, taskId, currentUser.getId(), "subtask_updated", saved.getTitle());
        return new TaskSubtaskResponse(saved.getId(), saved.getTitle(), Boolean.TRUE.equals(saved.getCompleted()));
    }

    @Transactional
    public void deleteSubtask(String userIdHeader, UUID taskId, UUID subtaskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        TaskSubtaskEntity subtask = taskSubtaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new NotFoundException("Subtask not found"));
        taskSubtaskRepository.delete(subtask);
        logActivity(tenantId, taskId, currentUser.getId(), "subtask_deleted", subtask.getTitle());
    }

    // ── Users search ──────────────────────────────────────────────────────────

    public List<UserSearchResponse> searchUsers(String userIdHeader, String query) {
        UUID tenantId = tenantId();
        requireUser(parseUserId(userIdHeader), tenantId);

        List<AppUserEntity> all = appUserRepository.findByTenantIdOrderByFirstNameAsc(tenantId);
        String lq = query == null ? "" : query.trim().toLowerCase();

        return all.stream()
                .filter(u -> {
                    if (lq.isEmpty())
                        return true;
                    String name = fullName(u).toLowerCase();
                    return name.contains(lq) || (u.getEmail() != null && u.getEmail().toLowerCase().contains(lq));
                })
                .limit(30)
                .map(u -> new UserSearchResponse(u.getId(), fullName(u), u.getAvatarUrl()))
                .collect(Collectors.toList());
    }

    // ── Settings: Company tags ───────────────────────────────────────────────

    public List<CompanyTagResponse> listCompanyTags(String userIdHeader) {
        UUID tenantId = tenantId();
        requireUser(parseUserId(userIdHeader), tenantId);
        return companyTagRepository.findByTenantIdOrderByNameAsc(tenantId)
                .stream()
                .map(this::toCompanyTagResponse)
                .toList();
    }

    @Transactional
    public CompanyTagResponse createCompanyTag(String userIdHeader, CompanyTagUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireManager(currentUser);

        String normalizedName = normalizeCompanyTagName(request.name());
        if (companyTagRepository.existsByTenantIdAndNormalizedName(tenantId, normalizedName)) {
            throw new BadRequestException("Tag already exists");
        }

        CompanyTagEntity entity = new CompanyTagEntity();
        entity.setTenantId(tenantId);
        entity.setName(request.name().trim());
        entity.setNormalizedName(normalizedName);
        entity.setColor(normalizeCompanyTagColor(request.color()));
        entity.setCreatedBy(currentUser.getId());
        entity.setUpdatedBy(currentUser.getId());

        CompanyTagEntity saved = companyTagRepository.save(entity);
        return toCompanyTagResponse(saved);
    }

    @Transactional
    public CompanyTagResponse updateCompanyTag(String userIdHeader, UUID tagId, CompanyTagUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireManager(currentUser);

        CompanyTagEntity entity = companyTagRepository.findByIdAndTenantId(tagId, tenantId)
                .orElseThrow(() -> new NotFoundException("Company tag not found"));

        String normalizedName = normalizeCompanyTagName(request.name());
        if (companyTagRepository.existsByTenantIdAndNormalizedNameAndIdNot(tenantId, normalizedName, tagId)) {
            throw new BadRequestException("Tag already exists");
        }

        entity.setName(request.name().trim());
        entity.setNormalizedName(normalizedName);
        entity.setColor(normalizeCompanyTagColor(request.color()));
        entity.setUpdatedBy(currentUser.getId());

        CompanyTagEntity saved = companyTagRepository.save(entity);
        return toCompanyTagResponse(saved);
    }

    @Transactional
    public void deleteCompanyTag(String userIdHeader, UUID tagId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireManager(currentUser);

        CompanyTagEntity entity = companyTagRepository.findByIdAndTenantId(tagId, tenantId)
                .orElseThrow(() -> new NotFoundException("Company tag not found"));
        companyTagRepository.delete(entity);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private List<ProjectResponse> toProjectResponses(List<ProjectEntity> projects, AppUserEntity currentUser,
            UUID tenantId) {
        if (projects.isEmpty()) {
            return List.of();
        }

        ProjectMappingContext context = buildProjectMappingContext(projects, tenantId);
        List<ProjectResponse> responses = new ArrayList<>(projects.size());
        for (ProjectEntity project : projects) {
            responses.add(toProjectResponse(project, currentUser, context));
        }
        return responses;
    }

    private ProjectResponse toProjectResponse(ProjectEntity project, AppUserEntity currentUser) {
        ProjectMappingContext context = buildProjectMappingContext(List.of(project), project.getTenantId());
        return toProjectResponse(project, currentUser, context);
    }

    private ProjectResponse toProjectResponse(ProjectEntity project, AppUserEntity currentUser,
            ProjectMappingContext context) {
        List<ProjectMemberEntity> members = context.membersByProjectId().getOrDefault(project.getId(), List.of());
        List<UserSummaryResponse> assignees = new ArrayList<>(members.size());
        for (ProjectMemberEntity member : members) {
            AppUserEntity user = context.usersById().get(member.getId().getUserId());
            if (user != null) {
                assignees.add(new UserSummaryResponse(user.getId(), fullName(user), user.getAvatarUrl()));
            }
        }

        return new ProjectResponse(
                project.getId(),
                project.getSlug(),
                project.getName(),
                project.getDescription(),
                project.getManagerId(),
                project.getCustomer(),
                toFrontendProjectStatus(safeProjectStatus(project).name()),
                safeProjectPriority(project).name().toLowerCase(),
                project.getProgress() == null ? 0 : project.getProgress(),
                project.getDueDate(),
                safeTags(project.getTags()),
                asOffset(project.getCreatedAt()),
                asOffset(project.getUpdatedAt()),
                assignees,
                canManageProject(currentUser, project.getId()));
    }

    private ProjectMappingContext buildProjectMappingContext(List<ProjectEntity> projects, UUID tenantId) {
        if (projects.isEmpty()) {
            return new ProjectMappingContext(Map.of(), Map.of());
        }

        List<UUID> projectIds = projects.stream().map(ProjectEntity::getId).toList();
        List<ProjectMemberEntity> memberEntities = projectMemberRepository.findByIdProjectIdIn(projectIds);

        Map<UUID, List<ProjectMemberEntity>> membersByProjectId = memberEntities.stream()
                .collect(Collectors.groupingBy(m -> m.getId().getProjectId()));

        Set<UUID> userIds = memberEntities.stream()
                .map(m -> m.getId().getUserId())
                .collect(Collectors.toSet());

        Map<UUID, AppUserEntity> usersById = appUserRepository
                .findAllById(userIds)
                .stream()
                .filter(user -> tenantId.equals(user.getTenantId()))
                .collect(Collectors.toMap(AppUserEntity::getId, u -> u));

        return new ProjectMappingContext(membersByProjectId, usersById);
    }

    private record ProjectMappingContext(
            Map<UUID, List<ProjectMemberEntity>> membersByProjectId,
            Map<UUID, AppUserEntity> usersById) {
    }

    private List<TaskResponse> toTaskResponses(List<TaskEntity> tasks, AppUserEntity currentUser, UUID tenantId) {
        if (tasks.isEmpty()) {
            return List.of();
        }

        TaskMappingContext context = buildTaskMappingContext(tasks, tenantId);
        List<TaskResponse> responses = new ArrayList<>(tasks.size());
        for (TaskEntity task : tasks) {
            responses.add(toTaskResponse(task, currentUser, context));
        }
        return responses;
    }

    private TaskResponse toTaskResponse(TaskEntity task, AppUserEntity currentUser) {
        TaskMappingContext context = buildTaskMappingContext(List.of(task), task.getTenantId());
        return toTaskResponse(task, currentUser, context);
    }

    private TaskResponse toTaskResponse(TaskEntity task, AppUserEntity currentUser, TaskMappingContext context) {
        ProjectEntity project = context.projectsById().get(task.getProjectId());
        List<TaskAssigneeEntity> taskAssignees = context.assigneesByTaskId().getOrDefault(task.getId(), List.of());
        Set<UUID> assigneeIds = new HashSet<>();
        List<UserSummaryResponse> assignees = new ArrayList<>(taskAssignees.size());
        for (TaskAssigneeEntity assignee : taskAssignees) {
            UUID assigneeId = assignee.getId().getUserId();
            assigneeIds.add(assigneeId);
            AppUserEntity user = context.usersById().get(assigneeId);
            if (user != null) {
                assignees.add(new UserSummaryResponse(user.getId(), fullName(user), user.getAvatarUrl()));
            }
        }

        List<TaskReviewEntity> taskReviews = context.reviewsByTaskId().getOrDefault(task.getId(), List.of());
        List<TaskReviewResponse> reviews = taskReviews.stream()
                .map(review -> {
                    AppUserEntity author = context.usersById().get(review.getReviewerId());
                    return new TaskReviewResponse(
                            review.getId(),
                            review.getReviewerId(),
                            author == null ? "Unknown" : fullName(author),
                            author == null ? null : author.getAvatarUrl(),
                            toFrontendReviewAction(review.getAction()),
                            review.getContent(),
                            asOffset(review.getCreatedAt()));
                })
                .toList();

        boolean canEdit = isManager(currentUser)
                || assigneeIds.contains(currentUser.getId())
                || (task.getReporterId() != null && task.getReporterId().equals(currentUser.getId()));
        boolean canReview = isManager(currentUser)
                || (task.getReporterId() != null && task.getReporterId().equals(currentUser.getId()));

        List<UUID> blockedBy = context.dependenciesByTaskId().getOrDefault(task.getId(), List.of())
                .stream()
                .map(dep -> dep.getId().getBlockedByTaskId())
                .toList();

        AppUserEntity reporter = task.getReporterId() == null ? null : context.usersById().get(task.getReporterId());

        return new TaskResponse(
                task.getId(),
                task.getProjectId(),
                task.getStageId(),
                task.getMilestoneId(),
                project == null ? "Project" : project.getName(),
                project == null ? null : project.getSlug(),
                task.getTitle(),
                task.getDescription(),
                safeTaskPriority(task).name().toLowerCase(),
                safeTaskStatus(task).name(),
                task.getProgress() == null ? 0 : task.getProgress(),
                task.getStartDate(),
                task.getDueDate(),
                assignees,
                safeTags(task.getTags()),
                task.getReporterId(),
                reporter == null ? null : fullName(reporter),
                task.getEstimatedEffort(),
                task.getActualEffort(),
                blockedBy,
                reviews,
                asOffset(task.getCreatedAt()),
                asOffset(task.getUpdatedAt()),
                resolveTaskKey(task, project),
                canEdit,
                canReview,
                task.getBlockedReason());
    }

    private TaskMappingContext buildTaskMappingContext(List<TaskEntity> tasks, UUID tenantId) {
        if (tasks.isEmpty()) {
            return new TaskMappingContext(Map.of(), Map.of(), Map.of(), Map.of(), Map.of());
        }

        List<UUID> taskIds = tasks.stream().map(TaskEntity::getId).toList();
        List<UUID> projectIds = tasks.stream().map(TaskEntity::getProjectId).distinct().toList();

        List<TaskAssigneeEntity> assignees = taskAssigneeRepository.findByIdTaskIdIn(taskIds);
        List<TaskReviewEntity> reviews = taskReviewRepository.findByTenantIdAndTaskIdInOrderByCreatedAtAsc(tenantId,
                taskIds);
        List<TaskDependencyEntity> dependencies = taskDependencyRepository.findByIdTaskIdIn(taskIds);

        Map<UUID, List<TaskAssigneeEntity>> assigneesByTaskId = assignees.stream()
                .collect(Collectors.groupingBy(a -> a.getId().getTaskId()));

        Map<UUID, List<TaskReviewEntity>> reviewsByTaskId = reviews.stream()
                .collect(Collectors.groupingBy(TaskReviewEntity::getTaskId));

        Map<UUID, List<TaskDependencyEntity>> dependenciesByTaskId = dependencies.stream()
                .collect(Collectors.groupingBy(d -> d.getId().getTaskId()));

        Set<UUID> userIds = new HashSet<>();
        for (TaskAssigneeEntity assignee : assignees) {
            userIds.add(assignee.getId().getUserId());
        }
        for (TaskReviewEntity review : reviews) {
            userIds.add(review.getReviewerId());
        }
        for (TaskEntity task : tasks) {
            if (task.getReporterId() != null) {
                userIds.add(task.getReporterId());
            }
        }

        Map<UUID, ProjectEntity> projectsById = projectRepository.findAllById(projectIds)
                .stream()
                .filter(project -> tenantId.equals(project.getTenantId()))
                .collect(Collectors.toMap(ProjectEntity::getId, p -> p));

        Map<UUID, AppUserEntity> usersById = appUserRepository.findAllById(userIds)
                .stream()
                .filter(user -> tenantId.equals(user.getTenantId()))
                .collect(Collectors.toMap(AppUserEntity::getId, u -> u));

        return new TaskMappingContext(assigneesByTaskId, reviewsByTaskId, dependenciesByTaskId, usersById,
                projectsById);
    }

    private record TaskMappingContext(
            Map<UUID, List<TaskAssigneeEntity>> assigneesByTaskId,
            Map<UUID, List<TaskReviewEntity>> reviewsByTaskId,
            Map<UUID, List<TaskDependencyEntity>> dependenciesByTaskId,
            Map<UUID, AppUserEntity> usersById,
            Map<UUID, ProjectEntity> projectsById) {
    }

    private TaskDetailResponse toTaskDetailResponse(TaskEntity task, AppUserEntity currentUser, UUID tenantId) {
        ProjectEntity project = projectRepository.findByIdAndTenantId(task.getProjectId(), tenantId).orElse(null);
        List<TaskAssigneeEntity> taskAssignees = taskAssigneeRepository.findByIdTaskId(task.getId());
        List<TaskReviewEntity> reviewEntities = taskReviewRepository
                .findByTenantIdAndTaskIdOrderByCreatedAtAsc(tenantId, task.getId());
        List<TaskSubtaskEntity> subtaskEntities = taskSubtaskRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        List<TaskCommentEntity> commentEntities = taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        List<TaskActivityEntity> activityEntities = taskActivityRepository
                .findByTaskIdOrderByCreatedAtAsc(task.getId());

        Set<UUID> userIds = new HashSet<>();
        for (TaskAssigneeEntity assignee : taskAssignees) {
            userIds.add(assignee.getId().getUserId());
        }
        for (TaskReviewEntity reviewEntity : reviewEntities) {
            userIds.add(reviewEntity.getReviewerId());
        }
        for (TaskCommentEntity commentEntity : commentEntities) {
            userIds.add(commentEntity.getAuthorId());
        }
        if (task.getReporterId() != null) {
            userIds.add(task.getReporterId());
        }
        for (TaskActivityEntity activityEntity : activityEntities) {
            if (activityEntity.getActorId() != null) {
                userIds.add(activityEntity.getActorId());
            }
        }

        Map<UUID, AppUserEntity> usersById = appUserRepository.findAllById(userIds)
                .stream()
                .filter(user -> tenantId.equals(user.getTenantId()))
                .collect(Collectors.toMap(AppUserEntity::getId, u -> u));

        List<UserSummaryResponse> assignees = new ArrayList<>();
        Set<UUID> assigneeIds = new HashSet<>();
        for (TaskAssigneeEntity assignee : taskAssignees) {
            UUID assigneeId = assignee.getId().getUserId();
            assigneeIds.add(assigneeId);
            AppUserEntity user = usersById.get(assigneeId);
            if (user != null) {
                assignees.add(new UserSummaryResponse(user.getId(), fullName(user), user.getAvatarUrl()));
            }
        }

        List<TaskReviewResponse> reviews = reviewEntities.stream()
                .map(review -> {
                    AppUserEntity author = usersById.get(review.getReviewerId());
                    return new TaskReviewResponse(
                            review.getId(),
                            review.getReviewerId(),
                            author == null ? "Unknown" : fullName(author),
                            author == null ? null : author.getAvatarUrl(),
                            toFrontendReviewAction(review.getAction()),
                            review.getContent(),
                            asOffset(review.getCreatedAt()));
                })
                .toList();

        boolean canEdit = isManager(currentUser)
                || assigneeIds.contains(currentUser.getId())
                || (task.getReporterId() != null && task.getReporterId().equals(currentUser.getId()));
        boolean canReview = isManager(currentUser)
                || (task.getReporterId() != null && task.getReporterId().equals(currentUser.getId()));

        List<TaskSubtaskResponse> subtasks = subtaskEntities
                .stream()
                .map(s -> new TaskSubtaskResponse(s.getId(), s.getTitle(), Boolean.TRUE.equals(s.getCompleted())))
                .collect(Collectors.toList());

        List<TaskCommentResponse> comments = commentEntities
                .stream()
                .map(c -> {
                    AppUserEntity author = usersById.get(c.getAuthorId());
                    return new TaskCommentResponse(
                            c.getId(),
                            c.getAuthorId(),
                            author == null ? "Unknown" : fullName(author),
                            author == null ? null : author.getAvatarUrl(),
                            c.getContent(),
                            asOffset(c.getCreatedAt()));
                })
                .collect(Collectors.toList());

        List<TaskActivityResponse> activities = activityEntities
                .stream()
                .map(a -> {
                    AppUserEntity actor = a.getActorId() != null ? usersById.get(a.getActorId()) : null;
                    return new TaskActivityResponse(
                            a.getId(),
                            a.getActorId(),
                            actor == null ? "System" : fullName(actor),
                            a.getAction(),
                            a.getValue(),
                            formatActivityDescription(a.getAction(), a.getValue()),
                            asOffset(a.getCreatedAt()));
                })
                .collect(Collectors.toList());

        List<UUID> blockedBy = taskDependencyRepository.findByIdTaskId(task.getId())
                .stream()
                .map(dep -> dep.getId().getBlockedByTaskId())
                .toList();

        return new TaskDetailResponse(
                task.getId(),
                task.getProjectId(),
                task.getStageId(),
                task.getMilestoneId(),
                project == null ? "Project" : project.getName(),
                project == null ? null : project.getSlug(),
                task.getTitle(),
                task.getDescription(),
                safeTaskPriority(task).name().toLowerCase(),
                safeTaskStatus(task).name(),
                task.getProgress() == null ? 0 : task.getProgress(),
                task.getStartDate(),
                task.getDueDate(),
                assignees,
                safeTags(task.getTags()),
                task.getReporterId(),
                task.getReporterId() == null ? null
                        : usersById.containsKey(task.getReporterId()) ? fullName(usersById.get(task.getReporterId()))
                                : null,
                task.getEstimatedEffort(),
                task.getActualEffort(),
                blockedBy,
                task.getBlockedReason(),
                reviews,
                asOffset(task.getCreatedAt()),
                asOffset(task.getUpdatedAt()),
                resolveTaskKey(task, project),
                canEdit,
                canReview,
                subtasks,
                comments,
                activities);
    }

    private void applyProjectUpsert(ProjectEntity project, ProjectUpsertRequest request) {
        String normalizedTitle = request.title() == null ? "" : request.title().trim();
        project.setName(normalizedTitle);
        project.setSlug(generateUniqueProjectSlug(project.getTenantId(), normalizedTitle, project.getId()));
        project.setDescription(request.description());
        // Guard enum parsing to avoid NPEs and invalid enum values from client input.
        project.setStatus(parseProjectStatus(request.status(), project.getStatus()));
        project.setPriority(parseTaskPriority(request.priority(), project.getPriority()));
        project.setProgress(request.progress() == null ? 0 : request.progress());
        validateProjectDateRange(request.startDate(), request.dueDate());
        project.setStartDate(request.startDate());
        // Keep legacy end_date aligned with due_date until old consumers are removed.
        project.setEndDate(request.dueDate());
        project.setDueDate(request.dueDate());
        // Normalize jsonb tags to a valid JSON string to prevent casting errors.
        project.setTags(normalizeTags(request.tags()));
        project.setManagerId(request.managerId());
        project.setCustomer(request.customer());
    }

    private void applyTaskUpsert(TaskEntity task, TaskUpsertRequest request, AppUserEntity currentUser) {
        // Guard enum parsing to avoid NPEs and invalid enum values from client input.
        TaskStatus nextStatus = parseTaskStatus(request.status(), task.getStatus());
        if (nextStatus == TaskStatus.IN_REVIEW && request.reporterId() == null && task.getReporterId() == null) {
            throw new BadRequestException("reporterId is required before moving task to IN_REVIEW");
        }

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(nextStatus);
        task.setPriority(parseTaskPriority(request.priority(), task.getPriority()));
        task.setProgress(request.progress() == null ? 0 : request.progress());
        task.setDueDate(request.dueDate());
        if (task.getStartDate() == null) {
            task.setStartDate(LocalDate.now());
        }
        if (request.reporterId() != null) {
            task.setReporterId(request.reporterId());
        }
        task.setEstimatedEffort(request.estimatedEffort());
        task.setActualEffort(request.actualEffort());
        task.setParentTaskId(request.parentTaskId());

        // Handle blocked reason
        if (nextStatus == TaskStatus.BLOCKED) {
            task.setBlockedReason(request.blockedReason());
        } else {
            task.setBlockedReason(null);
        }
        if (request.stageId() != null) {
            WorkflowStageEntity stage = workflowStageRepository.findById(request.stageId())
                    .orElseThrow(() -> new NotFoundException("Workflow stage not found"));
            if (!stage.getProjectId().equals(task.getProjectId())) {
                throw new BadRequestException("Stage does not belong to the task's project");
            }
            task.setStageId(request.stageId());
        }
        if (request.milestoneId() != null) {
            ProjectMilestoneEntity milestone = projectMilestoneRepository.findById(request.milestoneId())
                    .orElseThrow(() -> new NotFoundException("Milestone not found"));
            if (!milestone.getProjectId().equals(task.getProjectId())) {
                throw new BadRequestException("Milestone does not belong to the task's project");
            }
            if (!Objects.equals(milestone.getTenantId(), task.getTenantId())) {
                throw new BadRequestException("Milestone does not belong to your tenant");
            }
            task.setMilestoneId(request.milestoneId());
        }
        // Normalize jsonb tags to a valid JSON string to prevent casting errors.
        task.setTags(normalizeTags(request.tags()));
        task.setUpdatedBy(currentUser.getId());
    }

    private void saveAssignees(UUID tenantId, UUID taskId, List<UUID> assigneeIds) {
        taskAssigneeRepository.deleteByIdTaskId(taskId);
        if (assigneeIds == null) {
            return;
        }
        for (UUID assigneeId : assigneeIds) {
            requireUser(assigneeId, tenantId);
            TaskAssigneeEntity entity = new TaskAssigneeEntity();
            entity.setId(new TaskAssigneeId(taskId, assigneeId));
            entity.setAssignedAt(Instant.now());
            taskAssigneeRepository.save(entity);
        }
    }

    private ProjectStatus parseProjectStatus(String raw, ProjectStatus fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback == null ? ProjectStatus.PLANNING : fallback;
        }
        try {
            return ProjectStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid project status: " + raw);
        }
    }

    private TaskStatus parseTaskStatus(String raw, TaskStatus fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback == null ? TaskStatus.TODO : fallback;
        }
        try {
            return TaskStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid task status: " + raw);
        }
    }

    private TaskPriority parseTaskPriority(String raw, TaskPriority fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback == null ? TaskPriority.MEDIUM : fallback;
        }
        try {
            return TaskPriority.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid task priority: " + raw);
        }
    }

    private int normalizeMyTasksPageSize(int size) {
        if (size <= 0) {
            return DEFAULT_MY_TASKS_PAGE_SIZE;
        }
        return Math.min(size, MAX_MY_TASKS_PAGE_SIZE);
    }

    private String normalizeMyTasksTab(String rawTab) {
        if (rawTab == null || rawTab.isBlank()) {
            return "assigned";
        }

        String normalized = rawTab.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "assigned", "created", "reviewing", "all" -> normalized;
            default -> throw new BadRequestException("Invalid my tasks tab: " + rawTab);
        };
    }

    private Set<TaskStatus> parseTaskStatusFilter(String rawStatuses) {
        if (rawStatuses == null || rawStatuses.isBlank()) {
            return null;
        }

        Set<TaskStatus> parsed = new HashSet<>();
        for (String token : rawStatuses.split(",")) {
            String value = token.trim();
            if (value.isEmpty()) {
                continue;
            }
            try {
                parsed.add(TaskStatus.valueOf(value.toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid task status filter: " + value);
            }
        }

        return parsed.isEmpty() ? null : parsed;
    }

    private Set<TaskPriority> parseTaskPriorityFilter(String rawPriorities) {
        if (rawPriorities == null || rawPriorities.isBlank()) {
            return null;
        }

        Set<TaskPriority> parsed = new HashSet<>();
        for (String token : rawPriorities.split(",")) {
            String value = token.trim();
            if (value.isEmpty()) {
                continue;
            }
            try {
                parsed.add(TaskPriority.valueOf(value.toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid task priority filter: " + value);
            }
        }

        return parsed.isEmpty() ? null : parsed;
    }

    private boolean matchesMyTaskTab(TaskEntity task, String tab, UUID currentUserId, Set<UUID> assigneeIds) {
        return switch (tab) {
            case "assigned" -> assigneeIds.contains(currentUserId);
            case "created" -> Objects.equals(task.getReporterId(), currentUserId);
            case "reviewing" -> Objects.equals(task.getReporterId(), currentUserId)
                    && safeTaskStatus(task) == TaskStatus.IN_REVIEW;
            case "all" -> true;
            default -> true;
        };
    }

    private boolean matchesTaskSearch(TaskEntity task, ProjectEntity project, String rawSearch) {
        if (rawSearch == null || rawSearch.isBlank()) {
            return true;
        }

        String keyword = rawSearch.trim().toLowerCase(Locale.ROOT);
        String title = task.getTitle() == null ? "" : task.getTitle().toLowerCase(Locale.ROOT);
        String description = task.getDescription() == null ? "" : task.getDescription().toLowerCase(Locale.ROOT);
        String taskKey = task.getTaskKey() == null ? "" : task.getTaskKey().toLowerCase(Locale.ROOT);
        String projectName = project == null || project.getName() == null
                ? ""
                : project.getName().toLowerCase(Locale.ROOT);

        return title.contains(keyword)
                || description.contains(keyword)
                || taskKey.contains(keyword)
                || projectName.contains(keyword);
    }

    private Comparator<TaskEntity> buildMyTasksComparator(String sortBy, String sortDir) {
        String normalizedSortBy = sortBy == null || sortBy.isBlank()
                ? "updatedat"
                : sortBy.trim().toLowerCase(Locale.ROOT);

        Comparator<TaskEntity> comparator = switch (normalizedSortBy) {
            case "createdat" -> Comparator.comparing(
                    TaskEntity::getCreatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "duedate" -> Comparator.comparing(
                    TaskEntity::getDueDate,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "startdate" -> Comparator.comparing(
                    TaskEntity::getStartDate,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "priority" -> Comparator.comparingInt(task -> taskPrioritySortRank(safeTaskPriority(task)));
            case "status" -> Comparator.comparingInt(task -> safeTaskStatus(task).ordinal());
            case "title" -> Comparator.comparing(
                    task -> task.getTitle() == null ? "" : task.getTitle().toLowerCase(Locale.ROOT));
            case "updatedat" -> Comparator.comparing(
                    TaskEntity::getUpdatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            default -> throw new BadRequestException("Invalid sortBy value: " + sortBy);
        };

        comparator = comparator.thenComparing(TaskEntity::getId);
        String normalizedSortDir = sortDir == null || sortDir.isBlank()
                ? "desc"
                : sortDir.trim().toLowerCase(Locale.ROOT);
        return switch (normalizedSortDir) {
            case "asc" -> comparator;
            case "desc" -> comparator.reversed();
            default -> throw new BadRequestException("Invalid sortDir value: " + sortDir);
        };
    }

    private int taskPrioritySortRank(TaskPriority priority) {
        return switch (priority) {
            case URGENT -> 0;
            case HIGH -> 1;
            case MEDIUM -> 2;
            case LOW -> 3;
        };
    }

    private Integer normalizeMilestoneProgress(Integer rawProgress) {
        if (rawProgress == null) {
            return null;
        }
        if (rawProgress < 0 || rawProgress > 100) {
            throw new BadRequestException("Milestone progress must be between 0 and 100");
        }
        return rawProgress;
    }

    private int clampProgress(int rawProgress) {
        return Math.max(0, Math.min(100, rawProgress));
    }

    private ReviewAction parseReviewAction(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("Review action is required");
        }
        try {
            return ReviewAction.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid review action: " + raw);
        }
    }

    private void validateTaskTransition(TaskStatus from, TaskStatus to) {
        if (from == to) {
            return;
        }
        Set<TaskStatus> allowed = TASK_TRANSITIONS.getOrDefault(from, Set.of());
        if (!allowed.contains(to)) {
            throw new BadRequestException("Cannot move task from " + from + " to " + to);
        }
    }

    private void validateTaskPrerequisitesForStatus(TaskStatus status, List<UUID> assigneeIds, UUID reporterId,
            Integer progress, BigDecimal actualEffort) {
        if (status == TaskStatus.IN_PROGRESS) {
            if (assigneeIds == null || assigneeIds.isEmpty()) {
                throw new BadRequestException("Cannot move task to IN_PROGRESS without an assignee");
            }
        }
        if (status == TaskStatus.IN_REVIEW) {
            if (reporterId == null) {
                throw new BadRequestException("reporterId is required before moving task to IN_REVIEW");
            }
            if (progress == null || progress < 100) {
                throw new BadRequestException("Progress must be 100% before submitting for review");
            }
            if (actualEffort == null || actualEffort.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Please log actual effort before submitting for review");
            }
        }
    }

    private ProjectStatus safeProjectStatus(ProjectEntity project) {
        // Fall back to the DB default if the status is missing.
        return project.getStatus() == null ? ProjectStatus.PLANNING : project.getStatus();
    }

    private TaskPriority safeProjectPriority(ProjectEntity project) {
        // Fall back to the DB default if the priority is missing.
        return project.getPriority() == null ? TaskPriority.MEDIUM : project.getPriority();
    }

    private TaskStatus safeTaskStatus(TaskEntity task) {
        // Fall back to the DB default if the status is missing.
        return task.getStatus() == null ? TaskStatus.TODO : task.getStatus();
    }

    private TaskPriority safeTaskPriority(TaskEntity task) {
        // Fall back to the DB default if the priority is missing.
        return task.getPriority() == null ? TaskPriority.MEDIUM : task.getPriority();
    }

    private String normalizeTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return "[]";
        }
        try {
            OBJECT_MAPPER.readTree(raw);
            return raw;
        } catch (Exception ex) {
            return "[]";
        }
    }

    private String safeTags(String raw) {
        return normalizeTags(raw);
    }

    private void syncProjectTagLinks(UUID tenantId, UUID projectId, String rawTags) {
        projectTagLinkRepository.deleteByIdProjectId(projectId);

        Set<String> normalizedTagNames = extractNormalizedTagNames(rawTags);
        if (normalizedTagNames.isEmpty()) {
            return;
        }

        List<CompanyTagEntity> tags = companyTagRepository.findByTenantIdAndNormalizedNameIn(tenantId,
                normalizedTagNames);
        if (tags.isEmpty()) {
            return;
        }

        List<ProjectTagLinkEntity> links = new ArrayList<>(tags.size());
        for (CompanyTagEntity tag : tags) {
            ProjectTagLinkEntity link = new ProjectTagLinkEntity();
            link.setId(new ProjectTagLinkId(projectId, tag.getId()));
            link.setTenantId(tenantId);
            links.add(link);
        }

        projectTagLinkRepository.saveAll(links);
    }

    private void syncTaskTagLinks(UUID tenantId, UUID taskId, String rawTags) {
        taskTagLinkRepository.deleteByIdTaskId(taskId);

        Set<String> normalizedTagNames = extractNormalizedTagNames(rawTags);
        if (normalizedTagNames.isEmpty()) {
            return;
        }

        List<CompanyTagEntity> tags = companyTagRepository.findByTenantIdAndNormalizedNameIn(tenantId,
                normalizedTagNames);
        if (tags.isEmpty()) {
            return;
        }

        List<TaskTagLinkEntity> links = new ArrayList<>(tags.size());
        for (CompanyTagEntity tag : tags) {
            TaskTagLinkEntity link = new TaskTagLinkEntity();
            link.setId(new TaskTagLinkId(taskId, tag.getId()));
            link.setTenantId(tenantId);
            links.add(link);
        }

        taskTagLinkRepository.saveAll(links);
    }

    private Set<String> extractNormalizedTagNames(String rawTags) {
        String normalizedJson = normalizeTags(rawTags);
        try {
            JsonNode root = OBJECT_MAPPER.readTree(normalizedJson);
            if (!root.isArray()) {
                return Set.of();
            }

            Set<String> normalizedNames = new HashSet<>();
            for (JsonNode node : root) {
                String label = null;
                if (node.isTextual()) {
                    label = node.asText();
                } else if (node.isObject()) {
                    if (node.hasNonNull("label")) {
                        label = node.get("label").asText();
                    } else if (node.hasNonNull("name")) {
                        label = node.get("name").asText();
                    } else if (node.hasNonNull("value")) {
                        label = node.get("value").asText();
                    }
                }

                if (label != null && !label.isBlank()) {
                    normalizedNames.add(normalizeCompanyTagName(label));
                }
            }
            return normalizedNames;
        } catch (Exception ex) {
            return Set.of();
        }
    }

    private CompanyTagResponse toCompanyTagResponse(CompanyTagEntity entity) {
        return new CompanyTagResponse(
                entity.getId(),
                entity.getName(),
                entity.getColor(),
                asOffset(entity.getCreatedAt()),
                asOffset(entity.getUpdatedAt()));
    }

    private String normalizeCompanyTagName(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("Tag name is required");
        }
        return raw.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private String normalizeCompanyTagColor(String raw) {
        if (raw == null || raw.isBlank()) {
            return "#64748B";
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("^#[0-9A-F]{6}$")) {
            throw new BadRequestException("Tag color must be a valid hex value like #22C55E");
        }
        return normalized;
    }

    private String resolveTaskKey(TaskEntity task, ProjectEntity project) {
        if (task.getTaskKey() != null && !task.getTaskKey().isBlank()) {
            return task.getTaskKey();
        }

        String prefix = normalizeTaskKeyPrefix(project == null ? null : project.getSlug());
        int fallbackSequence = Math.abs(task.getId().hashCode()) % 900 + 100;
        return prefix + "-" + String.format("%03d", fallbackSequence);
    }

    private String generateTaskKey(UUID tenantId, UUID projectId) {
        ProjectEntity project = requireProject(projectId, tenantId);
        String prefix = normalizeTaskKeyPrefix(project.getSlug());

        int sequence = 1;
        String candidate = prefix + "-" + String.format("%03d", sequence);
        while (taskRepository.existsByTenantIdAndProjectIdAndTaskKey(tenantId, projectId, candidate)) {
            sequence++;
            candidate = prefix + "-" + String.format("%03d", sequence);
        }
        return candidate;
    }

    private String normalizeTaskKeyPrefix(String rawSlug) {
        String source = rawSlug == null || rawSlug.isBlank() ? "project" : rawSlug;
        String normalized = source
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "")
                .replaceAll("-{2,}", "-");
        return normalized.isBlank() ? "PROJECT" : normalized;
    }

    private String formatActivityDescription(String action, String value) {
        return switch (action) {
            case "created" -> "Created task" + (value == null || value.isBlank() ? "" : ": " + value);
            case "status_changed" -> "Updated status " + (value == null ? "" : "(" + value + ")");
            case "priority_changed" -> "Updated priority " + (value == null ? "" : "(" + value + ")");
            case "progress_changed" -> "Updated progress " + (value == null ? "" : "(" + value + ")");
            case "due_date_changed" -> "Updated due date " + (value == null ? "" : "(" + value + ")");
            case "stage_changed" -> "Moved task stage " + (value == null ? "" : "(" + value + ")");
            case "assignees_added" -> "Assigned: " + (value == null ? "" : value);
            case "assignees_removed" -> "Unassigned: " + (value == null ? "" : value);
            case "dependency_added" -> "Added dependency" + (value == null || value.isBlank() ? "" : ": " + value);
            case "dependency_removed" -> "Removed dependency" + (value == null || value.isBlank() ? "" : ": " + value);
            case "reviewed" -> "Review update" + (value == null || value.isBlank() ? "" : ": " + value);
            case "subtask_added" -> "Added subtask" + (value == null || value.isBlank() ? "" : ": " + value);
            case "subtask_updated" -> "Updated subtask" + (value == null || value.isBlank() ? "" : ": " + value);
            case "subtask_deleted" -> "Deleted subtask" + (value == null || value.isBlank() ? "" : ": " + value);
            default -> {
                if (value == null || value.isBlank()) {
                    yield action;
                }
                yield action + ": " + value;
            }
        };
    }

    private String normalizeMilestoneStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return "UPCOMING";
        }
        return raw.trim().toUpperCase();
    }

    private void validateProjectDateRange(LocalDate startDate, LocalDate dueDate) {
        if (startDate != null && dueDate != null && dueDate.isBefore(startDate)) {
            throw new BadRequestException("Project due date must be on or after start date");
        }
    }

    private void validateMilestoneDateWithinProject(ProjectEntity project, LocalDate targetDate) {
        if (targetDate == null) {
            return;
        }

        LocalDate projectStart = project.getStartDate();
        LocalDate projectEnd = project.getDueDate() != null ? project.getDueDate() : project.getEndDate();

        if (projectStart != null && targetDate.isBefore(projectStart)) {
            throw new BadRequestException("Milestone target date must be on or after project start date");
        }
        if (projectEnd != null && targetDate.isAfter(projectEnd)) {
            throw new BadRequestException("Milestone target date must be on or before project end date");
        }
    }

    private void validateMilestoneChronology(UUID projectId, UUID currentMilestoneId, Integer sortOrder,
            LocalDate targetDate) {
        if (targetDate == null || sortOrder == null) {
            return;
        }

        List<ProjectMilestoneEntity> milestones = projectMilestoneRepository
                .findByProjectIdOrderBySortOrderAsc(projectId);
        for (ProjectMilestoneEntity existing : milestones) {
            if (currentMilestoneId != null && existing.getId().equals(currentMilestoneId)) {
                continue;
            }
            if (existing.getSortOrder() == null || existing.getTargetDate() == null) {
                continue;
            }

            if (existing.getSortOrder() < sortOrder && existing.getTargetDate().isAfter(targetDate)) {
                throw new BadRequestException("Milestone date cannot be earlier than previous milestones");
            }
            if (existing.getSortOrder() > sortOrder && existing.getTargetDate().isBefore(targetDate)) {
                throw new BadRequestException("Milestone date cannot be later than next milestones");
            }
        }
    }

    private int nextStageOrder(UUID projectId) {
        return workflowStageRepository.findByProjectIdOrderByStageOrderAsc(projectId)
                .stream()
                .map(WorkflowStageEntity::getStageOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;
    }

    private void resequenceStages(UUID projectId) {
        List<WorkflowStageEntity> stages = workflowStageRepository.findByProjectIdOrderByStageOrderAsc(projectId);
        int order = 1;
        for (WorkflowStageEntity stage : stages) {
            stage.setStageOrder(order++);
        }
        workflowStageRepository.saveAll(stages);
    }

    private int nextMilestoneOrder(UUID projectId, Integer requestedOrder) {
        if (requestedOrder != null) {
            return requestedOrder;
        }
        return projectMilestoneRepository.findByProjectIdOrderBySortOrderAsc(projectId)
                .stream()
                .map(ProjectMilestoneEntity::getSortOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;
    }

    private WorkflowStageResponse toWorkflowStageResponse(WorkflowStageEntity stage) {
        return new WorkflowStageResponse(stage.getId().toString(), stage.getName(), stage.getStageOrder());
    }

    private MilestoneResponse toMilestoneResponse(ProjectMilestoneEntity milestone) {
        int suggestedProgress = calculateSuggestedMilestoneProgress(milestone);
        boolean progressOverridden = milestone.getProgressOverride() != null;
        int progress = progressOverridden
                ? clampProgress(milestone.getProgressOverride())
                : suggestedProgress;

        return new MilestoneResponse(
                milestone.getId().toString(),
                milestone.getTitle(),
                milestone.getTargetDate(),
                milestone.getStatus() != null ? milestone.getStatus().toLowerCase() : "upcoming",
                progress,
                suggestedProgress,
                progressOverridden);
    }

    private int calculateSuggestedMilestoneProgress(ProjectMilestoneEntity milestone) {
        List<TaskEntity> milestoneTasks = taskRepository.findByTenantIdAndMilestoneId(
                milestone.getTenantId(),
                milestone.getId());
        if (milestoneTasks.isEmpty()) {
            return 0;
        }

        int totalProgress = milestoneTasks.stream()
                .map(TaskEntity::getProgress)
                .map(progress -> progress == null ? 0 : clampProgress(progress))
                .reduce(0, Integer::sum);

        return Math.round((float) totalProgress / milestoneTasks.size());
    }

    private boolean hasDependencyPath(UUID fromTaskId, UUID targetTaskId) {
        return hasDependencyPath(fromTaskId, targetTaskId, new HashSet<>());
    }

    private boolean hasDependencyPath(UUID currentTaskId, UUID targetTaskId, Set<UUID> visited) {
        if (!visited.add(currentTaskId)) {
            return false;
        }
        List<TaskDependencyEntity> deps = taskDependencyRepository.findByIdTaskId(currentTaskId);
        for (TaskDependencyEntity dep : deps) {
            UUID blockerId = dep.getId().getBlockedByTaskId();
            if (blockerId.equals(targetTaskId)) {
                return true;
            }
            if (hasDependencyPath(blockerId, targetTaskId, visited)) {
                return true;
            }
        }
        return false;
    }

    private void logTaskChanges(
            UUID tenantId,
            TaskEntity task,
            UUID actorId,
            TaskStatus previousStatus,
            TaskPriority previousPriority,
            Integer previousProgress,
            LocalDate previousDueDate,
            List<UUID> previousAssignees,
            List<UUID> nextAssignees) {
        if (!Objects.equals(previousStatus, task.getStatus())) {
            logActivity(tenantId, task.getId(), actorId, "status_changed",
                    formatChange(previousStatus, task.getStatus()));
        }
        if (!Objects.equals(previousPriority, task.getPriority())) {
            logActivity(tenantId, task.getId(), actorId, "priority_changed",
                    formatChange(previousPriority, task.getPriority()));
        }
        if (!Objects.equals(previousProgress, task.getProgress())) {
            logActivity(tenantId, task.getId(), actorId, "progress_changed",
                    formatChange(previousProgress, task.getProgress()));
        }
        if (!Objects.equals(previousDueDate, task.getDueDate())) {
            logActivity(tenantId, task.getId(), actorId, "due_date_changed",
                    formatChange(previousDueDate, task.getDueDate()));
        }
        logAssigneeChanges(tenantId, task.getId(), actorId, previousAssignees, nextAssignees);
    }

    private void logAssigneeChanges(
            UUID tenantId,
            UUID taskId,
            UUID actorId,
            List<UUID> previousAssignees,
            List<UUID> nextAssignees) {
        Set<UUID> before = new HashSet<>(previousAssignees == null ? List.of() : previousAssignees);
        Set<UUID> after = new HashSet<>(nextAssignees == null ? List.of() : nextAssignees);

        Set<UUID> added = new HashSet<>(after);
        added.removeAll(before);
        if (!added.isEmpty()) {
            logActivity(tenantId, taskId, actorId, "assignees_added", joinUserNames(tenantId, added));
        }

        Set<UUID> removed = new HashSet<>(before);
        removed.removeAll(after);
        if (!removed.isEmpty()) {
            logActivity(tenantId, taskId, actorId, "assignees_removed", joinUserNames(tenantId, removed));
        }
    }

    private void logActivity(UUID tenantId, UUID taskId, UUID actorId, String action, String value) {
        TaskActivityEntity activity = new TaskActivityEntity();
        activity.setTenantId(tenantId);
        activity.setTaskId(taskId);
        activity.setActorId(actorId);
        activity.setAction(action);
        activity.setValue(value);
        taskActivityRepository.save(activity);
    }

    private String joinUserNames(UUID tenantId, Set<UUID> ids) {
        if (ids.isEmpty()) {
            return "";
        }

        Map<UUID, AppUserEntity> users = appUserRepository.findAllById(ids)
                .stream()
                .filter(user -> tenantId.equals(user.getTenantId()))
                .collect(Collectors.toMap(AppUserEntity::getId, u -> u));

        return ids.stream()
                .map(id -> users.containsKey(id) ? fullName(users.get(id)) : id.toString())
                .collect(Collectors.joining(", "));
    }

    private String formatChange(Object from, Object to) {
        return String.valueOf(from) + " -> " + String.valueOf(to);
    }

    public UUID resolveProjectId(String projectIdentifier) {
        return resolveProjectId(projectIdentifier, tenantId());
    }

    private UUID resolveProjectId(String projectIdentifier, UUID tenantId) {
        if (projectIdentifier == null || projectIdentifier.isBlank()) {
            throw new BadRequestException("Project identifier is required");
        }

        String candidate = projectIdentifier.trim();
        try {
            UUID id = UUID.fromString(candidate);
            return projectRepository.findByIdAndTenantId(id, tenantId)
                    .map(ProjectEntity::getId)
                    .orElseGet(
                            () -> projectRepository.findByTenantIdAndSlug(tenantId, normalizeIdentifierSlug(candidate))
                                    .map(ProjectEntity::getId)
                                    .orElseThrow(() -> new NotFoundException("Project not found")));
        } catch (IllegalArgumentException ignored) {
            return projectRepository.findByTenantIdAndSlug(tenantId, normalizeIdentifierSlug(candidate))
                    .map(ProjectEntity::getId)
                    .orElseThrow(() -> new NotFoundException("Project not found"));
        }
    }

    private String normalizeIdentifierSlug(String input) {
        return input == null ? "" : input.trim().toLowerCase();
    }

    private String generateUniqueProjectSlug(UUID tenantId, String title, UUID currentProjectId) {
        String base = slugifyProjectTitle(title);
        String candidate = base;
        int suffix = 2;
        while (isSlugTaken(tenantId, candidate, currentProjectId)) {
            candidate = base + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private boolean isSlugTaken(UUID tenantId, String slug, UUID currentProjectId) {
        return projectRepository.findByTenantIdAndSlug(tenantId, slug)
                .map(project -> currentProjectId == null || !project.getId().equals(currentProjectId))
                .orElse(false);
    }

    private String slugifyProjectTitle(String title) {
        if (title == null || title.isBlank()) {
            return "project";
        }

        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .replaceAll("-{2,}", "-");

        return normalized.isBlank() ? "project" : normalized;
    }

    private Set<TaskStatus> parseReviewStatuses(String rawStatuses) {
        if (rawStatuses == null || rawStatuses.isBlank()) {
            return Set.of(TaskStatus.IN_REVIEW);
        }

        Set<TaskStatus> statuses = new HashSet<>();
        String[] tokens = rawStatuses.split(",");
        for (String token : tokens) {
            String value = token == null ? "" : token.trim();
            if (value.isEmpty()) {
                continue;
            }
            try {
                statuses.add(TaskStatus.valueOf(value.toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid review status: " + value);
            }
        }

        if (statuses.isEmpty()) {
            throw new BadRequestException("At least one valid status is required");
        }
        return statuses;
    }

    private Pageable buildReviewPageable(int page, int size, String sortBy, String sortDir) {
        int safePage = Math.max(page, 0);
        int requestedSize = size <= 0 ? DEFAULT_REVIEW_PAGE_SIZE : size;
        int safeSize = Math.min(requestedSize, MAX_REVIEW_PAGE_SIZE);

        String sortProperty = switch ((sortBy == null ? "" : sortBy.trim())) {
            case "createdAt" -> "createdAt";
            case "dueDate" -> "dueDate";
            case "priority" -> "priority";
            case "status" -> "status";
            case "title" -> "title";
            default -> "updatedAt";
        };

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(safePage, safeSize, Sort.by(direction, sortProperty));
    }

    private ProjectEntity requireProject(UUID projectId, UUID tenantId) {
        return projectRepository.findByIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
    }

    private TaskEntity requireTask(UUID taskId, UUID tenantId) {
        return taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
    }

    private AppUserEntity requireUser(UUID userId, UUID tenantId) {
        return appUserRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new NotFoundException("User not found in tenant"));
    }

    private void enforceProjectVisible(AppUserEntity user, UUID projectId) {
        if (isManager(user)) {
            return;
        }
        if (!projectMemberRepository.existsByIdProjectIdAndIdUserId(projectId, user.getId())) {
            throw new ForbiddenException("No access to this project");
        }
    }

    private void enforceProjectManage(AppUserEntity user, UUID projectId) {
        if (isManager(user)) {
            return;
        }
        ProjectMemberEntity membership = projectMemberRepository.findByIdProjectIdAndIdUserId(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenException("No management permission on project"));
        ProjectRole role = ProjectRole.fromDbValue(membership.getRole());
        if (role != ProjectRole.LEAD) {
            throw new ForbiddenException("Only manager or project lead can manage this resource");
        }
    }

    private void enforceTaskEdit(AppUserEntity user, TaskEntity task) {
        if (isManager(user)) {
            return;
        }
        boolean isAssignee = taskAssigneeRepository
                .findByIdTaskId(task.getId())
                .stream()
                .anyMatch(a -> a.getId().getUserId().equals(user.getId()));
        boolean isReporter = task.getReporterId() != null && task.getReporterId().equals(user.getId());
        if (!isAssignee && !isReporter) {
            throw new ForbiddenException("You cannot edit this task");
        }
    }

    private boolean canManageProject(AppUserEntity user, UUID projectId) {
        if (isManager(user)) {
            return true;
        }
        return projectMemberRepository.findByIdProjectIdAndIdUserId(projectId, user.getId())
                .map(member -> ProjectRole.fromDbValue(member.getRole()) == ProjectRole.LEAD)
                .orElse(false);
    }

    private void requireManager(AppUserEntity user) {
        if (!isManager(user)) {
            throw new ForbiddenException("Manager role required");
        }
    }

    private boolean isManager(AppUserEntity user) {
        return GlobalRole.fromDbValue(user.getRole()).isManagerLike();
    }

    private UUID parseUserId(String userIdHeader) {
        if (userIdHeader == null || userIdHeader.isBlank()) {
            throw new BadRequestException("X-User-ID header is required");
        }
        return UUID.fromString(userIdHeader);
    }

    private UUID tenantId() {
        String tenant = tenantContext.getTenantId();
        if (tenant == null || tenant.isBlank()) {
            throw new BadRequestException("X-Company-ID header is required");
        }
        return UUID.fromString(tenant);
    }

    private OffsetDateTime asOffset(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    private String fullName(AppUserEntity user) {
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String joined = (first + " " + last).trim();
        return joined.isBlank() ? user.getId().toString() : joined;
    }

    private String toFrontendProjectRole(String dbRole) {
        return switch (ProjectRole.fromDbValue(dbRole)) {
            case LEAD -> "Lead";
            case DEVELOPER -> "Developer";
            case DESIGNER -> "Designer";
            case QA -> "QA";
            case ANALYST -> "Analyst";
            case MEMBER -> "Member";
        };
    }

    private String toFrontendProjectStatus(String dbStatus) {
        return switch (dbStatus) {
            case "IN_PROGRESS" -> "in_progress";
            case "ON_HOLD" -> "on_hold";
            case "COMPLETED" -> "completed";
            default -> "planning";
        };
    }

    private String toFrontendReviewAction(String action) {
        return switch (action) {
            case "APPROVED" -> "approved";
            case "CHANGES_REQUESTED" -> "changes_requested";
            default -> "comment";
        };
    }
}
