package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Stripe Checkout Session creation.
 * Frontend receives this and redirects to Stripe Checkout.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripeCheckoutResponseDTO {
    private String clientSecret; // Stripe API key for frontend (public)
    private String sessionId;    // Stripe Checkout Session ID
    private Long paymentId;      // Our internal payment record ID
    private String redirectUrl;  // Stripe Checkout page URL (optional, for redirect)
}
