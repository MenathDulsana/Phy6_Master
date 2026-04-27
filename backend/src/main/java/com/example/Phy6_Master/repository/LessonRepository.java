package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourse_Id(Long courseId);
    List<Lesson> findByCourse_IdOrderByMonthAsc(Long courseId);
}
