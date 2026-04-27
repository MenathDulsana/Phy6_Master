package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.AccountantPaymentHistoryResponseDTO;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AccountantPaymentHistoryTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private AccountantPaymentService accountantPaymentService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetFilteredPaymentHistory() {
        // Arrange
        User student = new User();
        student.setName("Kasun Perera");
        
        Course course = new Course();
        course.setTitle("Physics 2026");

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setEnrollment(enrollment);
        payment.setAmount(2500.0);
        payment.setStatus("APPROVED");
        payment.setPaymentMethod("BANK_SLIP_UPLOAD");
        payment.setPaymentDate(LocalDateTime.now());

        when(paymentRepository.findPaymentsByFilters(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(Arrays.asList(payment));

        // Act
        List<AccountantPaymentHistoryResponseDTO> result = accountantPaymentService.getFilteredPaymentHistory(
                "Kasun", null, "BANK_SLIP_UPLOAD", "APPROVED", null, null
        );

        // Assert
        assertEquals(1, result.size());
        assertEquals("Kasun Perera", result.get(0).getStudentName());
        assertEquals("Physics 2026", result.get(0).getCourseName());
        assertEquals("BANK_SLIP_UPLOAD", result.get(0).getPaymentMethod());
        assertEquals("APPROVED", result.get(0).getStatus());
        assertEquals(2500.0, result.get(0).getAmount());
    }
}
