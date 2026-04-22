package com.onfis.user.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_profiles")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class UserProfileEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    // --- CÁC TRƯỜNG THÊM MỚI THEO UI ---
    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "work_location")
    private String workLocation;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skills", columnDefinition = "jsonb")
    private List<String> skills; // Danh sách tags kỹ năng

    @Column(name = "work_phone")
    private String workPhone;

    @Column(name = "personal_email")
    private String personalEmail;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "gender")
    private String gender;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "education_info", columnDefinition = "jsonb")
    private Map<String, Object> educationInfo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "compensation_info", columnDefinition = "jsonb")
    private Map<String, Object> compensationInfo;

    @Column(name = "phone_number") // Personal Phone
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "nation_id")
    private String nationId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "banking_info", columnDefinition = "jsonb")
    private Map<String, Object> bankingInfo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tax_info", columnDefinition = "jsonb")
    private Map<String, Object> taxInfo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "emergency_contact", columnDefinition = "jsonb")
    private Map<String, Object> emergencyContact;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "contract_info", columnDefinition = "jsonb")
    private Map<String, Object> contractInfo;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}