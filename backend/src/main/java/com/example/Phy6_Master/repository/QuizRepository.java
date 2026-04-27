package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Quiz;
import com.example.Phy6_Master.model.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    Page<Quiz> findByCourseInAndStatus(Collection<Course> courses, QuizStatus status, Pageable pageable);
    List<Quiz> findByCourse_Teacher_IdOrderByUpdatedAtDesc(Long teacherId);
}
