package com.onfis.position.service;

import com.onfis.position.dto.AssignUserRequest;
import com.onfis.position.dto.DepartmentResponse;
import com.onfis.position.dto.DepartmentWithEmployeesResponse;
import com.onfis.position.dto.EmployeeResponse;
import com.onfis.position.dto.MovePositionRequest;
import com.onfis.position.dto.PositionMeResponse;
import com.onfis.position.dto.PositionResponse;
import com.onfis.position.dto.PositionTreeResponse;
import com.onfis.position.dto.PositionUpsertRequest;
import com.onfis.position.dto.UnassignedUserResponse;
import com.onfis.position.entity.AppUserEntity;
import com.onfis.position.entity.DepartmentEntity;
import com.onfis.position.entity.PositionEntity;
import com.onfis.position.exception.BadRequestException;
import com.onfis.position.exception.NotFoundException;
import com.onfis.position.repository.AppUserRepository;
import com.onfis.position.repository.DepartmentRepository;
import com.onfis.position.repository.PositionRepository;
import com.onfis.shared.security.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PositionService {

    private final TenantContext tenantContext;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final AppUserRepository appUserRepository;

    public PositionService(TenantContext tenantContext,
            PositionRepository positionRepository,
            DepartmentRepository departmentRepository,
            AppUserRepository appUserRepository) {
        this.tenantContext = tenantContext;
        this.positionRepository = positionRepository;
        this.departmentRepository = departmentRepository;
        this.appUserRepository = appUserRepository;
    }

    // ── Current user info ─────────────────────────────────────────────────────

    public PositionMeResponse getCurrentUser(String userId) {
        UUID uid = UUID.fromString(userId);
        AppUserEntity user = appUserRepository.findById(uid)
                .orElseThrow(() -> new NotFoundException("User not found"));

        String positionTitle = null;
        if (user.getPositionId() != null) {
            positionTitle = positionRepository.findById(user.getPositionId())
                    .map(PositionEntity::getTitle)
                    .orElse(null);
        }

        return new PositionMeResponse(
                user.getId().toString(),
                user.getLevel(),
                user.getRole(),
                user.getPositionId() != null ? user.getPositionId().toString() : null,
                positionTitle);
    }

    // ── Tree view ─────────────────────────────────────────────────────────────

    public PositionTreeResponse getPositionTree() {
        UUID tenantId = tenantId();
        List<PositionEntity> allPositions = positionRepository.findByTenantId(tenantId);
        List<AppUserEntity> allUsers = appUserRepository.findByTenantId(tenantId);
        List<DepartmentEntity> allDepts = departmentRepository.findByTenantId(tenantId);

        // Build department name lookup
        Map<UUID, String> deptNameById = new HashMap<>();
        for (DepartmentEntity dept : allDepts) {
            deptNameById.put(dept.getId(), dept.getName());
        }

        // Build user lookup by positionId — all users per position
        Map<UUID, List<AppUserEntity>> usersByPosition = new HashMap<>();
        for (AppUserEntity user : allUsers) {
            if (user.getPositionId() != null) {
                usersByPosition.computeIfAbsent(user.getPositionId(), k -> new ArrayList<>()).add(user);
            }
        }

        // Build children lookup by parentId
        Map<UUID, List<PositionEntity>> childrenMap = new HashMap<>();
        List<PositionEntity> roots = new ArrayList<>();
        for (PositionEntity pos : allPositions) {
            if (pos.getParentId() == null) {
                roots.add(pos);
            } else {
                childrenMap.computeIfAbsent(pos.getParentId(), k -> new ArrayList<>()).add(pos);
            }
        }

        if (roots.isEmpty()) {
            return new PositionTreeResponse(
                    null, "empty", "No Positions", "Organization", null, true, null, null, null, null, 0, List.of(),
                    null, null);
        }

        // Pick the root with the highest-level user (or first if tied/vacant)
        PositionEntity mainRoot = roots.stream()
                .max((a, b) -> {
                    List<AppUserEntity> ua = usersByPosition.getOrDefault(a.getId(), List.of());
                    List<AppUserEntity> ub = usersByPosition.getOrDefault(b.getId(), List.of());
                    int la = levelToInt(ua.isEmpty() ? null : ua.get(0).getLevel());
                    int lb = levelToInt(ub.isEmpty() ? null : ub.get(0).getLevel());
                    return Integer.compare(la, lb);
                })
                .orElse(roots.get(0));

        // Attach all other roots as children of the main root
        List<PositionEntity> otherRoots = new ArrayList<>(roots);
        otherRoots.remove(mainRoot);
        for (PositionEntity other : otherRoots) {
            childrenMap.computeIfAbsent(mainRoot.getId(), k -> new ArrayList<>()).add(other);
        }

        // Skip vacant root: if the top position has no assigned user, promote
        // the highest-level child as the new root
        mainRoot = skipVacantRoot(mainRoot, childrenMap, usersByPosition);

        // Build per-person nodes for the root position
        List<PositionTreeResponse> rootPersonNodes = buildPersonNodes(mainRoot, childrenMap, usersByPosition,
                deptNameById);

        if (rootPersonNodes.isEmpty()) {
            return new PositionTreeResponse(
                    null, "empty", "No Positions", "Organization", null, true, null, null, null, null, 0, List.of(),
                    null, null);
        }
        if (rootPersonNodes.size() == 1) {
            return rootPersonNodes.get(0);
        }

        // Multiple persons at root: first is the tree root, the rest become its
        // first-level children
        PositionTreeResponse firstRoot = rootPersonNodes.get(0);
        List<PositionTreeResponse> siblings = new ArrayList<>(rootPersonNodes.subList(1, rootPersonNodes.size()));
        List<PositionTreeResponse> mergedChildren = new ArrayList<>(siblings);
        if (firstRoot.children() != null)
            mergedChildren.addAll(firstRoot.children());

        return new PositionTreeResponse(
                firstRoot.id(), firstRoot.positionId(), firstRoot.name(), firstRoot.title(),
                firstRoot.avatar(), firstRoot.isVacant(), firstRoot.status(), firstRoot.level(),
                firstRoot.role(), firstRoot.email(),
                mergedChildren.isEmpty() ? null : mergedChildren.size(),
                mergedChildren.isEmpty() ? null : mergedChildren,
                firstRoot.departmentId(), firstRoot.departmentName());
    }

    private static int levelToInt(String level) {
        if (level == null)
            return 0;
        try {
            return Integer.parseInt(level.replace("L", "").replace("l", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * If the given root position is vacant (no assigned users), promote the
     * highest-level child as the new root.
     */
    private PositionEntity skipVacantRoot(PositionEntity root,
            Map<UUID, List<PositionEntity>> childrenMap,
            Map<UUID, List<AppUserEntity>> usersByPosition) {
        List<AppUserEntity> rootUsers = usersByPosition.getOrDefault(root.getId(), List.of());
        if (!rootUsers.isEmpty()) {
            return root; // root is occupied
        }
        List<PositionEntity> children = childrenMap.getOrDefault(root.getId(), List.of());
        if (children.isEmpty()) {
            return root; // vacant with no children — keep it
        }
        // Find the highest-level child
        PositionEntity newRoot = children.stream()
                .max((a, b) -> {
                    List<AppUserEntity> ua = usersByPosition.getOrDefault(a.getId(), List.of());
                    List<AppUserEntity> ub = usersByPosition.getOrDefault(b.getId(), List.of());
                    return Integer.compare(
                            levelToInt(ua.isEmpty() ? null : ua.get(0).getLevel()),
                            levelToInt(ub.isEmpty() ? null : ub.get(0).getLevel()));
                })
                .orElse(children.get(0));

        // Attach the other children to the new root
        List<PositionEntity> siblings = children.stream()
                .filter(c -> !c.getId().equals(newRoot.getId()))
                .toList();
        if (!siblings.isEmpty()) {
            childrenMap.computeIfAbsent(newRoot.getId(), k -> new ArrayList<>()).addAll(siblings);
        }
        return newRoot;
    }

    /**
     * Build one tree node per user in this position. The first user gets all
     * child nodes; subsequent users are leaf nodes (same level, no children).
     * If the position is vacant, a single vacant placeholder node is returned.
     */
    private List<PositionTreeResponse> buildPersonNodes(PositionEntity position,
            Map<UUID, List<PositionEntity>> childrenMap,
            Map<UUID, List<AppUserEntity>> usersByPosition,
            Map<UUID, String> deptNameById) {

        List<AppUserEntity> users = usersByPosition.getOrDefault(position.getId(), List.of());
        String deptId = position.getDepartmentId() != null ? position.getDepartmentId().toString() : null;
        String deptName = position.getDepartmentId() != null ? deptNameById.get(position.getDepartmentId()) : null;

        // Build all child person-nodes from child positions
        List<PositionEntity> childPositions = childrenMap.getOrDefault(position.getId(), List.of());
        List<PositionTreeResponse> allChildNodes = new ArrayList<>();
        for (PositionEntity childPos : childPositions) {
            allChildNodes.addAll(buildPersonNodes(childPos, childrenMap, usersByPosition, deptNameById));
        }

        // Vacant position: one placeholder node with all children
        if (users.isEmpty()) {
            return List.of(new PositionTreeResponse(
                    null, position.getId().toString(), "Vacant", position.getTitle(),
                    null, true, null, null, null, null,
                    allChildNodes.isEmpty() ? null : allChildNodes.size(),
                    allChildNodes.isEmpty() ? null : allChildNodes,
                    deptId, deptName));
        }

        // One node per user; first user gets all children, others are leaf nodes
        List<PositionTreeResponse> result = new ArrayList<>();
        for (int i = 0; i < users.size(); i++) {
            AppUserEntity user = users.get(i);
            List<PositionTreeResponse> nodeChildren = (i == 0) ? allChildNodes : new ArrayList<>();
            Integer subordinateCount = (i == 0 && !allChildNodes.isEmpty()) ? allChildNodes.size() : null;
            result.add(new PositionTreeResponse(
                    user.getId().toString(),
                    position.getId().toString(),
                    fullName(user),
                    position.getTitle(),
                    user.getAvatarUrl(),
                    false,
                    "on_track",
                    user.getLevel(),
                    user.getRole(),
                    user.getEmail(),
                    subordinateCount,
                    nodeChildren.isEmpty() ? null : nodeChildren,
                    deptId,
                    deptName));
        }
        return result;
    }

    // ── List view (by department) ─────────────────────────────────────────────

    public List<DepartmentWithEmployeesResponse> getDepartmentsWithEmployees() {
        UUID tenantId = tenantId();
        List<DepartmentEntity> departments = departmentRepository.findByTenantId(tenantId);
        List<PositionEntity> allPositions = positionRepository.findByTenantId(tenantId);
        List<AppUserEntity> allUsers = appUserRepository.findByTenantId(tenantId);

        // Build user lookup by positionId — supports multiple users per position
        Map<UUID, List<AppUserEntity>> usersByPosition = new HashMap<>();
        for (AppUserEntity user : allUsers) {
            if (user.getPositionId() != null) {
                usersByPosition.computeIfAbsent(user.getPositionId(), k -> new ArrayList<>()).add(user);
            }
        }

        // Build position lookup by ID for parent resolution (manager)
        Map<UUID, PositionEntity> positionById = new HashMap<>();
        for (PositionEntity pos : allPositions) {
            positionById.put(pos.getId(), pos);
        }

        List<DepartmentWithEmployeesResponse> result = new ArrayList<>();
        for (DepartmentEntity dept : departments) {
            List<PositionEntity> deptPositions = allPositions.stream()
                    .filter(p -> dept.getId().equals(p.getDepartmentId()))
                    .toList();

            List<EmployeeResponse> employees = new ArrayList<>();
            for (PositionEntity pos : deptPositions) {
                List<AppUserEntity> posUsers = usersByPosition.getOrDefault(pos.getId(), List.of());
                boolean isVacant = posUsers.isEmpty();

                // Find manager: first user at the parent position
                EmployeeResponse.ManagerInfo managerInfo = null;
                if (pos.getParentId() != null) {
                    PositionEntity parentPos = positionById.get(pos.getParentId());
                    if (parentPos != null) {
                        List<AppUserEntity> parentUsers = usersByPosition.getOrDefault(parentPos.getId(), List.of());
                        if (!parentUsers.isEmpty()) {
                            AppUserEntity managerUser = parentUsers.get(0);
                            managerInfo = new EmployeeResponse.ManagerInfo(
                                    managerUser.getId().toString(),
                                    fullName(managerUser),
                                    managerUser.getAvatarUrl());
                        }
                    }
                }

                if (isVacant) {
                    employees.add(new EmployeeResponse(
                            pos.getId().toString(),
                            pos.getId().toString(),
                            "Unassigned",
                            null,
                            null,
                            null,
                            pos.getTitle(),
                            null,
                            null,
                            managerInfo,
                            true));
                } else {
                    for (AppUserEntity user : posUsers) {
                        employees.add(new EmployeeResponse(
                                user.getId().toString(),
                                pos.getId().toString(),
                                fullName(user),
                                user.getAvatarUrl(),
                                null, // workPhone — not in users table
                                user.getEmail(),
                                pos.getTitle(),
                                user.getLevel(),
                                user.getRole(),
                                managerInfo,
                                false));
                    }
                }
            }

            result.add(new DepartmentWithEmployeesResponse(
                    dept.getId().toString(),
                    dept.getName(),
                    employees));
        }
        return result;

    }

    // ── Department list (for dropdowns) ───────────────────────────────────────

    public List<DepartmentResponse> getDepartmentList() {
        UUID tenantId = tenantId();
        return departmentRepository.findByTenantId(tenantId).stream()
                .map(d -> new DepartmentResponse(d.getId(), d.getName()))
                .toList();
    }

    // ── Unassigned users ──────────────────────────────────────────────────────

    public List<UnassignedUserResponse> getUnassignedUsers() {
        UUID tenantId = tenantId();
        return appUserRepository.findByTenantIdAndPositionIdIsNull(tenantId).stream()
                .map(u -> new UnassignedUserResponse(
                        u.getId().toString(),
                        fullName(u),
                        u.getAvatarUrl(),
                        u.getRole(),
                        u.getEmail()))
                .toList();
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public PositionResponse createPosition(PositionUpsertRequest request) {
        UUID tenantId = tenantId();

        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("Position title is required");
        }

        PositionEntity entity = new PositionEntity();
        entity.setTenantId(tenantId);
        entity.setTitle(request.title().trim());
        entity.setDescription(request.description());
        entity.setDepartmentId(request.departmentId());
        entity.setParentId(request.parentId());

        PositionEntity saved = positionRepository.save(entity);
        return toPositionResponse(saved);
    }

    @Transactional
    public PositionResponse updatePosition(UUID positionId, PositionUpsertRequest request) {
        UUID tenantId = tenantId();
        PositionEntity entity = positionRepository.findByIdAndTenantId(positionId, tenantId)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        if (request.title() != null && !request.title().isBlank()) {
            entity.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            entity.setDescription(request.description());
        }
        if (request.departmentId() != null) {
            entity.setDepartmentId(request.departmentId());
        }
        if (request.parentId() != null) {
            entity.setParentId(request.parentId());
        }

        PositionEntity saved = positionRepository.save(entity);
        return toPositionResponse(saved);
    }

    @Transactional
    public void deletePosition(UUID positionId) {
        UUID tenantId = tenantId();
        PositionEntity entity = positionRepository.findByIdAndTenantId(positionId, tenantId)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        // Check if any users are assigned
        List<AppUserEntity> assignedUsers = appUserRepository.findByPositionId(positionId);
        if (!assignedUsers.isEmpty()) {
            throw new BadRequestException("Cannot delete position with assigned users");
        }

        // Re-parent children to this position's parent
        List<PositionEntity> children = positionRepository.findByTenantIdAndParentId(tenantId, positionId);
        for (PositionEntity child : children) {
            child.setParentId(entity.getParentId());
            positionRepository.save(child);
        }

        positionRepository.delete(entity);
    }

    @Transactional
    public PositionResponse movePosition(UUID positionId, MovePositionRequest request) {
        UUID tenantId = tenantId();
        PositionEntity entity = positionRepository.findByIdAndTenantId(positionId, tenantId)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        // Validate new parent exists (if not null)
        if (request.newParentId() != null) {
            positionRepository.findByIdAndTenantId(request.newParentId(), tenantId)
                    .orElseThrow(() -> new NotFoundException("Target parent position not found"));

            // Prevent circular reference
            if (isDescendant(positionId, request.newParentId(), tenantId)) {
                throw new BadRequestException("Cannot move a position under its own descendant");
            }
        }

        entity.setParentId(request.newParentId());
        PositionEntity saved = positionRepository.save(entity);
        return toPositionResponse(saved);
    }

    @Transactional
    public void unassignUserFromPosition(UUID positionId, UUID userId) {
        UUID tenantId = tenantId();
        positionRepository.findByIdAndTenantId(positionId, tenantId)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        AppUserEntity user = appUserRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!tenantId.equals(user.getTenantId())) {
            throw new BadRequestException("User does not belong to this tenant");
        }

        if (!positionId.equals(user.getPositionId())) {
            throw new BadRequestException("User is not assigned to this position");
        }

        user.setPositionId(null);
        appUserRepository.save(user);
    }

    @Transactional
    public void assignUserToPosition(UUID positionId, AssignUserRequest request) {
        UUID tenantId = tenantId();
        positionRepository.findByIdAndTenantId(positionId, tenantId)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        AppUserEntity user = appUserRepository.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!tenantId.equals(user.getTenantId())) {
            throw new BadRequestException("User does not belong to this tenant");
        }

        // Handle displaced occupant when assigning to an already-occupied position
        if (request.displacedAction() != null) {
            List<AppUserEntity> currentOccupants = appUserRepository.findByTenantIdAndPositionId(tenantId, positionId);
            for (AppUserEntity occupant : currentOccupants) {
                if (!occupant.getId().equals(request.userId())) {
                    if ("remove".equals(request.displacedAction())) {
                        appUserRepository.delete(occupant);
                    } else {
                        // "unassign" — move to unassigned list
                        occupant.setPositionId(null);
                        appUserRepository.save(occupant);
                    }
                }
            }
        }

        user.setPositionId(positionId);
        appUserRepository.save(user);
    }

    @Transactional
    public void removeUnassignedUser(UUID userId) {
        UUID tenantId = tenantId();
        AppUserEntity user = appUserRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!tenantId.equals(user.getTenantId())) {
            throw new BadRequestException("User does not belong to this tenant");
        }

        if (user.getPositionId() != null) {
            throw new BadRequestException("User is still assigned to a position");
        }

        appUserRepository.delete(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isDescendant(UUID ancestorId, UUID nodeId, UUID tenantId) {
        // Check if nodeId is a descendant of ancestorId
        List<PositionEntity> children = positionRepository.findByTenantIdAndParentId(tenantId, ancestorId);
        for (PositionEntity child : children) {
            if (child.getId().equals(nodeId)) {
                return true;
            }
            if (isDescendant(child.getId(), nodeId, tenantId)) {
                return true;
            }
        }
        return false;
    }

    private PositionResponse toPositionResponse(PositionEntity entity) {
        List<AppUserEntity> assigned = appUserRepository.findByPositionId(entity.getId());
        AppUserEntity user = assigned.isEmpty() ? null : assigned.get(0);

        String departmentName = null;
        if (entity.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(entity.getDepartmentId())
                    .map(DepartmentEntity::getName)
                    .orElse(null);
        }

        return new PositionResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getDepartmentId(),
                departmentName,
                entity.getParentId(),
                user != null ? user.getId() : null,
                user != null ? fullName(user) : null,
                user != null ? user.getLevel() : null,
                user != null ? user.getRole() : null,
                user == null,
                entity.getCreatedAt());
    }

    private UUID tenantId() {
        String tenantIdStr = tenantContext.getTenantId();
        if (tenantIdStr == null || tenantIdStr.isBlank()) {
            throw new BadRequestException("Tenant ID is required");
        }
        return UUID.fromString(tenantIdStr);
    }

    private String fullName(AppUserEntity user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? (user.getEmail() != null ? user.getEmail() : "Unknown") : full;
    }
}
