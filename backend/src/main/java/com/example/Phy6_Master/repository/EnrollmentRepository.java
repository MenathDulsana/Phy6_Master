package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudent(User student);
    List<Enrollment> findByCourse(Course course);
    Optional<Enrollment> findByStudentAndCourse(User user, Course course);
    boolean existsByStudentAndCourse(User user, Course course);
    boolean existsByStudentAndCourseAndStatus(User user, Course course, String status);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM Enrollment e WHERE e.enrollmentDate >= :start AND e.enrollmentDate <= :end " +
            "AND (:courseId = -1L OR e.course.id = :courseId)")
    long countByEnrollmentDateWithFilters(
            @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, 
            @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end,
            @org.springframework.data.repository.query.Param("courseId") Long courseId
    );
}
