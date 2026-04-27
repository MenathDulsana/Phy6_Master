package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findTopByEnrollmentOrderByPaymentDateDesc(Enrollment enrollment);

    /** Latest payment for a student (User id) + course title — used by tutor request payment status. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT p FROM Payment p WHERE p.enrollment.student.id = :userId "
                    + "AND LOWER(p.enrollment.course.title) = LOWER(:courseTitle) "
                    + "ORDER BY p.paymentDate DESC")
    List<Payment> findLatestPaymentsForStudentUserAndCourseTitle(
            @Param("userId") Long userId,
            @Param("courseTitle") String courseTitle,
            Pageable pageable);
    
    // For accountant pending list (ONLY ATM and Bank Slip, ONLY SUBMITTED status)
    List<Payment> findByStatusAndPaymentMethodInOrderByPaymentDateAsc(
            String status, 
            List<String> paymentMethods
    );
    
    // For accountant history list
    List<Payment> findByStatusInOrderByPaymentDateDesc(List<String> statuses);

    // For student history list
    List<Payment> findByEnrollmentStudentOrderByPaymentDateDesc(User student);
    
    // Stripe-specific queries
    Optional<Payment> findByStripeSessionId(String stripeSessionId);
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
    
    // Find payments by enrollment and payment method
    Optional<Payment> findByEnrollmentAndPaymentMethod(Enrollment enrollment, String paymentMethod);
    
    // Dynamic filtering for full payment history
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE " +
            "(:studentName = '' OR LOWER(p.enrollment.student.name) LIKE LOWER(CONCAT('%', :studentName, '%'))) AND " +
            "(:courseName = '' OR LOWER(p.enrollment.course.title) LIKE LOWER(CONCAT('%', :courseName, '%'))) AND " +
            "(:paymentMethod = 'ALL' OR p.paymentMethod = :paymentMethod) AND " +
            "(:status = 'ALL' OR p.status = :status) AND " +
            "(p.paymentDate >= :startDate) AND " +
            "(p.paymentDate <= :endDate) " +
            "ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsByFilters(
            @org.springframework.data.repository.query.Param("studentName") String studentName,
            @org.springframework.data.repository.query.Param("courseName") String courseName,
            @org.springframework.data.repository.query.Param("paymentMethod") String paymentMethod,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate
    );

    // Monthly Report Aggregations with Filters
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p WHERE p.status = 'APPROVED' AND p.paymentDate >= :startDate AND p.paymentDate <= :endDate " +
            "AND (:courseId = -1L OR p.enrollment.course.id = :courseId) AND (:paymentMethod = 'ALL' OR p.paymentMethod = :paymentMethod)")
    Double sumApprovedAmountWithFilters(
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate,
            @org.springframework.data.repository.query.Param("courseId") Long courseId,
            @org.springframework.data.repository.query.Param("paymentMethod") String paymentMethod
    );

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status AND p.paymentDate >= :startDate AND p.paymentDate <= :endDate " +
            "AND (:courseId = -1L OR p.enrollment.course.id = :courseId) AND (:paymentMethod = 'ALL' OR p.paymentMethod = :paymentMethod)")
    long countByStatusWithFilters(
            @org.springframework.data.repository.query.Param("status") String status, 
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime start, 
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime end,
            @org.springframework.data.repository.query.Param("courseId") Long courseId,
            @org.springframework.data.repository.query.Param("paymentMethod") String paymentMethod
    );

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentDate >= :startDate AND p.paymentDate <= :endDate " +
            "AND (:courseId = -1L OR p.enrollment.course.id = :courseId) AND (:paymentMethod = 'ALL' OR p.paymentMethod = :paymentMethod)")
    long countTotalWithFilters(
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime start, 
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime end,
            @org.springframework.data.repository.query.Param("courseId") Long courseId,
            @org.springframework.data.repository.query.Param("paymentMethod") String paymentMethod
    );
}
