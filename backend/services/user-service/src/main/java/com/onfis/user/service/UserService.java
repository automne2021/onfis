package com.onfis.user.service;

import com.onfis.user.client.PositionServiceClient;
import com.onfis.user.dto.UserProfileResponseDTO;
import com.onfis.user.dto.UserResponseDTO;
import com.onfis.user.dto.PositionResponseDTO;
import com.onfis.user.entity.User;
import com.onfis.user.entity.UserProfileEntity;
import com.onfis.user.repository.UserProfileEntityRepository;
import com.onfis.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final UserProfileEntityRepository profileRepository;
  private final PositionServiceClient positionServiceClient;
  private final StringRedisTemplate redisTemplate;

  private String getUserStatus(UUID userId) {
      
      try {
          // Bước 1: Check Redis xem có kết nối WebSocket không
          // Pattern key phải giống hệt với lúc chat-service lưu vào (ví dụ: "user:status:1234-5678...")
          String redisKey = "user:status:" + userId.toString();
          Boolean isOnline = redisTemplate.hasKey(redisKey);
          
          if (Boolean.FALSE.equals(isOnline)) {
              return "offline"; // Không có trong Redis -> Chắc chắn đang tắt web
          }

          // Bước 2: Truy vấn bảng Meeting xem có đang kẹt lịch họp không
          // (Mở comment 2 dòng dưới khi bạn đã có MeetingRepository)
          // boolean isInMeeting = meetingRepository.isUserInMeetingNow(userId);
          // if (isInMeeting) return "busy"; // Có kết nối, nhưng đang họp -> Hiện màu đỏ

      } catch (Exception e) {
          log.warn("Lỗi khi kiểm tra trạng thái cho user {}: {}", userId, e.getMessage());
      }

      // Vượt qua 2 vòng trên -> Đang rảnh và có mở web -> Hiện màu xanh
      return "online"; 
  }

  public UserResponseDTO getBasicUserProfile(UUID userId) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("Cannot find use with ID: " + userId));

    // if (!user.getTenantId().toString().equals(tenantId)) {
    //     throw new RuntimeException("Access Denied: This user does not belong to your company.");
    // }

    return new UserResponseDTO(
      user.getId(),
      user.getTenantId(),
      user.getFirstName(),
      user.getLastName(),
      user.getAvatarUrl(),
      user.getEmail(),
      user.getRole(),
      user.getPositionId(),
      getUserStatus(user.getId())
    );
  }

  public UserProfileResponseDTO getFullUserProfile(String token, UUID userId, String tenantId) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("Cannot find user with ID: " + userId));

    if (!user.getTenantId().toString().equals(tenantId)) {
        throw new RuntimeException("Access Denied: This user does not belong to your company.");
    }

    UserProfileEntity profile = profileRepository.findById(userId).orElse(null);

    String positionName = null;
    String departmentName = null;

    // 3. Gọi sang position-service nếu user có positionId
    if (user.getPositionId() != null) {
        try {
            // Truyền token vào Feign Client
            PositionResponseDTO positionData = positionServiceClient.getPositionById(token, user.getPositionId(), tenantId);
            if (positionData != null) {
                log.info("Position Data: ", positionData);
                // Record PositionResponseDTO dùng positionData.name() và positionData.departmentName()
                positionName = positionData.title();
                departmentName = positionData.departmentName();
            }
        } catch (Exception e) {
            log.error("❌ Lỗi khi lấy thông tin chức vụ cho positionId {}: {}", user.getPositionId(), e.getMessage());
        }
    }

    return new UserProfileResponseDTO(
      user.getId(),
      user.getTenantId(),
      user.getFirstName(),
      user.getLastName(),
      user.getAvatarUrl(),
      user.getEmail(),
      user.getRole(),
      user.getPositionId(),
      
      positionName,    
      departmentName,  
      
      profile != null ? profile.getManagerId() : null,
      profile != null ? profile.getWorkLocation() : null,
      profile != null ? profile.getBio() : null,
      profile != null ? profile.getSkills() : null,
      profile != null ? profile.getWorkPhone() : null,
      profile != null ? profile.getPersonalEmail() : null,
      profile != null ? profile.getPhoneNumber() : null,
      profile != null ? profile.getAddress() : null,
      profile != null ? profile.getDob() : null,
      profile != null ? profile.getNationId() : null,
      profile != null ? profile.getNationality() : null,
      profile != null ? profile.getGender() : null,
      
      profile != null ? profile.getBankingInfo() : null,
      profile != null ? profile.getTaxInfo() : null,
      profile != null ? profile.getEmergencyContact() : null,
      profile != null ? profile.getContractInfo() : null,
      profile != null ? profile.getEducationInfo() : null,
      profile != null ? profile.getCompensationInfo() : null
    );
  }

  public List<UserResponseDTO> getUsersByTenant(String tenantIdStr) {
    if (tenantIdStr == null || tenantIdStr.isEmpty()) {
        throw new IllegalArgumentException("Tenant ID không được để trống");
    }
    
    UUID tenantId = UUID.fromString(tenantIdStr);
    List<User> users = userRepository.findByTenantId(tenantId);
    
    return users.stream().map(user -> new UserResponseDTO(
            user.getId(),
            user.getTenantId(),
            user.getFirstName(),
            user.getLastName(),
            user.getAvatarUrl(),
            user.getEmail(),
            user.getRole(),
            user.getPositionId(),
            getUserStatus(user.getId())
    )).collect(Collectors.toList());
  }

  public List<UserResponseDTO> searchUsers(String tenantIdStr, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        List<User> users = userRepository.searchUsersByKeyword(tenantId, keyword.trim());
        
        return users.stream().map(user -> new UserResponseDTO(
                user.getId(),
                user.getTenantId(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getEmail(),
                user.getRole(),
                user.getPositionId(),
                getUserStatus(user.getId())
        )).collect(Collectors.toList());
    }
  
}