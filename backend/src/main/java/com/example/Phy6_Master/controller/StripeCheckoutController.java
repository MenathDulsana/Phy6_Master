package com.example.Phy6_Master.controller;

import com.stripe.exception.StripeException;
import com.example.Phy6_Master.dto.StripeCheckoutRequestDTO;
import com.example.Phy6_Master.dto.StripeCheckoutResponseDTO;
import com.example.Phy6_Master.service.StripeCheckoutService;
import com.example.Phy6_Master.util.PaymentAmounts;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Stripe Checkout operations.
 * Handles student payment requests for Stripe online payment method.
 */
@RestController
@RequestMapping("/api/student/stripe")
@RequiredArgsConstructor
public class StripeCheckoutController {

    private final StripeCheckoutService stripeCheckoutService;

    /**
     * Create a Stripe Checkout Session for the given class.
     * 
     * POST /api/student/stripe/checkout
     * Request body: {
     *   "studentId": 1,
     *   "classId": 5,
     *   "amount": 99.99
     * }
     * 
     * Response: {
     *   "sessionId": "cs_test_...",
     *   "clientSecret": "pk_test_...",
     *   "paymentId": 123,
     *   "redirectUrl": "https://checkout.stripe.com/..."
     * }
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckoutSession(@RequestBody StripeCheckoutRequestDTO request) {
        try {
            if (request.getStudentId() == null || request.getClassId() == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse(
                        false,
                        "Required fields missing: studentId, classId"
                ));
            }
            try {
                PaymentAmounts.requireStripeCheckoutAmount(request.getAmount());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(new ErrorResponse(false, ex.getMessage()));
            }

            // Create checkout session
            StripeCheckoutResponseDTO response = stripeCheckoutService.createCheckoutSession(request);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            // Duplicate enrollment/payment
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(
                    false, 
                    e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            // Student/course not found (amount errors are handled above)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    e.getMessage()
            ));
        } catch (StripeException e) {
            // Error communicating with Stripe
            System.err.println("Stripe API error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ErrorResponse(
                    false, 
                    "Error creating Stripe checkout session: " + e.getMessage()
            ));
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(
                    false, 
                    "An unexpected error occurred"
            ));
        }
    }

    /**
     * Simple error response DTO
     */
    public static class ErrorResponse {
        public boolean success;
        public String message;

        public ErrorResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }
    }
}
