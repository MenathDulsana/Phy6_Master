package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.StudentProfileUpdateRequest;
import com.example.Phy6_Master.dto.StudentResponse;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.LearningMaterial;
import com.example.Phy6_Master.model.Student;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.LearningMaterialRepository;
import com.example.Phy6_Master.repository.StudentRepository;
import com.example.Phy6_Master.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private LearningMaterialRepository learningMaterialRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Course> getEnrolledCourses(Long userId) {
        return userRepository.findById(userId)
                .map(user -> enrollmentRepository.findByStudent(user).stream()
                .filter(e -> "APPROVED".equalsIgnoreCase(e.getStatus()) || "ACTIVE".equalsIgnoreCase(e.getStatus()))
                        .map(Enrollment::getCourse)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    public List<LearningMaterial> getCourseMaterials(Long courseId) {
        // ideally check if student is enrolled in this course
        return learningMaterialRepository.findByCourseId(courseId);
    }

    @Transactional
    public StudentResponse updateStudentProfileByUserId(Long userId, StudentProfileUpdateRequest request) {
        Student student = studentRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found for userId: " + userId));

        User user = student.getUser();

        if (hasText(request.getEmail())) {
            userRepository.findByEmail(request.getEmail().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Email already exists");
                }
            });
            user.setEmail(request.getEmail().trim());
        }

        if (hasText(request.getName())) {
            user.setName(request.getName().trim());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }

        if (hasText(request.getEnrollmentNumber())) {
            String enr = request.getEnrollmentNumber().trim();
            studentRepository.findByEnrollmentNumber(enr).ifPresent(existing -> {
                if (!existing.getId().equals(student.getId())) {
                    throw new IllegalArgumentException("Enrollment number already exists");
                }
            });
            student.setEnrollmentNumber(enr);
        }

        if (request.getSchool() != null) {
            student.setSchool(request.getSchool().trim());
        }
        if (request.getBatch() != null) {
            student.setBatch(request.getBatch().trim());
        }
        if (request.getStream() != null) {
            student.setStream(request.getStream().trim());
        }
        if (request.getAddress() != null) {
            student.setAddress(request.getAddress().trim());
        }
        if (request.getParentName() != null) {
            student.setParentName(request.getParentName().trim());
        }
        if (request.getParentPhoneNumber() != null) {
            student.setParentPhoneNumber(request.getParentPhoneNumber().trim());
        }
        if (hasText(request.getNewPassword())) {
            String newPassword = request.getNewPassword().trim();
            if (newPassword.length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
        Student saved = studentRepository.save(student);

        return new StudentResponse(
                user.getId(),
                saved.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                saved.getEnrollmentNumber(),
                saved.getSchool(),
                saved.getBatch(),
                saved.getStream(),
                saved.getAddress(),
                saved.getParentName(),
                saved.getParentPhoneNumber(),
                user.getRole(),
                "Student profile updated successfully"
        );
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
