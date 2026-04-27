package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.service.StripeWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Stripe Webhook events.
 * 
 * Important: Configure this endpoint in Stripe Dashboard:
 * - Dashboard > Webhooks > Add endpoint
 * - Endpoint URL: https://yourserver.com/api/stripe/webhook
 * - Events: checkout.session.completed
 * 
 * The endpoint should be publicly accessible (without authentication).
 */
@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeWebhookService stripeWebhookService;

    /**
     * Receive Stripe webhook events.
     * 
     * POST /api/stripe/webhook
     * 
     * Headers:
     *   Stripe-Signature: [Stripe signature]
     * 
     * Body: Stripe event JSON
     * 
     * Response:
     *   200 OK if processed successfully
     *   400 Bad Request if signature verification failed
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        try {
            // Process webhook and verify signature
            boolean processed = stripeWebhookService.processWebhook(payload, sigHeader);
            
            if (processed) {
                return ResponseEntity.ok().body(new java.util.HashMap<String, String>() {{
                    put("status", "received");
                }});
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new java.util.HashMap<String, String>() {{
                    put("status", "failed");
                    put("message", "Failed to process webhook");
                }});
            }
            
        } catch (Exception e) {
            System.err.println("Webhook error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new java.util.HashMap<String, String>() {{
                put("status", "error");
                put("message", e.getMessage());
            }});
        }
    }
}
