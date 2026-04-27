package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.PendingEnrollmentResponseDTO;
import com.example.Phy6_Master.dto.ClassAccessResponseDTO;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentEnrollmentService {

    private final EnrollmentRepository enrollmentRepository;

    public List<PendingEnrollmentResponseDTO> getPendingEnrollments(User user) {
        return enrollmentRepository.findByStudent(user).stream()
                .filter(e -> "PENDING".equalsIgnoreCase(e.getStatus()))
                .map(e -> new PendingEnrollmentResponseDTO(
                        e.getCourse().getId(),
                        e.getCourse().getTitle(),
                        e.getStatus(),
                        "Your enrollment is pending payment verification."
                ))
                .collect(Collectors.toList());
    }

    public List<com.example.Phy6_Master.dto.EnrollmentStatusItemDTO> getAllEnrollmentStatuses(User user) {
        return enrollmentRepository.findByStudent(user).stream()
                .map(e -> new com.example.Phy6_Master.dto.EnrollmentStatusItemDTO(
                        e.getId(),
                        e.getCourse().getId(),
                        e.getCourse().getTitle(),
                        e.getStatus(),
                        e.getEnrollmentDate(),
                        "PENDING".equalsIgnoreCase(e.getStatus()) ? "Your enrollment is pending verification." : 
                        "PAYMENT_SUBMITTED".equalsIgnoreCase(e.getStatus()) ? "Your payment is under verification by an accountant." : null
                ))
                .collect(Collectors.toList());
    }

    public ClassAccessResponseDTO checkAccess(User user, Long courseId) {
        return enrollmentRepository.findByStudent(user).stream()
                .filter(e -> e.getCourse().getId().equals(courseId))
                .findFirst()
                .map(e -> {
                    boolean canAccess = "ACTIVE".equalsIgnoreCase(e.getStatus()) || "APPROVED".equalsIgnoreCase(e.getStatus());
                    return new ClassAccessResponseDTO(canAccess, e.getStatus(), "");
                })
                .orElse(new ClassAccessResponseDTO(false, "NOT_ENROLLED", "You are not enrolled in this class."));
    }
}
