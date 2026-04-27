package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.QuizResult;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    Optional<QuizResult> findBySession_Id(Long sessionId);

    @EntityGraph(attributePaths = {"quiz", "session"})
    List<QuizResult> findByStudent_IdOrderByEvaluatedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"quiz", "session"})
    List<QuizResult> findByStudent_IdAndQuiz_IdOrderByEvaluatedAtDesc(Long studentId, Long quizId);

    void deleteByQuiz_Id(Long quizId);
}