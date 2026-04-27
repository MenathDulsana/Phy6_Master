package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    List<Announcement> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    @Query("SELECT a FROM Announcement a WHERE a.course.id IN " +
           "(SELECT e.course.id FROM Enrollment e WHERE e.student.id = :userId) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findByEnrolledCourses(@Param("userId") Long userId);
}
