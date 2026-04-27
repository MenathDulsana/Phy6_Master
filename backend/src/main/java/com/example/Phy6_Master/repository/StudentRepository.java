package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser_Id(Long userId);
    Optional<Student> findByStudentId(String studentId);
    Optional<Student> findByEnrollmentNumber(String enrollmentNumber);
}
