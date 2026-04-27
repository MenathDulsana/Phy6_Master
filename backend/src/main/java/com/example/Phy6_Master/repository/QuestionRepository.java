package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
