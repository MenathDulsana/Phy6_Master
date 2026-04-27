package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.LearningMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {
    @Query("SELECT m FROM LearningMaterial m JOIN FETCH m.lesson WHERE m.lesson.course.id = :courseId")
    List<LearningMaterial> findByCourseId(Long courseId);

    List<LearningMaterial> findByLesson(com.example.Phy6_Master.model.Lesson lesson);

}
