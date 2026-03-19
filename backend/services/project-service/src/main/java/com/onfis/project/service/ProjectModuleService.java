package com.onfis.project.service;

import com.onfis.project.domain.GlobalRole;
import com.onfis.project.domain.ProjectRole;
import com.onfis.project.domain.ProjectStatus;
import com.onfis.project.domain.ReviewAction;
import com.onfis.project.domain.TaskPriority;
import com.onfis.project.domain.TaskStatus;
import com.onfis.project.dto.CurrentUserResponse;
import com.onfis.project.dto.MilestoneResponse;
import com.onfis.project.dto.ProjectDetailResponse;
import com.onfis.project.dto.ProjectMemberRequest;
import com.onfis.project.dto.ProjectMemberResponse;
import com.onfis.project.dto.ProjectResponse;
import com.onfis.project.dto.ProjectUpsertRequest;
import com.onfis.project.dto.ReviewCreateRequest;
import com.onfis.project.dto.TaskActivityResponse;
import com.onfis.project.dto.TaskCommentRequest;
import com.onfis.project.dto.TaskCommentResponse;
import com.onfis.project.dto.TaskDetailResponse;
import com.onfis.project.dto.TaskResponse;
import com.onfis.project.dto.TaskReviewResponse;
import com.onfis.project.dto.TaskSubtaskRequest;
import com.onfis.project.dto.TaskSubtaskResponse;
import com.onfis.project.dto.TaskUpsertRequest;
import com.onfis.project.dto.UserSearchResponse;
import com.onfis.project.dto.UserSummaryResponse;
import com.onfis.project.dto.WorkflowStageResponse;
import com.onfis.project.entity.AppUserEntity;
import com.onfis.project.entity.ProjectEntity;
import com.onfis.project.entity.ProjectFavoriteEntity;
import com.onfis.project.entity.ProjectFavoriteId;
import com.onfis.project.entity.ProjectMemberEntity;
import com.onfis.project.entity.ProjectMemberId;
import com.onfis.project.entity.TaskAssigneeEntity;
import com.onfis.project.entity.TaskAssigneeId;
import com.onfis.project.entity.TaskActivityEntity;
import com.onfis.project.entity.TaskCommentEntity;
import com.onfis.project.entity.TaskEntity;
import com.onfis.project.entity.TaskSubtaskEntity;
import com.onfis.project.entity.TaskReviewEntity;
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
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectModuleService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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

    public ProjectDetailResponse getProjectDetail(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity currentUser = requireUser(parseUserId(userIdHeader), tenantId);
        ProjectEntity project = requireProject(projectId, tenantId);
        enforceProjectVisible(currentUser, project.getId());

        // Manager info
        String managerName = null;
        String managerAvatar = null;
        if (project.getManagerId() != null) {
            AppUserEntity manager = appUserRepository.findById(project.getManagerId()).orElse(null);
            if (manager != null) {
                managerName = fullName(manager);
                managerAvatar = manager.getAvatarUrl();
            }
        }

        // Members
        List<ProjectMemberEntity> memberEntities = projectMemberRepository.findByIdProjectId(projectId);
        List<UserSummaryResponse> members = new ArrayList<>();
        for (ProjectMemberEntity m : memberEntities) {
            appUserRepository.findById(m.getId().getUserId())
                    .ifPresent(u -> members.add(new UserSummaryResponse(u.getId(), fullName(u), u.getAvatarUrl())));
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

        // Recent tasks (limit 5)
        List<TaskEntity> recentTaskEntities = taskRepository
                .findByTenantIdAndProjectIdOrderByCreatedAtDesc(tenantId, projectId)
                .stream()
                .limit(5)
                .collect(Collectors.toList());
        List<TaskResponse> recentTasks = new ArrayList<>();
        for (TaskEntity t : recentTaskEntities) {
            recentTasks.add(toTaskResponse(t, currentUser));
        }

        // Days remaining
        int daysRemaining = 0;
        if (project.getDueDate() != null) {
            long diff = ChronoUnit.DAYS.between(LocalDate.now(), project.getDueDate());
            daysRemaining = (int) Math.max(0, diff);
        }

        return new ProjectDetailResponse(
                project.getId(),
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

    // ── Tasks ─────────────────────────────────────────────────────────────────

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
        applyTaskUpsert(task, request, currentUser);

        TaskEntity saved = taskRepository.save(task);
        saveAssignees(saved.getId(), request.assigneeIds());
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
        saveAssignees(saved.getId(), request.assigneeIds());
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

        List<UUID> blockedBy = taskDependencyRepository.findByIdTaskId(task.getId())
            .stream()
            .map(dep -> dep.getId().getBlockedByTaskId())
            .toList();

        return new TaskResponse(
                task.getId(),
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

    private TaskDetailResponse toTaskDetailResponse(TaskEntity task, AppUserEntity currentUser, UUID tenantId) {
        // Build base task data
        List<UserSummaryResponse> assignees = new ArrayList<>();
        List<TaskAssigneeEntity> taskAssignees = taskAssigneeRepository.findByIdTaskId(task.getId());
        Set<UUID> assigneeIds = new HashSet<>();
        for (TaskAssigneeEntity assignee : taskAssignees) {
            assigneeIds.add(assignee.getId().getUserId());
            appUserRepository.findById(assignee.getId().getUserId())
                    .ifPresent(u -> assignees.add(new UserSummaryResponse(u.getId(), fullName(u), u.getAvatarUrl())));
        }

        List<TaskReviewResponse> reviews = taskReviewRepository
                .findByTenantIdAndTaskIdOrderByCreatedAtAsc(tenantId, task.getId())
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

        // Subtasks
        List<TaskSubtaskResponse> subtasks = taskSubtaskRepository
                .findByTaskIdOrderByCreatedAtAsc(task.getId())
                .stream()
                .map(s -> new TaskSubtaskResponse(s.getId(), s.getTitle(), Boolean.TRUE.equals(s.getCompleted())))
                .collect(Collectors.toList());

        // Comments
        List<TaskCommentResponse> comments = taskCommentRepository
                .findByTaskIdOrderByCreatedAtAsc(task.getId())
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

        // Activities
        List<TaskActivityResponse> activities = taskActivityRepository
                .findByTaskIdOrderByCreatedAtAsc(task.getId())
                .stream()
                .map(a -> {
                    AppUserEntity actor = a.getActorId() != null ? appUserRepository.findById(a.getActorId()).orElse(null) : null;
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
        project.setName(request.title());
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
        task.setStageId(request.stageId());
        // Normalize jsonb tags to a valid JSON string to prevent casting errors.
        task.setTags(normalizeTags(request.tags()));
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
