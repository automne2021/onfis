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

    public UserProfileResponseDTO getFullUserProfile(String token, UUID targetUserId, String tenantId, UUID requesterId) {
        // 1. Tìm Target User (Người được xem hồ sơ)
        User targetUser = userRepository.findById(targetUserId)
        .orElseThrow(() -> new RuntimeException("Cannot find user with ID: " + targetUserId));

        // Kiểm tra tính đa thuê (Multi-tenancy)
        if (!targetUser.getTenantId().toString().equals(tenantId)) {
            throw new RuntimeException("Access Denied: This user does not belong to your company.");
        }

        UserProfileEntity profile = profileRepository.findById(targetUserId).orElse(null);

        // 2. Lấy thông tin người yêu cầu (Requester) để kiểm tra Role
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));
        String requesterRole = requester.getRole();

        // =========================================================================
        // LOGIC PHÂN QUYỀN TRUY CẬP DỮ LIỆU
        // =========================================================================
        
        // Cấp 1: Thông tin nhạy cảm mức trung bình (Manager/HR/Chính chủ)
        // Bao gồm: Số điện thoại cá nhân, Email cá nhân, Địa chỉ, Ngày sinh
        boolean isManager = "MANAGER".equals(requesterRole) && profile != null && requesterId.equals(profile.getManagerId());
        boolean isHighAdmin = "SUPER_ADMIN".equals(requesterRole) || "ADMIN".equals(requesterRole);
        boolean isOwner = requesterId.equals(targetUserId);

        boolean canViewPersonalContact = isOwner || isHighAdmin || isManager;

        // Cấp 2: Thông tin nhạy cảm mức cao (Chỉ HR/Kế toán/Chính chủ - Manager KHÔNG xem được)
        // Bao gồm: Lương (Compensation), Thuế (Tax), Ngân hàng (Banking), Số định danh (NationId)
        // Thêm Role C_AND_B hoặc ACCOUNTANT nếu hệ thống của bạn có các role này
        boolean isFinanceOrHR = isHighAdmin || "ACCOUNTANT".equals(requesterRole) || "C_AND_B".equals(requesterRole);
        boolean canViewStrictPrivateInfo = isOwner || isFinanceOrHR;

        // =========================================================================

        // 3. Gọi sang position-service lấy thông tin chức vụ (Giữ nguyên logic Feign)
        String positionName = null;
        String departmentName = null;
        if (targetUser.getPositionId() != null) {
            try {
                PositionResponseDTO positionData = positionServiceClient.getPositionById(token, targetUser.getPositionId(), tenantId);
                if (positionData != null) {
                    positionName = positionData.title();
                    departmentName = positionData.departmentName();
                }
            } catch (Exception e) {
                log.error("❌ Lỗi khi lấy thông tin chức vụ: {}", e.getMessage());
            }
        }

        // 4. Lọc dữ liệu theo quyền truy cập
        return new UserProfileResponseDTO(
        targetUser.getId(),
        targetUser.getTenantId(),
        targetUser.getFirstName(),
        targetUser.getLastName(),
        targetUser.getAvatarUrl(),
        targetUser.getEmail(), // Email công ty (Public)
        targetUser.getRole(),
        targetUser.getPositionId(),
        positionName,    
        departmentName,  
        
        profile != null ? profile.getManagerId() : null,
        profile != null ? profile.getWorkLocation() : null,
        profile != null ? profile.getBio() : null,
        profile != null ? profile.getSkills() : null,
        profile != null ? profile.getWorkPhone() : null, // Work phone (Public)

        // Thông tin liên lạc cá nhân (Cấp 1)
        (canViewPersonalContact && profile != null) ? profile.getPersonalEmail() : null,
        (canViewPersonalContact && profile != null) ? profile.getPhoneNumber() : null,
        (canViewPersonalContact && profile != null) ? profile.getAddress() : null,
        (canViewPersonalContact && profile != null) ? profile.getDob() : null,

        // Thông tin định danh và tài chính (Cấp 2)
        (canViewStrictPrivateInfo && profile != null) ? profile.getNationId() : null,
        profile != null ? profile.getNationality() : null, // Quốc tịch có thể để public/manager thấy
        profile != null ? profile.getGender() : null,
        
        (canViewStrictPrivateInfo && profile != null) ? profile.getBankingInfo() : null,
        (canViewStrictPrivateInfo && profile != null) ? profile.getTaxInfo() : null,
        profile != null ? profile.getEmergencyContact() : null, // Liên hệ khẩn cấp nên để Manager thấy
        (canViewStrictPrivateInfo && profile != null) ? profile.getContractInfo() : null,
        profile != null ? profile.getEducationInfo() : null,
        (canViewStrictPrivateInfo && profile != null) ? profile.getCompensationInfo() : null // LƯƠNG
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