package com.onfis.project.controller;

import com.onfis.project.dto.CurrentUserResponse;
import com.onfis.project.dto.MilestoneUpsertRequest;
import com.onfis.project.dto.MilestoneResponse;
import com.onfis.project.dto.ProjectDetailResponse;
import com.onfis.project.dto.ProjectMemberRequest;
import com.onfis.project.dto.ProjectMemberResponse;
import com.onfis.project.dto.ProjectResponse;
import com.onfis.project.dto.ProjectUpsertRequest;
import com.onfis.project.dto.ReviewCreateRequest;
import com.onfis.project.dto.TaskDependencyRequest;
import com.onfis.project.dto.TaskCommentRequest;
import com.onfis.project.dto.TaskCommentResponse;
import com.onfis.project.dto.TaskDetailResponse;
import com.onfis.project.dto.TaskResponse;
import com.onfis.project.dto.TaskStageUpdateRequest;
import com.onfis.project.dto.TaskSubtaskRequest;
import com.onfis.project.dto.TaskSubtaskResponse;
import com.onfis.project.dto.TaskUpsertRequest;
import com.onfis.project.dto.UserSearchResponse;
import com.onfis.project.dto.WorkflowStageReorderRequest;
import com.onfis.project.dto.WorkflowStageResponse;
import com.onfis.project.dto.WorkflowStageUpsertRequest;
import com.onfis.project.service.ProjectModuleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private static final String USER_HEADER = "X-User-ID";

    private final ProjectModuleService projectModuleService;

    public ProjectController(ProjectModuleService projectModuleService) {
        this.projectModuleService = projectModuleService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health(
            @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
        Map<String, String> response = new HashMap<>();
        response.put("service", "project-service");
        response.put("status", "UP");
        response.put("port", "8082");
        if (companyId != null) response.put("companyId", companyId);
        return ResponseEntity.ok(response);
    }

    // ── Current user ──────────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(@RequestHeader(USER_HEADER) String userId) {
        return ResponseEntity.ok(projectModuleService.getCurrentUser(userId));
    }

    // ── User search ───────────────────────────────────────────────────────────

    @GetMapping("/users/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestHeader(USER_HEADER) String userId,
            @RequestParam(required = false, defaultValue = "") String q
    ) {
        return ResponseEntity.ok(projectModuleService.searchUsers(userId, q));
    }

    // ── Projects ──────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> listProjects(@RequestHeader(USER_HEADER) String userId) {
        return ResponseEntity.ok(projectModuleService.listProjects(userId));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @RequestHeader(USER_HEADER) String userId,
            @Valid @RequestBody ProjectUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.createProject(userId, request));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.getProject(userId, projectId));
    }

    @GetMapping("/{projectId}/detail")
    public ResponseEntity<ProjectDetailResponse> getProjectDetail(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.getProjectDetail(userId, projectId));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateProject(userId, projectId, request));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        projectModuleService.deleteProject(userId, projectId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/favorite")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        boolean isNowStarred = projectModuleService.toggleFavorite(userId, projectId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("isStarred", isNowStarred);
        return ResponseEntity.ok(resp);
    }

    // ── Members ───────────────────────────────────────────────────────────────

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectMemberResponse>> listMembers(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.listMembers(userId, projectId));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ProjectMemberResponse> addMember(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectMemberRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.addMember(userId, projectId, request));
    }

    @PutMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectMemberResponse> updateMemberRole(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @PathVariable UUID memberId,
            @Valid @RequestBody ProjectMemberRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateMemberRole(userId, projectId, memberId, request));
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @PathVariable UUID memberId
    ) {
        projectModuleService.removeMember(userId, projectId, memberId);
        return ResponseEntity.noContent().build();
    }

    // ── Workflow stages ────────────────────────────────────────────────────────

    @GetMapping("/{projectId}/stages")
    public ResponseEntity<List<WorkflowStageResponse>> listStages(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.listStages(userId, projectId));
    }

    @PostMapping("/{projectId}/stages")
    public ResponseEntity<WorkflowStageResponse> createStage(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody WorkflowStageUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.createStage(userId, projectId, request));
    }

    @PutMapping("/{projectId}/stages/{stageId}")
    public ResponseEntity<WorkflowStageResponse> updateStage(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @PathVariable UUID stageId,
            @Valid @RequestBody WorkflowStageUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateStage(userId, projectId, stageId, request));
    }

    @DeleteMapping("/{projectId}/stages/{stageId}")
    public ResponseEntity<Void> deleteStage(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @PathVariable UUID stageId
    ) {
        projectModuleService.deleteStage(userId, projectId, stageId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{projectId}/stages/reorder")
    public ResponseEntity<List<WorkflowStageResponse>> reorderStages(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody WorkflowStageReorderRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.reorderStages(userId, projectId, request));
    }

    // ── Milestones ─────────────────────────────────────────────────────────────

    @GetMapping("/{projectId}/milestones")
    public ResponseEntity<List<MilestoneResponse>> listMilestones(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.listMilestones(userId, projectId));
    }

    @PostMapping("/{projectId}/milestones")
    public ResponseEntity<MilestoneResponse> createMilestone(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @RequestBody MilestoneUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.createMilestone(userId, projectId, request));
    }

    @PutMapping("/{projectId}/milestones/{milestoneId}")
    public ResponseEntity<MilestoneResponse> updateMilestone(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @PathVariable UUID milestoneId,
            @RequestBody MilestoneUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateMilestone(userId, projectId, milestoneId, request));
    }

    @DeleteMapping("/{projectId}/milestones/{milestoneId}")
    public ResponseEntity<Void> deleteMilestone(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @PathVariable UUID milestoneId
    ) {
        projectModuleService.deleteMilestone(userId, projectId, milestoneId);
        return ResponseEntity.noContent().build();
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────

    @GetMapping("/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> listTasks(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.listTasks(userId, projectId));
    }

    @GetMapping("/tasks/me")
    public ResponseEntity<List<TaskResponse>> listMyTasks(
            @RequestHeader(USER_HEADER) String userId
    ) {
        return ResponseEntity.ok(projectModuleService.listMyTasks(userId));
    }

    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody TaskUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.createTask(userId, projectId, request));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId
    ) {
        return ResponseEntity.ok(projectModuleService.getTask(userId, taskId));
    }

    @GetMapping("/tasks/{taskId}/detail")
    public ResponseEntity<TaskDetailResponse> getTaskDetail(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId
    ) {
        return ResponseEntity.ok(projectModuleService.getTaskDetail(userId, taskId));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateTask(userId, taskId, request));
    }

    @PatchMapping("/tasks/{taskId}/stage")
    public ResponseEntity<TaskResponse> updateTaskStage(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskStageUpdateRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateTaskStage(userId, taskId, request));
    }

    @PostMapping("/tasks/{taskId}/dependencies")
    public ResponseEntity<TaskResponse> addDependency(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskDependencyRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.addDependency(userId, taskId, request));
    }

    @DeleteMapping("/tasks/{taskId}/dependencies/{blockedByTaskId}")
    public ResponseEntity<TaskResponse> removeDependency(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @PathVariable UUID blockedByTaskId
    ) {
        return ResponseEntity.ok(projectModuleService.removeDependency(userId, taskId, blockedByTaskId));
    }

    @PostMapping("/tasks/{taskId}/reviews")
    public ResponseEntity<TaskResponse> reviewTask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody ReviewCreateRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.reviewTask(userId, taskId, request));
    }

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<List<TaskCommentResponse>> listComments(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId
    ) {
        return ResponseEntity.ok(projectModuleService.listComments(userId, taskId));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<TaskCommentResponse> addComment(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskCommentRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.addComment(userId, taskId, request));
    }

    // ── Task subtasks ───────────────────────────────────────────────────────

    @PostMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<TaskSubtaskResponse> createSubtask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @RequestBody TaskSubtaskRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.createSubtask(userId, taskId, request));
    }

    @PutMapping("/tasks/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<TaskSubtaskResponse> updateSubtask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @PathVariable UUID subtaskId,
            @RequestBody TaskSubtaskRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateSubtask(userId, taskId, subtaskId, request));
    }

    @DeleteMapping("/tasks/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @PathVariable UUID subtaskId
    ) {
        projectModuleService.deleteSubtask(userId, taskId, subtaskId);
        return ResponseEntity.noContent().build();
    }

    // ── Review queue ──────────────────────────────────────────────────────────

    @GetMapping("/reviews")
    public ResponseEntity<List<TaskResponse>> reviewQueue(
            @RequestHeader(USER_HEADER) String userId,
            @RequestParam(required = false) UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.reviewQueue(userId, projectId));
    }
}
