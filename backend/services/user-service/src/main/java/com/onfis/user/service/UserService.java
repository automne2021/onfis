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

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;
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

  private UserResponseDTO toDto(User user) {
    return new UserResponseDTO(
      user.getId(),
      user.getTenantId(),
      user.getFirstName(),
      user.getLastName(),
      user.getAvatarUrl(),
      user.getEmail(),
      user.getRole(),
      user.getPositionId(),
      getUserStatus(user.getId()),
      user.getIsFirstLogin()
    );
  }

  public UserResponseDTO getBasicUserProfile(UUID userId) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("Cannot find use with ID: " + userId));

    return toDto(user);
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
    
    return users.stream().map(this::toDto).collect(Collectors.toList());
  }

  public List<UserResponseDTO> searchUsers(String tenantIdStr, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        List<User> users = userRepository.searchUsersByKeyword(tenantId, keyword.trim());
        
        return users.stream().map(this::toDto).collect(Collectors.toList());
    }

  // ─── Onboarding ──────────────────────────────────────────────────────────────

  /**
   * Update own profile during onboarding. Updates both users and user_profiles tables.
   */
  @SuppressWarnings("unchecked")
  public void updateOwnProfile(UUID userId, Map<String, Object> profileData) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found: " + userId));

    // Update users table fields
    if (profileData.containsKey("firstName")) {
      user.setFirstName((String) profileData.get("firstName"));
    }
    if (profileData.containsKey("lastName")) {
      user.setLastName((String) profileData.get("lastName"));
    }
    userRepository.save(user);

    // Update user_profiles table fields
    UserProfileEntity profile = profileRepository.findById(userId)
        .orElseGet(() -> {
          UserProfileEntity p = new UserProfileEntity();
          p.setUserId(userId);
          p.setTenantId(user.getTenantId());
          return p;
        });

    if (profileData.containsKey("phoneNumber"))
      profile.setPhoneNumber((String) profileData.get("phoneNumber"));
    if (profileData.containsKey("workPhone"))
      profile.setWorkPhone((String) profileData.get("workPhone"));
    if (profileData.containsKey("personalEmail"))
      profile.setPersonalEmail((String) profileData.get("personalEmail"));
    if (profileData.containsKey("address"))
      profile.setAddress((String) profileData.get("address"));
    if (profileData.containsKey("nationality"))
      profile.setNationality((String) profileData.get("nationality"));
    if (profileData.containsKey("gender"))
      profile.setGender((String) profileData.get("gender"));
    if (profileData.containsKey("nationId"))
      profile.setNationId((String) profileData.get("nationId"));
    if (profileData.containsKey("workLocation"))
      profile.setWorkLocation((String) profileData.get("workLocation"));
    if (profileData.containsKey("bio"))
      profile.setBio((String) profileData.get("bio"));
    if (profileData.containsKey("dob") && profileData.get("dob") != null) {
      profile.setDob(java.time.LocalDate.parse((String) profileData.get("dob")));
    }
    if (profileData.containsKey("skills")) {
      profile.setSkills((List<String>) profileData.get("skills"));
    }
    if (profileData.containsKey("bankingInfo")) {
      profile.setBankingInfo((Map<String, Object>) profileData.get("bankingInfo"));
    }
    if (profileData.containsKey("taxInfo")) {
      profile.setTaxInfo((Map<String, Object>) profileData.get("taxInfo"));
    }
    if (profileData.containsKey("emergencyContact")) {
      profile.setEmergencyContact((Map<String, Object>) profileData.get("emergencyContact"));
    }
    if (profileData.containsKey("contractInfo")) {
      profile.setContractInfo((Map<String, Object>) profileData.get("contractInfo"));
    }
    if (profileData.containsKey("educationInfo")) {
      profile.setEducationInfo((Map<String, Object>) profileData.get("educationInfo"));
    }
    if (profileData.containsKey("compensationInfo")) {
      profile.setCompensationInfo((Map<String, Object>) profileData.get("compensationInfo"));
    }

    profile.setUpdatedAt(LocalDateTime.now());
    profileRepository.save(profile);
  }

  /**
   * Mark onboarding as complete — sets is_first_login = false.
   */
  public void completeOnboarding(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    user.setIsFirstLogin(false);
    userRepository.save(user);
  }
}