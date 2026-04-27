package com.example.Phy6_Master.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for handling incoming Stripe webhook events.
 * Stripe sends this as JSON in webhook POST requests.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StripeWebhookEventDTO {
    private String id;           // Stripe Event ID
    private String type;         // Event type (e.g., "checkout.session.completed")
    private long created;        // Unix timestamp
    private String livemode;     // true/false
    private StripeDataObject data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StripeDataObject {
        private StripeCheckoutSession object;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class StripeCheckoutSession {
            private String id;                    // Session ID
            private String paymentStatus;         // "completed", etc.
            private String paymentIntentId;       // Payment Intent ID (if available)
            private String customerEmail;         // Customer email
            private String clientReferenceId;     // Our metadata: studentId,classId
            private java.util.Map<String, String> metadata; // Additional metadata
        }
    }
}
