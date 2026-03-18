package com.onfis.project.controller;

import com.onfis.project.dto.CurrentUserResponse;
import com.onfis.project.dto.ProjectMemberRequest;
import com.onfis.project.dto.ProjectMemberResponse;
import com.onfis.project.dto.ProjectResponse;
import com.onfis.project.dto.ProjectUpsertRequest;
import com.onfis.project.dto.ReviewCreateRequest;
import com.onfis.project.dto.TaskResponse;
import com.onfis.project.dto.TaskUpsertRequest;
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

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(@RequestHeader(USER_HEADER) String userId) {
        return ResponseEntity.ok(projectModuleService.getCurrentUser(userId));
    }

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

    @GetMapping("/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> listTasks(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.listTasks(userId, projectId));
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

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskUpsertRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.updateTask(userId, taskId, request));
    }

    @PostMapping("/tasks/{taskId}/reviews")
    public ResponseEntity<TaskResponse> reviewTask(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @Valid @RequestBody ReviewCreateRequest request
    ) {
        return ResponseEntity.ok(projectModuleService.reviewTask(userId, taskId, request));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<TaskResponse>> reviewQueue(
            @RequestHeader(USER_HEADER) String userId,
            @RequestParam(required = false) UUID projectId
    ) {
        return ResponseEntity.ok(projectModuleService.reviewQueue(userId, projectId));
    }
}
