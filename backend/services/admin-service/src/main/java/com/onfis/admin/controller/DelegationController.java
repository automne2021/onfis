package com.onfis.admin.controller;

import com.onfis.admin.dto.AssignableUserResponse;
import com.onfis.admin.dto.CreateDelegationRequest;
import com.onfis.admin.dto.DelegationResponse;
import com.onfis.admin.dto.UpdateDelegationStatusRequest;
import com.onfis.admin.service.DelegationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class DelegationController {

    private final DelegationService delegationService;

    @GetMapping("/delegations")
    public ResponseEntity<List<DelegationResponse>> listDelegations(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(delegationService.listDelegations(tenantId, userId));
    }

    @PostMapping("/delegations")
    public ResponseEntity<DelegationResponse> createDelegation(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestBody CreateDelegationRequest request) {
        DelegationResponse created = delegationService.createDelegation(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/delegations/{id}/status")
    public ResponseEntity<Void> updateDelegationStatus(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable("id") String delegationId,
            @RequestBody UpdateDelegationStatusRequest request) {
        delegationService.updateDelegationStatus(tenantId, userId, delegationId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delegations/{id}")
    public ResponseEntity<Void> deleteDelegation(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable("id") String delegationId) {
        delegationService.deleteDelegation(tenantId, userId, delegationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/delegations/assignable-users")
    public ResponseEntity<List<AssignableUserResponse>> listAssignableUsers(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(delegationService.listAssignableUsers(tenantId, userId));
    }
}
