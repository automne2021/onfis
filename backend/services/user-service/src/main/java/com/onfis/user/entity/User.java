package com.onfis.user.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Data
@Entity
@Table(name = "users")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;

  @Column(name = "first_name")
  private String firstName;

  @Column(name = "last_name")
  private String lastName;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Column(name = "email")
  private String email;

  @Column(name = "role", nullable = false)
  private String role;

  @Column(name = "position_id")
  private UUID positionId;

  @Column(name = "is_first_login")
  private Boolean isFirstLogin;
}