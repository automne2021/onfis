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
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final UserProfileEntityRepository profileRepository;
  private final PositionServiceClient positionServiceClient;

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
      user.getPositionId()
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
  
}