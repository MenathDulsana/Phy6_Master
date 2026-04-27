package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUser_Id(Long userId);
    Optional<Teacher> findByEmployeeId(String employeeId);
}
