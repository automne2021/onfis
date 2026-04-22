package com.onfis.user.repository;

import com.onfis.user.entity.UserProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserProfileEntityRepository extends JpaRepository<UserProfileEntity, UUID> {
}