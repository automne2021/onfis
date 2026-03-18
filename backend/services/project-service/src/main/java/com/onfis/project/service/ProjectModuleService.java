package com.onfis.project.service;

import com.onfis.project.domain.GlobalRole;
import com.onfis.project.domain.ProjectRole;
import com.onfis.project.domain.ProjectStatus;
import com.onfis.project.domain.ReviewAction;
import com.onfis.project.domain.TaskPriority;
import com.onfis.project.domain.TaskStatus;
import com.onfis.project.dto.CurrentUserResponse;
import com.onfis.project.dto.ProjectMemberRequest;
import com.onfis.project.dto.ProjectMemberResponse;
import com.onfis.project.dto.ProjectResponse;
import com.onfis.project.dto.ProjectUpsertRequest;
import com.onfis.project.dto.ReviewCreateRequest;
import com.onfis.project.dto.TaskResponse;
import com.onfis.project.dto.TaskReviewResponse;
import com.onfis.project.dto.TaskUpsertRequest;
import com.onfis.project.dto.UserSummaryResponse;
import com.onfis.project.entity.AppUserEntity;
import com.onfis.project.entity.ProjectEntity;
import com.onfis.project.entity.ProjectMemberEntity;
import com.onfis.project.entity.ProjectMemberId;
import com.onfis.project.entity.TaskAssigneeEntity;
import com.onfis.project.entity.TaskAssigneeId;
import com.onfis.project.entity.TaskEntity;
import com.onfis.project.entity.TaskReviewEntity;
import com.onfis.project.exception.BadRequestException;
import com.onfis.project.exception.ForbiddenException;
import com.onfis.project.exception.NotFoundException;
import com.onfis.project.repository.AppUserRepository;
import com.onfis.project.repository.ProjectMemberRepository;
import com.onfis.project.repository.ProjectRepository;
import com.onfis.project.repository.TaskAssigneeRepository;
import com.onfis.project.repository.TaskRepository;
import com.onfis.project.repository.TaskReviewRepository;
import com.onfis.shared.security.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ProjectModuleService {

    private final TenantContext tenantContext;
    private final AppUserRepository appUserRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final TaskReviewRepository taskReviewRepository;

    public ProjectModuleService(
            TenantContext tenantContext,
            AppUserRepository appUserRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            TaskRepository taskRepository,
            TaskAssigneeRepository taskAssigneeRepository,
            TaskReviewRepository taskReviewRepository
    ) {
        this.tenantContext = tenantContext;
        this.appUserRepository = appUserRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.taskAssigneeRepository = taskAssigneeRepository;
        this.taskReviewRepository = taskReviewRepository;
    }

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

    public List<ProjectResponse> listProjects(String userIdHeader) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        GlobalRole role = GlobalRole.fromDbValue(currentUser.getRole());

        List<ProjectEntity> projects = role == GlobalRole.MANAGER
                ? projectRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                : projectRepository.findVisibleByUser(tenantId, currentUser.getId());

        List<ProjectResponse> result = new ArrayList<>();
        for (ProjectEntity project : projects) {
            result.add(toProjectResponse(project, currentUser));
        }
        return result;
    }

    public ProjectResponse getProject(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, project.getId());
        return toProjectResponse(project, currentUser);
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

    public List<TaskResponse> listTasks(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, projectId);

        List<TaskEntity> tasks = taskRepository.findByTenantIdAndProjectIdOrderByCreatedAtDesc(tenantId, projectId);
        List<TaskResponse> responses = new ArrayList<>();
        for (TaskEntity task : tasks) {
            responses.add(toTaskResponse(task, currentUser));
        }
        return responses;
    }

    public TaskResponse getTask(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceProjectVisible(currentUser, task.getProjectId());
        return toTaskResponse(task, currentUser);
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
        applyTaskUpsert(task, request, currentUser);

        TaskEntity saved = taskRepository.save(task);
        saveAssignees(saved.getId(), request.assigneeIds());
        return toTaskResponse(saved, currentUser);
    }

    @Transactional
    public TaskResponse updateTask(String userIdHeader, UUID taskId, TaskUpsertRequest request) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);
        enforceTaskEdit(currentUser, task);

        applyTaskUpsert(task, request, currentUser);
        TaskEntity saved = taskRepository.save(task);
        saveAssignees(saved.getId(), request.assigneeIds());
        return toTaskResponse(saved, currentUser);
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

        ReviewAction action = ReviewAction.valueOf(request.action().toUpperCase());
        TaskReviewEntity review = new TaskReviewEntity();
        review.setTenantId(tenantId);
        review.setTaskId(taskId);
        review.setReviewerId(currentUser.getId());
        review.setAction(action.name());
        review.setContent(request.content());
        taskReviewRepository.save(review);

        if (action == ReviewAction.APPROVED) {
            task.setStatus(TaskStatus.DONE);
            task.setProgress(100);
        } else if (action == ReviewAction.CHANGES_REQUESTED) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }

        task.setUpdatedBy(currentUser.getId());
        taskRepository.save(task);
        return toTaskResponse(task, currentUser);
    }

    public List<TaskResponse> reviewQueue(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        List<TaskEntity> tasks;
        if (isManager(currentUser)) {
            tasks = taskRepository.findByTenantIdAndStatusOrderByUpdatedAtDesc(tenantId, TaskStatus.IN_REVIEW);
        } else {
            tasks = taskRepository.findByTenantIdAndStatusAndReporterIdOrderByUpdatedAtDesc(
                    tenantId,
                    TaskStatus.IN_REVIEW,
                    currentUser.getId()
            );
        }

        List<TaskResponse> responses = new ArrayList<>();
        for (TaskEntity task : tasks) {
            if (projectId == null || task.getProjectId().equals(projectId)) {
                responses.add(toTaskResponse(task, currentUser));
            }
        }
        return responses;
    }

    private ProjectResponse toProjectResponse(ProjectEntity project, AppUserEntity currentUser) {
        List<UserSummaryResponse> assignees = new ArrayList<>();
        for (ProjectMemberEntity member : projectMemberRepository.findByIdProjectId(project.getId())) {
            appUserRepository.findById(member.getId().getUserId())
                    .ifPresent(u -> assignees.add(new UserSummaryResponse(u.getId(), fullName(u), u.getAvatarUrl())));
        }

        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                toFrontendProjectStatus(project.getStatus().name()),
                project.getPriority().name().toLowerCase(),
                project.getProgress() == null ? 0 : project.getProgress(),
                project.getDueDate(),
                project.getTags(),
                asOffset(project.getCreatedAt()),
                assignees,
                canManageProject(currentUser, project.getId())
        );
    }

    private TaskResponse toTaskResponse(TaskEntity task, AppUserEntity currentUser) {
        List<UserSummaryResponse> assignees = new ArrayList<>();
        List<TaskAssigneeEntity> taskAssignees = taskAssigneeRepository.findByIdTaskId(task.getId());
        Set<UUID> assigneeIds = new HashSet<>();
        for (TaskAssigneeEntity assignee : taskAssignees) {
            assigneeIds.add(assignee.getId().getUserId());
            appUserRepository.findById(assignee.getId().getUserId())
                    .ifPresent(u -> assignees.add(new UserSummaryResponse(u.getId(), fullName(u), u.getAvatarUrl())));
        }

        List<TaskReviewResponse> reviews = taskReviewRepository
                .findByTenantIdAndTaskIdOrderByCreatedAtAsc(task.getTenantId(), task.getId())
                .stream()
                .map(review -> {
                    AppUserEntity author = appUserRepository.findById(review.getReviewerId()).orElse(null);
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

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority().name().toLowerCase(),
                task.getStatus().name(),
                task.getProgress() == null ? 0 : task.getProgress(),
                task.getDueDate(),
                assignees,
                task.getTags(),
                task.getReporterId(),
                task.getEstimatedEffort(),
                task.getActualEffort(),
                List.of(),
                reviews,
                asOffset(task.getCreatedAt()),
                asOffset(task.getUpdatedAt()),
                task.getTaskKey() == null ? "TASK-" + task.getId().toString().substring(0, 8).toUpperCase() : task.getTaskKey(),
                canEdit,
                canReview
        );
    }

    private void applyProjectUpsert(ProjectEntity project, ProjectUpsertRequest request) {
        project.setName(request.title());
        project.setDescription(request.description());
        project.setStatus(ProjectStatus.valueOf(request.status().toUpperCase()));
        project.setPriority(TaskPriority.valueOf(request.priority().toUpperCase()));
        project.setProgress(request.progress() == null ? 0 : request.progress());
        project.setStartDate(request.startDate());
        project.setDueDate(request.dueDate());
        project.setTags(request.tags() == null || request.tags().isBlank() ? "[]" : request.tags());
    }

    private void applyTaskUpsert(TaskEntity task, TaskUpsertRequest request, AppUserEntity currentUser) {
        TaskStatus nextStatus = TaskStatus.valueOf(request.status().toUpperCase());
        if (nextStatus == TaskStatus.IN_REVIEW && request.reporterId() == null) {
            throw new BadRequestException("reporterId is required before moving task to IN_REVIEW");
        }

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(nextStatus);
        task.setPriority(TaskPriority.valueOf(request.priority().toUpperCase()));
        task.setProgress(request.progress() == null ? 0 : request.progress());
        task.setDueDate(request.dueDate());
        task.setReporterId(request.reporterId() == null ? currentUser.getId() : request.reporterId());
        task.setEstimatedEffort(request.estimatedEffort());
        task.setActualEffort(request.actualEffort());
        task.setParentTaskId(request.parentTaskId());
        task.setStageId(request.stageId());
        task.setTags(request.tags() == null || request.tags().isBlank() ? "[]" : request.tags());
        task.setUpdatedBy(currentUser.getId());
    }

    private void saveAssignees(UUID taskId, List<UUID> assigneeIds) {
        taskAssigneeRepository.deleteByIdTaskId(taskId);
        if (assigneeIds == null) {
            return;
        }
        for (UUID assigneeId : assigneeIds) {
            TaskAssigneeEntity entity = new TaskAssigneeEntity();
            entity.setId(new TaskAssigneeId(taskId, assigneeId));
            entity.setAssignedAt(Instant.now());
            taskAssigneeRepository.save(entity);
        }
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
