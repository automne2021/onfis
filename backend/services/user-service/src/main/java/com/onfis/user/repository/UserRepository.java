package com.onfis.user.repository;

import com.onfis.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
  List<User> findByTenantId(UUID tenantId);
  @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND (" +
           "LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchUsersByKeyword(@Param("tenantId") UUID tenantId, @Param("keyword") String keyword);
}