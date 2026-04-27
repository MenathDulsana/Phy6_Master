package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.ClassAccessResponseDTO;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClassAccessService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public ClassAccessResponseDTO checkAccess(User user, Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) return new ClassAccessResponseDTO(false, "NONE", "Course not found.");

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByStudentAndCourse(user, course);

        if (enrollmentOpt.isEmpty()) {
            return new ClassAccessResponseDTO(false, "NONE", "You are not enrolled in this class.");
        }

        Enrollment enrollment = enrollmentOpt.get();
        if ("PENDING".equalsIgnoreCase(enrollment.getStatus())) {
            return new ClassAccessResponseDTO(false, "PENDING", "Your enrollment is pending course fee payment.");
        }

        if ("PAYMENT_SUBMITTED".equalsIgnoreCase(enrollment.getStatus())) {
            return new ClassAccessResponseDTO(false, "PAYMENT_SUBMITTED", "Your payment is undergoing verification by our accountants.");
        }

        if ("APPROVED".equalsIgnoreCase(enrollment.getStatus()) || "ACTIVE".equalsIgnoreCase(enrollment.getStatus())) {
            return new ClassAccessResponseDTO(true, enrollment.getStatus(), "Access granted.");
        }

        return new ClassAccessResponseDTO(false, enrollment.getStatus(), "Access denied.");
    }
}
