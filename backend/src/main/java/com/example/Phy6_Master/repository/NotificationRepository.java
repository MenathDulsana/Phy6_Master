package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStudent_IdOrderByCreatedAtDesc(Long studentId);

    boolean existsByPayment_IdAndType(Long paymentId, String type);
}
