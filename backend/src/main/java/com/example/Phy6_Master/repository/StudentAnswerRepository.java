package com.example.Phy6_Master.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.example.Phy6_Master.model.StudentAnswer;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    Optional<StudentAnswer> findBySession_IdAndQuestion_Id(Long sessionId, Long questionId);

    List<StudentAnswer> findBySession_Id(Long sessionId);

    boolean existsBySession_Id(Long sessionId);

    @EntityGraph(attributePaths = {"question", "selectedOption", "session"})
    List<StudentAnswer> findBySession_IdIn(List<Long> sessionIds);

    void deleteBySession_Quiz_Id(Long quizId);

    boolean existsBySession_Quiz_Id(Long quizId);
}
