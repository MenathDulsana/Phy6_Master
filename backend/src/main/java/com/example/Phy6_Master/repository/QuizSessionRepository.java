package com.example.Phy6_Master.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.Phy6_Master.model.QuizSession;
import com.example.Phy6_Master.model.QuizSessionStatus;

public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {
    Optional<QuizSession> findByIdAndStudent_Id(Long id, Long studentId);

    Optional<QuizSession> findByStudent_IdAndQuiz_IdAndStatus(Long studentId, Long quizId, QuizSessionStatus status);

    void deleteByQuiz_Id(Long quizId);
}
