package com.onfis.project.service;

import com.onfis.project.domain.GlobalRole;
import com.onfis.project.domain.ProjectRole;
import com.onfis.project.domain.ProjectStatus;
import com.onfis.project.domain.ReviewAction;
import com.onfis.project.domain.TaskPriority;
import com.onfis.project.domain.TaskStatus;
import com.onfis.project.dto.CurrentUserResponse;
import com.onfis.project.dto.MilestoneUpsertRequest;
import com.onfis.project.dto.MilestoneResponse;
import com.onfis.project.dto.ProjectDetailResponse;
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
import com.onfis.project.entity.ProjectEntity;
import com.onfis.project.entity.ProjectFavoriteEntity;
import com.onfis.project.entity.ProjectFavoriteId;
import com.onfis.project.entity.ProjectMemberEntity;
import com.onfis.project.entity.ProjectMemberId;
import com.onfis.project.entity.ProjectMilestoneEntity;
import com.onfis.project.entity.TaskAssigneeEntity;
import com.onfis.project.entity.TaskAssigneeId;
import com.onfis.project.entity.TaskActivityEntity;
import com.onfis.project.entity.TaskCommentEntity;
import com.onfis.project.entity.TaskDependencyEntity;
import com.onfis.project.entity.TaskDependencyId;
import com.onfis.project.entity.TaskEntity;
import com.onfis.project.entity.TaskSubtaskEntity;
import com.onfis.project.entity.TaskReviewEntity;
import com.onfis.project.entity.WorkflowStageEntity;
import com.onfis.project.exception.BadRequestException;
import com.onfis.project.exception.ForbiddenException;
import com.onfis.project.exception.NotFoundException;
import com.onfis.project.repository.AppUserRepository;
import com.onfis.project.repository.TaskDependencyRepository;
import com.onfis.project.repository.ProjectFavoriteRepository;
import com.onfis.project.repository.ProjectMemberRepository;
import com.onfis.project.repository.ProjectMilestoneRepository;
import com.onfis.project.repository.ProjectRepository;
import com.onfis.project.repository.TaskActivityRepository;
import com.onfis.project.repository.TaskAssigneeRepository;
import com.onfis.project.repository.TaskCommentRepository;
import com.onfis.project.repository.TaskRepository;
import com.onfis.project.repository.TaskReviewRepository;
import com.onfis.project.repository.TaskSubtaskRepository;
import com.onfis.project.repository.WorkflowStageRepository;
import com.onfis.shared.security.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
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
    private static final Map<TaskStatus, Set<TaskStatus>> TASK_TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW, TaskStatus.BLOCKED),
            TaskStatus.BLOCKED, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.IN_REVIEW, Set.of(TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.DONE, Set.of()
    );

    private final TenantContext tenantContext;
    private final AppUserRepository appUserRepository;
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

    public ProjectModuleService(
            TenantContext tenantContext,
            AppUserRepository appUserRepository,
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
                TaskDependencyRepository taskDependencyRepository
    ) {
        this.tenantContext = tenantContext;
        this.appUserRepository = appUserRepository;
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
    }

    // ── Current user ──────────────────────────────────────────────────────────

    public CurrentUserResponse getCurrentUser(String userIdHeader) {
        UUID tenantId = tenantId();
        UUID userId = parseUserId(userIdHeader);
        AppUserEntity user = requireUser(userId, tenantId);
        GlobalRole role = GlobalRole.fromDbValue(user.getRole());
        Set<String> permissions = role == GlobalRole.MANAGER
                ? Set.of("PROJECT_CREATE", "PROJECT_MANAGE", "TASK_REVIEW", "TASK_CREATE", "TASK_UPDATE")
                : Set.of("TASK_CREATE", "TASK_UPDATE");
        return new CurrentUserResponse(user.getId(), fullName(user), role.name(), permissions);
    }

    // ── Projects ─────────────────────────────────────────────────────────────

    public List<ProjectResponse> listProjects(String userIdHeader) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        GlobalRole role = GlobalRole.fromDbValue(currentUser.getRole());

        List<ProjectEntity> projects = role == GlobalRole.MANAGER
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
                .map(m -> new MilestoneResponse(m.getId().toString(), m.getTitle(), m.getTargetDate(),
                        m.getStatus() != null ? m.getStatus().toLowerCase() : "upcoming"))
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
                daysRemaining
        );
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

        List<ProjectMemberEntity> members = projectMemberRepository.findByIdProjectId(projectId);
        List<ProjectMemberResponse> responses = new ArrayList<>();
        for (ProjectMemberEntity member : members) {
            AppUserEntity user = requireUser(member.getId().getUserId(), tenantId);
            long taskCount = taskAssigneeRepository.countAssignedInProject(projectId, user.getId());
            responses.add(new ProjectMemberResponse(
                    user.getId(),
                    fullName(user),
                    user.getAvatarUrl(),
                    toFrontendProjectRole(member.getRole()),
                    asOffset(member.getJoinedAt()),
                    taskCount
            ));
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
        return new ProjectMemberResponse(
                memberUser.getId(),
                fullName(memberUser),
                memberUser.getAvatarUrl(),
                toFrontendProjectRole(member.getRole()),
                asOffset(member.getJoinedAt()),
                taskCount
        );
    }

    @Transactional
    public ProjectMemberResponse updateMemberRole(String userIdHeader, UUID projectId, UUID memberId, ProjectMemberRequest request) {
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
        return new ProjectMemberResponse(
                user.getId(),
                fullName(user),
                user.getAvatarUrl(),
                toFrontendProjectRole(saved.getRole()),
                asOffset(saved.getJoinedAt()),
                taskCount
        );
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
    public WorkflowStageResponse updateStage(String userIdHeader, UUID projectId, UUID stageId, WorkflowStageUpsertRequest request) {
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
    public List<WorkflowStageResponse> reorderStages(String userIdHeader, UUID projectId, WorkflowStageReorderRequest request) {
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
                .map(m -> new MilestoneResponse(m.getId().toString(), m.getTitle(), m.getTargetDate(),
                        m.getStatus() != null ? m.getStatus().toLowerCase() : "upcoming"))
                .collect(Collectors.toList());
    }

    @Transactional
    public MilestoneResponse createMilestone(String userIdHeader, UUID projectId, MilestoneUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("Milestone title is required");
        }

        ProjectMilestoneEntity milestone = new ProjectMilestoneEntity();
        milestone.setTenantId(tenantId);
        milestone.setProjectId(projectId);
        milestone.setTitle(request.title().trim());
        milestone.setTargetDate(request.targetDate());
        milestone.setStatus(normalizeMilestoneStatus(request.status()));
        milestone.setSortOrder(nextMilestoneOrder(projectId, request.sortOrder()));
        ProjectMilestoneEntity saved = projectMilestoneRepository.save(milestone);
        return toMilestoneResponse(saved);
    }

    @Transactional
    public MilestoneResponse updateMilestone(String userIdHeader, UUID projectId, UUID milestoneId, MilestoneUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectManage(currentUser, projectId);

        ProjectMilestoneEntity milestone = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new NotFoundException("Milestone not found"));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new BadRequestException("Milestone does not belong to this project");
        }

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

    public List<TaskResponse> listMyTasks(String userIdHeader) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);

        List<TaskEntity> tasks = taskRepository.findAssignedOrReportedToUser(tenantId, currentUser.getId());
        List<TaskEntity> visibleTasks = new ArrayList<>();
        for (TaskEntity task : tasks) {
            if (!isManager(currentUser)
                    && !projectMemberRepository.existsByIdProjectIdAndIdUserId(task.getProjectId(), currentUser.getId())) {
                continue;
            }
            visibleTasks.add(task);
        }
        return toTaskResponses(visibleTasks, currentUser, tenantId);
    }

    public TaskResponse getTask(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());

        if (task.getStatus() != TaskStatus.IN_REVIEW) {
            throw new BadRequestException("Task must be IN_REVIEW before submitting a review");
        }
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
        validateTaskPrerequisitesForStatus(requestedStatus, request.assigneeIds(), request.reporterId());
        if (request.reporterId() != null) {
            requireUser(request.reporterId(), tenantId);
        }
        applyTaskUpsert(task, request, currentUser);

        TaskEntity saved = taskRepository.save(task);
        saveAssignees(tenantId, saved.getId(), request.assigneeIds());
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
            validateTaskPrerequisitesForStatus(nextStatus, request.assigneeIds(), reporterId);
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
        logTaskChanges(
            tenantId,
            saved,
            currentUser.getId(),
            previousStatus,
            previousPriority,
            previousProgress,
            previousDueDate,
            previousAssignees,
            request.assigneeIds()
        );
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
            validateTaskPrerequisitesForStatus(nextStatus, assigneeIds, task.getReporterId());
        }

        task.setStageId(request.stageId());
        task.setStatus(nextStatus);
        if (request.progress() != null) {
            task.setProgress(request.progress());
        }
        task.setUpdatedBy(currentUser.getId());

        TaskEntity saved = taskRepository.save(task);
        if (!Objects.equals(previousStatus, saved.getStatus())) {
            logActivity(tenantId, saved.getId(), currentUser.getId(), "status_changed", formatChange(previousStatus, saved.getStatus()));
        }
        if (!Objects.equals(previousProgress, saved.getProgress())) {
            logActivity(tenantId, saved.getId(), currentUser.getId(), "progress_changed", formatChange(previousProgress, saved.getProgress()));
        }
        if (!Objects.equals(previousStageId, saved.getStageId())) {
            logActivity(tenantId, saved.getId(), currentUser.getId(), "stage_changed", formatChange(previousStageId, saved.getStageId()));
        }

        return toTaskResponse(saved, currentUser);
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
        logActivity(tenantId, taskId, currentUser.getId(), "dependency_added", blocker.getId().toString());
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
        logActivity(tenantId, taskId, currentUser.getId(), "dependency_removed", blockedByTaskId.toString());
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
        logActivity(tenantId, task.getId(), currentUser.getId(), "reviewed", action.name().toLowerCase());
        if (previousStatus != task.getStatus()) {
            logActivity(
                    tenantId,
                    task.getId(),
                    currentUser.getId(),
                    "status_changed",
                    formatChange(previousStatus, task.getStatus())
            );
        }
        return toTaskResponse(task, currentUser);
    }

    public ReviewQueuePageResponse reviewQueue(
            String userIdHeader,
            String projectIdentifier,
            String status,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
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
            taskPage = projectId == null
                    ? taskRepository.findByTenantIdAndStatusIn(tenantId, statuses, pageable)
                    : taskRepository.findByTenantIdAndProjectIdAndStatusIn(tenantId, projectId, statuses, pageable);
        } else {
            taskPage = projectId == null
                    ? taskRepository.findByTenantIdAndReporterIdAndStatusIn(tenantId, currentUser.getId(), statuses, pageable)
                    : taskRepository.findByTenantIdAndProjectIdAndReporterIdAndStatusIn(
                            tenantId,
                            projectId,
                            currentUser.getId(),
                            statuses,
                            pageable
                    );
        }

        List<TaskResponse> content = toTaskResponses(taskPage.getContent(), currentUser, tenantId);
        return new ReviewQueuePageResponse(
                content,
                taskPage.getNumber(),
                taskPage.getSize(),
                taskPage.getTotalElements(),
                taskPage.getTotalPages(),
                taskPage.hasNext()
        );
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
                asOffset(saved.getCreatedAt())
        );
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
                            asOffset(c.getCreatedAt())
                    );
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
    public TaskSubtaskResponse updateSubtask(String userIdHeader, UUID taskId, UUID subtaskId, TaskSubtaskRequest request) {
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
                    if (lq.isEmpty()) return true;
                    String name = fullName(u).toLowerCase();
                    return name.contains(lq) || (u.getEmail() != null && u.getEmail().toLowerCase().contains(lq));
                })
                .limit(30)
                .map(u -> new UserSearchResponse(u.getId(), fullName(u), u.getAvatarUrl()))
                .collect(Collectors.toList());
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private List<ProjectResponse> toProjectResponses(List<ProjectEntity> projects, AppUserEntity currentUser, UUID tenantId) {
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

    private ProjectResponse toProjectResponse(ProjectEntity project, AppUserEntity currentUser, ProjectMappingContext context) {
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
                assignees,
                canManageProject(currentUser, project.getId())
        );
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
            Map<UUID, AppUserEntity> usersById
    ) {
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
                            asOffset(review.getCreatedAt())
                    );
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

        return new TaskResponse(
                task.getId(),
                task.getProjectId(),
                task.getTitle(),
                task.getDescription(),
                safeTaskPriority(task).name().toLowerCase(),
                safeTaskStatus(task).name(),
                task.getProgress() == null ? 0 : task.getProgress(),
                task.getDueDate(),
                assignees,
                safeTags(task.getTags()),
                task.getReporterId(),
                task.getEstimatedEffort(),
                task.getActualEffort(),
                blockedBy,
                reviews,
                asOffset(task.getCreatedAt()),
                asOffset(task.getUpdatedAt()),
                task.getTaskKey() == null ? "TASK-" + task.getId().toString().substring(0, 8).toUpperCase() : task.getTaskKey(),
                canEdit,
                canReview
        );
    }

    private TaskMappingContext buildTaskMappingContext(List<TaskEntity> tasks, UUID tenantId) {
        if (tasks.isEmpty()) {
            return new TaskMappingContext(Map.of(), Map.of(), Map.of(), Map.of());
        }

        List<UUID> taskIds = tasks.stream().map(TaskEntity::getId).toList();

        List<TaskAssigneeEntity> assignees = taskAssigneeRepository.findByIdTaskIdIn(taskIds);
        List<TaskReviewEntity> reviews = taskReviewRepository.findByTenantIdAndTaskIdInOrderByCreatedAtAsc(tenantId, taskIds);
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

        Map<UUID, AppUserEntity> usersById = appUserRepository.findAllById(userIds)
                .stream()
                .filter(user -> tenantId.equals(user.getTenantId()))
                .collect(Collectors.toMap(AppUserEntity::getId, u -> u));

        return new TaskMappingContext(assigneesByTaskId, reviewsByTaskId, dependenciesByTaskId, usersById);
    }

    private record TaskMappingContext(
            Map<UUID, List<TaskAssigneeEntity>> assigneesByTaskId,
            Map<UUID, List<TaskReviewEntity>> reviewsByTaskId,
            Map<UUID, List<TaskDependencyEntity>> dependenciesByTaskId,
            Map<UUID, AppUserEntity> usersById
    ) {
    }

    private TaskDetailResponse toTaskDetailResponse(TaskEntity task, AppUserEntity currentUser, UUID tenantId) {
        List<TaskAssigneeEntity> taskAssignees = taskAssigneeRepository.findByIdTaskId(task.getId());
        List<TaskReviewEntity> reviewEntities = taskReviewRepository
                .findByTenantIdAndTaskIdOrderByCreatedAtAsc(tenantId, task.getId());
        List<TaskSubtaskEntity> subtaskEntities = taskSubtaskRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        List<TaskCommentEntity> commentEntities = taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        List<TaskActivityEntity> activityEntities = taskActivityRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());

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
                            asOffset(review.getCreatedAt())
                    );
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
                            asOffset(c.getCreatedAt())
                    );
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
                            asOffset(a.getCreatedAt())
                    );
                })
                .collect(Collectors.toList());

        List<UUID> blockedBy = taskDependencyRepository.findByIdTaskId(task.getId())
            .stream()
            .map(dep -> dep.getId().getBlockedByTaskId())
            .toList();

        return new TaskDetailResponse(
                task.getId(),
                task.getProjectId(),
                task.getTitle(),
                task.getDescription(),
            safeTaskPriority(task).name().toLowerCase(),
            safeTaskStatus(task).name(),
                task.getProgress() == null ? 0 : task.getProgress(),
                task.getDueDate(),
                assignees,
            safeTags(task.getTags()),
                task.getReporterId(),
                task.getEstimatedEffort(),
                task.getActualEffort(),
            blockedBy,
                reviews,
                asOffset(task.getCreatedAt()),
                asOffset(task.getUpdatedAt()),
                task.getTaskKey() == null ? "TASK-" + task.getId().toString().substring(0, 8).toUpperCase() : task.getTaskKey(),
                canEdit,
                canReview,
                subtasks,
                comments,
                activities
        );
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
        project.setStartDate(request.startDate());
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
        if (request.reporterId() != null) {
            task.setReporterId(request.reporterId());
        }
        task.setEstimatedEffort(request.estimatedEffort());
        task.setActualEffort(request.actualEffort());
        task.setParentTaskId(request.parentTaskId());
        if (request.stageId() != null) {
            WorkflowStageEntity stage = workflowStageRepository.findById(request.stageId())
                    .orElseThrow(() -> new NotFoundException("Workflow stage not found"));
            if (!stage.getProjectId().equals(task.getProjectId())) {
                throw new BadRequestException("Stage does not belong to the task's project");
            }
        }
        task.setStageId(request.stageId());
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

    private void validateTaskPrerequisitesForStatus(TaskStatus status, List<UUID> assigneeIds, UUID reporterId) {
        if (status == TaskStatus.IN_PROGRESS) {
            if (assigneeIds == null || assigneeIds.isEmpty()) {
                throw new BadRequestException("Cannot move task to IN_PROGRESS without an assignee");
            }
        }
        if (status == TaskStatus.IN_REVIEW && reporterId == null) {
            throw new BadRequestException("reporterId is required before moving task to IN_REVIEW");
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

    private String normalizeMilestoneStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return "UPCOMING";
        }
        return raw.trim().toUpperCase();
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
        return new MilestoneResponse(
                milestone.getId().toString(),
                milestone.getTitle(),
                milestone.getTargetDate(),
                milestone.getStatus() != null ? milestone.getStatus().toLowerCase() : "upcoming"
        );
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
            List<UUID> nextAssignees
    ) {
        if (!Objects.equals(previousStatus, task.getStatus())) {
            logActivity(tenantId, task.getId(), actorId, "status_changed", formatChange(previousStatus, task.getStatus()));
        }
        if (!Objects.equals(previousPriority, task.getPriority())) {
            logActivity(tenantId, task.getId(), actorId, "priority_changed", formatChange(previousPriority, task.getPriority()));
        }
        if (!Objects.equals(previousProgress, task.getProgress())) {
            logActivity(tenantId, task.getId(), actorId, "progress_changed", formatChange(previousProgress, task.getProgress()));
        }
        if (!Objects.equals(previousDueDate, task.getDueDate())) {
            logActivity(tenantId, task.getId(), actorId, "due_date_changed", formatChange(previousDueDate, task.getDueDate()));
        }
        logAssigneeChanges(tenantId, task.getId(), actorId, previousAssignees, nextAssignees);
    }

    private void logAssigneeChanges(
            UUID tenantId,
            UUID taskId,
            UUID actorId,
            List<UUID> previousAssignees,
            List<UUID> nextAssignees
    ) {
        Set<UUID> before = new HashSet<>(previousAssignees == null ? List.of() : previousAssignees);
        Set<UUID> after = new HashSet<>(nextAssignees == null ? List.of() : nextAssignees);

        Set<UUID> added = new HashSet<>(after);
        added.removeAll(before);
        if (!added.isEmpty()) {
            logActivity(tenantId, taskId, actorId, "assignees_added", joinIds(added));
        }

        Set<UUID> removed = new HashSet<>(before);
        removed.removeAll(after);
        if (!removed.isEmpty()) {
            logActivity(tenantId, taskId, actorId, "assignees_removed", joinIds(removed));
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

    private String joinIds(Set<UUID> ids) {
        return ids.stream().map(UUID::toString).collect(Collectors.joining(", "));
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
                    .orElseGet(() -> projectRepository.findByTenantIdAndSlug(tenantId, normalizeIdentifierSlug(candidate))
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
        return GlobalRole.fromDbValue(user.getRole()) == GlobalRole.MANAGER;
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
            case MEMBER -> "Developer";
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
