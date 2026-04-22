package com.onfis.position.controller;

import com.onfis.position.dto.AssignUserRequest;
import com.onfis.position.dto.DepartmentResponse;
import com.onfis.position.dto.DepartmentWithEmployeesResponse;
import com.onfis.position.dto.MovePositionRequest;
import com.onfis.position.dto.PositionMeResponse;
import com.onfis.position.dto.PositionResponse;
import com.onfis.position.dto.PositionTreeResponse;
import com.onfis.position.dto.PositionUpsertRequest;
import com.onfis.position.dto.UnassignedUserResponse;
import com.onfis.position.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    // ── Current user ──────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<PositionMeResponse> me(
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(positionService.getCurrentUser(userId));
    }

    // ── Tree view ─────────────────────────────────────────────────────

    @GetMapping("/tree")
    public ResponseEntity<PositionTreeResponse> getPositionTree() {
        return ResponseEntity.ok(positionService.getPositionTree());
    }

    // ── List view (departments with employees) ────────────────────────

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentWithEmployeesResponse>> getDepartmentsWithEmployees() {
        return ResponseEntity.ok(positionService.getDepartmentsWithEmployees());
    }

    // ── Department dropdown list ──────────────────────────────────────

    @GetMapping("/department-list")
    public ResponseEntity<List<DepartmentResponse>> getDepartmentList() {
        return ResponseEntity.ok(positionService.getDepartmentList());
    }

    // ── Unassigned users ──────────────────────────────────────────────

    @GetMapping("/unassigned-users")
    public ResponseEntity<List<UnassignedUserResponse>> getUnassignedUsers() {
        return ResponseEntity.ok(positionService.getUnassignedUsers());
    }

    // ── CRUD ──────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<PositionResponse> createPosition(@RequestBody PositionUpsertRequest request) {
        return ResponseEntity.ok(positionService.createPosition(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PositionResponse> updatePosition(
            @PathVariable UUID id,
            @RequestBody PositionUpsertRequest request) {
        return ResponseEntity.ok(positionService.updatePosition(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePosition(@PathVariable UUID id) {
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }

    // ── Move (drag-and-drop) ──────────────────────────────────────────

    @PatchMapping("/{id}/move")
    public ResponseEntity<PositionResponse> movePosition(
            @PathVariable UUID id,
            @RequestBody MovePositionRequest request) {
        return ResponseEntity.ok(positionService.movePosition(id, request));
    }

    // ── Assign user ───────────────────────────────────────────────────

    @PostMapping("/{id}/assign")
    public ResponseEntity<Void> assignUserToPosition(
            @PathVariable UUID id,
            @RequestBody AssignUserRequest request) {
        positionService.assignUserToPosition(id, request);
        return ResponseEntity.ok().build();
    }

    // ── Remove user from unassigned list ──────────────────────────────

    @DeleteMapping("/unassigned-users/{userId}")
    public ResponseEntity<Void> removeUnassignedUser(@PathVariable UUID userId) {
        positionService.removeUnassignedUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ── Unassign user ─────────────────────────────────────────────────

    @DeleteMapping("/{id}/users/{userId}")
    public ResponseEntity<Void> unassignUserFromPosition(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        positionService.unassignUserFromPosition(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Get single position ───────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<PositionResponse> getPositionById(@PathVariable UUID id) {
        return ResponseEntity.ok(positionService.getPositionById(id));
    }
}
