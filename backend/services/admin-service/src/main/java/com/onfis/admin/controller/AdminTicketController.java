package com.onfis.admin.controller;

import com.onfis.admin.dto.AddTicketCommentRequest;
import com.onfis.admin.dto.RejectTicketRequest;
import com.onfis.admin.dto.TicketResponse;
import com.onfis.admin.service.AdminTicketService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminTicketController {

    private final AdminTicketService adminTicketService;

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> listTickets(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(adminTicketService.listTickets(tenantId, userId));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> getTicket(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable("id") String ticketId) {
        return ResponseEntity.ok(adminTicketService.getTicket(tenantId, userId, ticketId));
    }

    @PostMapping("/tickets/{id}/approve")
    public ResponseEntity<Void> approveTicket(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable("id") String ticketId) {
        adminTicketService.approveTicket(tenantId, userId, ticketId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tickets/{id}/reject")
    public ResponseEntity<Void> rejectTicket(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable("id") String ticketId,
            @RequestBody RejectTicketRequest request) {
        adminTicketService.rejectTicket(tenantId, userId, ticketId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tickets/{id}/comments")
    public ResponseEntity<Void> addComment(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable("id") String ticketId,
            @RequestBody AddTicketCommentRequest request) {
        adminTicketService.addTicketComment(tenantId, userId, ticketId, request);
        return ResponseEntity.noContent().build();
    }
}
