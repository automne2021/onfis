package com.onfis.chat.repository;

import com.onfis.chat.entity.Meetings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MeetingRepository extends JpaRepository<Meetings, UUID> {
    // Hiện tại JpaRepository đã cung cấp sẵn save(), findById() 
    // nên không cần khai báo thêm hàm nào cho MeetingController.
}