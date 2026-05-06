package com.onfis.project.service;

import com.onfis.project.domain.GlobalRole;
import com.onfis.project.dto.AttachmentResponse;
import com.onfis.project.entity.AppUserEntity;
import com.onfis.project.entity.AttachmentEntity;
import com.onfis.project.entity.TaskAssigneeEntity;
import com.onfis.project.entity.TaskEntity;
import com.onfis.project.exception.BadRequestException;
import com.onfis.project.exception.ForbiddenException;
import com.onfis.project.exception.NotFoundException;
import com.onfis.project.repository.AppUserRepository;
import com.onfis.project.repository.AttachmentRepository;
import com.onfis.project.repository.ProjectMemberRepository;
import com.onfis.project.repository.TaskAssigneeRepository;
import com.onfis.project.repository.TaskRepository;
import com.onfis.shared.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    public static final String TYPE_TASK_REFERENCE = "TASK_REFERENCE";
    public static final String TYPE_TASK_SUBMISSION = "TASK_SUBMISSION";
    public static final String TYPE_PROJECT_FILE    = "PROJECT_FILE";

    private final AttachmentRepository attachmentRepository;
    private final AppUserRepository appUserRepository;
    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final TenantContext tenantContext;

    // ── Task Reference Files (project manager / reporter can upload) ──────────

    @Transactional
    public AttachmentResponse uploadTaskAttachment(String userIdHeader, UUID taskId, MultipartFile file) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);

        if (!isManager(user) && !user.getId().equals(task.getReporterId())) {
            throw new ForbiddenException("Only managers or the task reporter can upload task reference files");
        }

        String fileUrl = supabaseStorageService.uploadFile("task-files", file);
        AttachmentEntity entity = buildAttachment(tenantId, file, fileUrl, user.getId(), TYPE_TASK_REFERENCE);
        entity.setTaskId(taskId);
        return toResponse(attachmentRepository.save(entity), fullName(user));
    }

    public List<AttachmentResponse> getTaskAttachments(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);
        requireTask(taskId, tenantId);
        enforceProjectMemberOrManager(user, taskId, tenantId);
        return fetchAndMap(tenantId, taskId, TYPE_TASK_REFERENCE);
    }

    // ── Task Submission Files (assignee only, always visible after upload) ────

    @Transactional
    public AttachmentResponse uploadTaskSubmission(String userIdHeader, UUID taskId, MultipartFile file) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);
        TaskEntity task = requireTask(taskId, tenantId);

        boolean isAssignee = taskAssigneeRepository.findByIdTaskId(taskId)
                .stream().anyMatch(a -> a.getId().getUserId().equals(user.getId()));

        if (!isAssignee && !isManager(user)) {
            throw new ForbiddenException("Only task assignees can upload submission files");
        }

        String fileUrl = supabaseStorageService.uploadFile("task-submissions", file);
        AttachmentEntity entity = buildAttachment(tenantId, file, fileUrl, user.getId(), TYPE_TASK_SUBMISSION);
        entity.setTaskId(taskId);
        return toResponse(attachmentRepository.save(entity), fullName(user));
    }

    public List<AttachmentResponse> getTaskSubmissions(String userIdHeader, UUID taskId) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);
        requireTask(taskId, tenantId);
        enforceProjectMemberOrManager(user, taskId, tenantId);
        return fetchAndMap(tenantId, taskId, TYPE_TASK_SUBMISSION);
    }

    // ── Project Files ─────────────────────────────────────────────────────────

    @Transactional
    public AttachmentResponse uploadProjectAttachment(String userIdHeader, UUID projectId, MultipartFile file) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);

        if (!isManager(user)) {
            boolean isLead = false;
            Optional<com.onfis.project.entity.ProjectMemberEntity> membership =
                    projectMemberRepository.findByIdProjectIdAndIdUserId(projectId, user.getId());
            if (membership.isPresent()) {
                isLead = "LEAD".equalsIgnoreCase(membership.get().getRole());
            }
            if (!isLead) {
                throw new ForbiddenException("Only managers or the project lead can upload project files");
            }
        }

        String fileUrl = supabaseStorageService.uploadFile("project-files", file);
        AttachmentEntity entity = buildAttachment(tenantId, file, fileUrl, user.getId(), TYPE_PROJECT_FILE);
        entity.setProjectId(projectId);
        return toResponse(attachmentRepository.save(entity), fullName(user));
    }

    public List<AttachmentResponse> getProjectAttachments(String userIdHeader, UUID projectId) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);

        if (!isManager(user) && !projectMemberRepository.existsByIdProjectIdAndIdUserId(projectId, user.getId())) {
            throw new ForbiddenException("No access to this project");
        }

        List<AttachmentEntity> attachments = attachmentRepository.findByTenantIdAndProjectId(tenantId, projectId);
        return mapWithUploaders(attachments, tenantId);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteAttachment(String userIdHeader, UUID attachmentId) {
        UUID tenantId = tenantId();
        AppUserEntity user = requireUser(parseUserId(userIdHeader), tenantId);

        AttachmentEntity attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Attachment not found"));

        if (!tenantId.equals(attachment.getTenantId())) {
            throw new ForbiddenException("Attachment not found in tenant");
        }

        boolean isOwner = user.getId().equals(attachment.getUploadedBy());
        if (!isOwner && !isManager(user)) {
            throw new ForbiddenException("You can only delete your own attachments");
        }

        supabaseStorageService.deleteFile(attachment.getFileUrl());
        attachmentRepository.delete(attachment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<AttachmentResponse> fetchAndMap(UUID tenantId, UUID taskId, String type) {
        List<AttachmentEntity> attachments =
                attachmentRepository.findByTenantIdAndTaskIdAndType(tenantId, taskId, type);
        return mapWithUploaders(attachments, tenantId);
    }

    private List<AttachmentResponse> mapWithUploaders(List<AttachmentEntity> attachments, UUID tenantId) {
        List<UUID> uploaderIds = attachments.stream()
                .filter(a -> a.getUploadedBy() != null)
                .map(AttachmentEntity::getUploadedBy)
                .distinct().toList();

        java.util.Map<UUID, AppUserEntity> usersById = appUserRepository.findAllById(uploaderIds)
                .stream()
                .filter(u -> tenantId.equals(u.getTenantId()))
                .collect(java.util.stream.Collectors.toMap(AppUserEntity::getId, u -> u));

        return attachments.stream()
                .map(a -> toResponse(a, a.getUploadedBy() == null ? null
                        : usersById.containsKey(a.getUploadedBy()) ? fullName(usersById.get(a.getUploadedBy())) : null))
                .toList();
    }

    private void enforceProjectMemberOrManager(AppUserEntity user, UUID taskId, UUID tenantId) {
        if (isManager(user)) return;
        TaskEntity task = requireTask(taskId, tenantId);
        if (!projectMemberRepository.existsByIdProjectIdAndIdUserId(task.getProjectId(), user.getId())) {
            throw new ForbiddenException("No access to this task");
        }
    }

    private AttachmentEntity buildAttachment(UUID tenantId, MultipartFile file, String fileUrl,
                                              UUID uploadedBy, String type) {
        AttachmentEntity entity = new AttachmentEntity();
        entity.setTenantId(tenantId);
        entity.setName(file.getOriginalFilename());
        entity.setFileType(file.getContentType());
        entity.setFileUrl(fileUrl);
        entity.setSize(file.isEmpty() ? 0 : (int) file.getSize());
        entity.setUploadedBy(uploadedBy);
        entity.setType(type);
        return entity;
    }

    private AttachmentResponse toResponse(AttachmentEntity entity, String uploaderName) {
        return new AttachmentResponse(
                entity.getId(),
                entity.getName(),
                entity.getFileUrl(),
                entity.getFileType(),
                entity.getSize(),
                entity.getUploadedBy(),
                uploaderName,
                entity.getCreatedAt());
    }

    private TaskEntity requireTask(UUID taskId, UUID tenantId) {
        return taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
    }

    private AppUserEntity requireUser(UUID userId, UUID tenantId) {
        return appUserRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new NotFoundException("User not found in tenant"));
    }

    private boolean isManager(AppUserEntity user) {
        return GlobalRole.fromDbValue(user.getRole()).isManagerLike();
    }

    private UUID parseUserId(String header) {
        if (header == null || header.isBlank()) throw new BadRequestException("X-User-ID header is required");
        return UUID.fromString(header);
    }

    private UUID tenantId() {
        String tenant = tenantContext.getTenantId();
        if (tenant == null || tenant.isBlank()) throw new BadRequestException("X-Company-ID header is required");
        return UUID.fromString(tenant);
    }

    private String fullName(AppUserEntity user) {
        return ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
    }
}
