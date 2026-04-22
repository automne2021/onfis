package com.onfis.chat.repository;

import com.onfis.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
  Optional<Conversation> findFirstByTenantIdAndName(UUID tenantId, String name);
  boolean existsByTenantIdAndNameAndType(UUID tenantId, String name, String type);
  List<Conversation> findByTenantIdAndNameContainingIgnoreCaseAndTypeIn(UUID tenantId, String name, List<String> types);
  List<Conversation> findByTenantIdAndType(UUID tenantId, String type);
}