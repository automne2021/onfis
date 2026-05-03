package com.onfis.user.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record UserProfileResponseDTO(
  // Thông tin từ bảng Users
  UUID id,
  UUID tenantId,
  String firstName,
  String lastName,
  String avatarUrl,
  String email,
  String role,
  UUID positionId,
  String positionName,
  UUID departmentId,
  String departmentName,
  
  UUID managerId,
  String workLocation,
  String bio,
  List<String> skills,
  String workPhone,
  String personalEmail,
  String phoneNumber, 
  String address,
  LocalDate dob,
  String nationId,
  String nationality,
  String gender,
  
  Map<String, Object> bankingInfo,
  Map<String, Object> taxInfo,
  Map<String, Object> emergencyContact,
  Map<String, Object> contractInfo,
  Map<String, Object> educationInfo,
  Map<String, Object> compensationInfo
) {}