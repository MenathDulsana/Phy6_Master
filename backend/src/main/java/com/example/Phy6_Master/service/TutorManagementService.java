package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.CreateTutorRequestDTO;
import com.example.Phy6_Master.dto.RecentTutorRequestDTO;
import com.example.Phy6_Master.dto.TutorDashboardStatsDTO;
import com.example.Phy6_Master.dto.TutorPerformanceDTO;
import com.example.Phy6_Master.dto.TutorRequestDTO;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.model.Student;
import com.example.Phy6_Master.model.Tutor;
import com.example.Phy6_Master.model.TutorRequest;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.PaymentRepository;
import com.example.Phy6_Master.repository.StudentRepository;
import com.example.Phy6_Master.repository.TutorRepository;
import com.example.Phy6_Master.repository.TutorRequestRepository;
import com.example.Phy6_Master.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TutorManagementService {

    private final TutorRequestRepository tutorRequestRepository;
    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public TutorDashboardStatsDTO getDashboardStats() {
        long incoming = tutorRequestRepository.countByStatus(TutorRequest.RequestStatus.PENDING);
        long active = tutorRequestRepository.countByStatusIn(
                Arrays.asList(
                        TutorRequest.RequestStatus.PENDING,
                        TutorRequest.RequestStatus.ACCEPTED,
                        TutorRequest.RequestStatus.IN_PROGRESS));
        long delivered = tutorRequestRepository.countByStatus(TutorRequest.RequestStatus.COMPLETED);

        return new TutorDashboardStatsDTO(
                Math.toIntExact(incoming),
                Math.toIntExact(active),
                Math.toIntExact(delivered),
                Math.toIntExact(delivered)
        );
    }

    @Transactional(readOnly = true)
    public List<RecentTutorRequestDTO> getRecentRequests(int limit) {
        int safeLimit = Math.max(1, limit);
        Pageable pageable = PageRequest.of(0, safeLimit);
        return tutorRequestRepository.findRecentRequests(pageable).stream()
                .map(this::convertToRecentRequestDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<TutorRequestDTO> getIncomingRequests(Pageable pageable) {
        return tutorRequestRepository
                .findByStatusAndAssignedTutorIsNull(TutorRequest.RequestStatus.PENDING, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<TutorRequestDTO> getActiveRequests(Long tutorId, Pageable pageable) {
        Tutor tutor = getTutor(tutorId);
        return tutorRequestRepository
                .findByAssignedTutorAndStatusIn(
                        tutor,
                        Arrays.asList(TutorRequest.RequestStatus.ACCEPTED, TutorRequest.RequestStatus.IN_PROGRESS),
                        pageable
                )
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<TutorRequestDTO> getActiveRequests(Pageable pageable) {
        return tutorRequestRepository
                .findByStatusIn(
                        Arrays.asList(TutorRequest.RequestStatus.ACCEPTED, TutorRequest.RequestStatus.IN_PROGRESS),
                        pageable
                )
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<TutorRequestDTO> getStudentRequests(Long studentUserId, Pageable pageable) {
        Student student = getStudentByUserId(studentUserId);
        return tutorRequestRepository.findByStudent(student, pageable).map(this::convertToDTO);
    }

    @Transactional
    public TutorRequestDTO createTutorRequest(Long studentUserId, CreateTutorRequestDTO dto) {
        Student student = resolveStudentForUser(studentUserId);

        String requestedTuteTitle = extractRequestedTuteTitle(dto.getDescription());
        boolean duplicateRequest = tutorRequestRepository.findByStudent(student).stream()
                .anyMatch(existing ->
                        existing.getCourseName() != null
                                && existing.getCourseName().equalsIgnoreCase(dto.getCourseName())
                                && extractRequestedTuteTitle(existing.getDescription()).equalsIgnoreCase(requestedTuteTitle));

        if (duplicateRequest) {
            throw new IllegalStateException("You have already requested this tute");
        }

        TutorRequest request = new TutorRequest();
        request.setStudent(student);
        request.setCourseName(dto.getCourseName());
        request.setDescription(dto.getDescription());
        request.setScheduledDate(dto.getScheduledDate());
        request.setRequestedDate(LocalDateTime.now());
        request.setStatus(TutorRequest.RequestStatus.PENDING);

        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional
    public TutorRequestDTO acceptRequest(Long requestId, Long tutorId) {
        TutorRequest request = getRequest(requestId);
        Tutor tutor = getTutor(tutorId);

        if (request.getStatus() != TutorRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be accepted");
        }

        request.setAssignedTutor(tutor);
        request.setStatus(TutorRequest.RequestStatus.ACCEPTED);
        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional
    public TutorRequestDTO rejectRequest(Long requestId, String reason) {
        TutorRequest request = getRequest(requestId);

        if (request.getStatus() != TutorRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be rejected");
        }

        request.setStatus(TutorRequest.RequestStatus.REJECTED);
        request.setNotes(reason);
        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional
    public TutorRequestDTO markAsInProgress(Long requestId) {
        TutorRequest request = getRequest(requestId);

        if (request.getStatus() != TutorRequest.RequestStatus.ACCEPTED) {
            throw new IllegalStateException("Only accepted requests can be started");
        }

        request.setStatus(TutorRequest.RequestStatus.IN_PROGRESS);
        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional
    public TutorRequestDTO completeRequest(Long requestId, Double duration, String tutorNotes) {
        TutorRequest request = getRequest(requestId);

        if (request.getStatus() != TutorRequest.RequestStatus.IN_PROGRESS) {
            throw new IllegalStateException("Only in-progress requests can be completed");
        }

        if (duration == null || duration <= 0) {
            throw new IllegalArgumentException("Session duration must be greater than 0");
        }

        request.setStatus(TutorRequest.RequestStatus.COMPLETED);
        request.setCompletedDate(LocalDateTime.now());
        request.setSessionDuration(duration);
        request.setTutorNotes(tutorNotes);

        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional
    public TutorRequestDTO markAsDelivered(Long requestId) {
        TutorRequest request = getRequest(requestId);

        if (request.getStatus() == TutorRequest.RequestStatus.PENDING
                || request.getStatus() == TutorRequest.RequestStatus.REJECTED
                || request.getStatus() == TutorRequest.RequestStatus.CANCELLED) {
            throw new IllegalStateException("Only accepted or in-progress requests can be delivered");
        }

        if (request.getStatus() != TutorRequest.RequestStatus.COMPLETED) {
            request.setStatus(TutorRequest.RequestStatus.COMPLETED);
            if (request.getCompletedDate() == null) {
                request.setCompletedDate(LocalDateTime.now());
            }
        }

        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public Page<TutorRequestDTO> getDeliveryRecords(Pageable pageable) {
        return tutorRequestRepository.findByStatus(TutorRequest.RequestStatus.COMPLETED, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<TutorRequestDTO> getDeclinedRequests(Pageable pageable) {
        return tutorRequestRepository.findByStatus(TutorRequest.RequestStatus.REJECTED, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public TutorRequestDTO getRequestById(Long requestId) {
        return convertToDTO(getRequest(requestId));
    }

    @Transactional
    public TutorRequestDTO cancelRequest(Long requestId, String reason) {
        TutorRequest request = getRequest(requestId);

        if (request.getStatus() == TutorRequest.RequestStatus.COMPLETED
                || request.getStatus() == TutorRequest.RequestStatus.CANCELLED) {
            throw new IllegalStateException("Completed or cancelled requests cannot be cancelled");
        }

        request.setStatus(TutorRequest.RequestStatus.CANCELLED);
        request.setNotes(reason);
        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public TutorRequestDTO getStudentRequestById(Long studentUserId, Long requestId) {
        Student student = getStudentByUserId(studentUserId);
        TutorRequest request = getRequest(requestId);
        validateStudentOwnership(student, requestId, request);
        return convertToDTO(request);
    }

    @Transactional
    public TutorRequestDTO cancelStudentRequest(Long studentUserId, Long requestId, String reason) {
        Student student = getStudentByUserId(studentUserId);
        TutorRequest request = getRequest(requestId);
        validateStudentOwnership(student, requestId, request);

        if (request.getStatus() == TutorRequest.RequestStatus.COMPLETED
                || request.getStatus() == TutorRequest.RequestStatus.CANCELLED
                || request.getStatus() == TutorRequest.RequestStatus.REJECTED
                || request.getStatus() == TutorRequest.RequestStatus.IN_PROGRESS) {
            throw new IllegalStateException("This request can no longer be cancelled");
        }

        request.setStatus(TutorRequest.RequestStatus.CANCELLED);
        request.setNotes((reason == null || reason.isBlank()) ? "Cancelled by student" : reason);
        return convertToDTO(tutorRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public TutorPerformanceDTO getTutorPerformance(Long tutorId) {
        Tutor tutor = getTutor(tutorId);

        int completedSessions = Math.toIntExact(
                tutorRequestRepository.countByAssignedTutorAndStatus(tutor, TutorRequest.RequestStatus.COMPLETED));
        int acceptedRequests = Math.toIntExact(
                tutorRequestRepository.countByAssignedTutorAndStatus(tutor, TutorRequest.RequestStatus.ACCEPTED));
        double averageRating = tutor.getAverageRating() == null ? 0.0 : tutor.getAverageRating();

        return new TutorPerformanceDTO(
                tutor.getId(),
                tutor.getUser() != null ? tutor.getUser().getName() : null,
                completedSessions,
                acceptedRequests,
                averageRating
        );
    }

    private TutorRequest getRequest(Long requestId) {
        return tutorRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Tutor request not found: " + requestId));
    }

    private Tutor getTutor(Long tutorId) {
        return tutorRepository.findById(tutorId)
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found: " + tutorId));
    }

    private Student getStudentByUserId(Long studentUserId) {
        return resolveStudentForUser(studentUserId);
    }

    /**
     * Ensures a {@link Student} row exists for this user. Legacy accounts may have been created via
     * {@code /api/auth/signup} before student profiles were persisted; those users get a row on first tute request.
     */
    private Student resolveStudentForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (user.getRole() != User.Role.STUDENT) {
            throw new IllegalArgumentException("Tute requests are only available for student accounts");
        }
        return studentRepository.findByUser_Id(userId).orElseGet(() -> {
            Student student = new Student();
            student.setUser(user);
            student.setStudentId("STU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            return studentRepository.save(student);
        });
    }

    private void validateStudentOwnership(Student student, Long requestId, TutorRequest request) {
        if (request.getStudent() == null || !request.getStudent().getId().equals(student.getId())) {
            throw new IllegalArgumentException("Tutor request not found for student: " + requestId);
        }
    }

    private String extractRequestedTuteTitle(String description) {
        if (description == null || description.isBlank()) {
            return "";
        }

        String firstLine = description.lines().findFirst().orElse("").trim();
        String prefix = "Requested Tute:";
        if (!firstLine.regionMatches(true, 0, prefix, 0, prefix.length())) {
            return firstLine;
        }

        return firstLine.substring(prefix.length()).trim();
    }

    private TutorRequestDTO convertToDTO(TutorRequest request) {
        TutorRequestDTO dto = new TutorRequestDTO();
        dto.setId(request.getId());

        if (request.getStudent() != null) {
            dto.setStudentId(request.getStudent().getId());
            dto.setStudentCode(request.getStudent().getStudentId());
            dto.setStudentName(request.getStudent().getUser() != null ? request.getStudent().getUser().getName() : null);
        }

        if (request.getAssignedTutor() != null) {
            dto.setAssignedTutorId(request.getAssignedTutor().getId());
            dto.setAssignedTutorName(request.getAssignedTutor().getUser() != null
                    ? request.getAssignedTutor().getUser().getName()
                    : null);
        }

        dto.setCourseName(request.getCourseName());
        dto.setDescription(request.getDescription());
        dto.setStatus(request.getStatus() != null ? request.getStatus().name() : null);
        dto.setRequestedDate(request.getRequestedDate());
        dto.setScheduledDate(request.getScheduledDate());
        dto.setCompletedDate(request.getCompletedDate());
        dto.setNotes(request.getNotes());
        dto.setSessionDuration(request.getSessionDuration());
        dto.setTutorNotes(request.getTutorNotes());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        dto.setPaymentStatus(resolvePaymentStatus(request));
        return dto;
    }

    private RecentTutorRequestDTO convertToRecentRequestDTO(TutorRequest request) {
        RecentTutorRequestDTO dto = new RecentTutorRequestDTO();
        dto.setId(request.getId());
        dto.setDate(request.getRequestedDate() != null ? request.getRequestedDate() : request.getCreatedAt());
        dto.setCourseName(request.getCourseName());
        dto.setRevision(request.getDescription());
        dto.setPaymentStatus(resolvePaymentStatus(request));

        if (request.getStudent() != null) {
            dto.setStudentId(request.getStudent().getStudentId());
            dto.setStudentName(request.getStudent().getUser() != null ? request.getStudent().getUser().getName() : null);
        }

        return dto;
    }

    private String resolvePaymentStatus(TutorRequest request) {
        if (request.getStudent() == null
                || request.getStudent().getUser() == null
                || request.getCourseName() == null
                || request.getCourseName().isBlank()) {
            return "NOT_FOUND";
        }

        return paymentRepository
                .findLatestPaymentsForStudentUserAndCourseTitle(
                        request.getStudent().getUser().getId(),
                        request.getCourseName(),
                        PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .map(Payment::getStatus)
                .orElse("NOT_PAID");
    }
}
