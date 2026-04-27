package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {
    Optional<Tutor> findByUser_Id(Long userId);
    Optional<Tutor> findByTutorId(String tutorId);
}
