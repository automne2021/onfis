package com.onfis.position.controller;

import com.onfis.position.dto.AssignUserRequest;
import com.onfis.position.dto.DepartmentResponse;
import com.onfis.position.dto.DepartmentWithEmployeesResponse;
import com.onfis.position.dto.MovePositionRequest;
import com.onfis.position.dto.PositionResponse;
import com.onfis.position.dto.PositionTreeResponse;
import com.onfis.position.dto.PositionUpsertRequest;
import com.onfis.position.dto.UnassignedUserResponse;
import com.onfis.position.service.PositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/positions")
public class PositionController {

    private final PositionService positionService;

    public PositionController(PositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health(
            @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
        Map<String, String> response = new HashMap<>();
        response.put("service", "position-service");
        response.put("status", "UP");
        response.put("port", "8083");
        if (companyId != null) response.put("companyId", companyId);
        return ResponseEntity.ok(response);
    }

    // ── Tree view ─────────────────────────────────────────────────────────────

    @GetMapping("/tree")
    public ResponseEntity<PositionTreeResponse> getPositionTree() {
        return ResponseEntity.ok(positionService.getPositionTree());
    }

    // ── List view (departments with employees) ────────────────────────────────

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentWithEmployeesResponse>> getDepartmentsWithEmployees() {
        return ResponseEntity.ok(positionService.getDepartmentsWithEmployees());
    }

    // ── Department dropdown list ──────────────────────────────────────────────

    @GetMapping("/department-list")
    public ResponseEntity<List<DepartmentResponse>> getDepartmentList() {
        return ResponseEntity.ok(positionService.getDepartmentList());
    }

    // ── Unassigned users ──────────────────────────────────────────────────────

    @GetMapping("/unassigned-users")
    public ResponseEntity<List<UnassignedUserResponse>> getUnassignedUsers() {
        return ResponseEntity.ok(positionService.getUnassignedUsers());
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

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

    // ── Move (drag-and-drop) ──────────────────────────────────────────────────

    @PatchMapping("/{id}/move")
    public ResponseEntity<PositionResponse> movePosition(
            @PathVariable UUID id,
            @RequestBody MovePositionRequest request) {
        return ResponseEntity.ok(positionService.movePosition(id, request));
    }

    // ── Assign user ───────────────────────────────────────────────────────────

    @PostMapping("/{id}/assign")
    public ResponseEntity<Void> assignUserToPosition(
            @PathVariable UUID id,
            @RequestBody AssignUserRequest request) {
        positionService.assignUserToPosition(id, request);
        return ResponseEntity.ok().build();
    }
}
