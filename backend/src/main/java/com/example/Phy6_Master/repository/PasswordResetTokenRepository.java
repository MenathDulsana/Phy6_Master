package com.example.Phy6_Master.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.Phy6_Master.model.PasswordResetToken;
import com.example.Phy6_Master.model.User;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenAndUsedFalseAndExpiresAtAfter(String token, LocalDateTime now);
    List<PasswordResetToken> findByUserAndUsedFalse(User user);
}
