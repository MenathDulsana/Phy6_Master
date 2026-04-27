package com.example.Phy6_Master.util;

/**
 * Shared validation for payment amounts (Stripe and manual flows).
 */
public final class PaymentAmounts {

    /** Minimum LKR charge so Stripe line-item amount is at least 1 minor unit after rounding. */
    public static final double MIN_STRIPE_LKR = 0.01d;

    private PaymentAmounts() {
    }

    /**
     * @throws IllegalArgumentException with a message starting with "Amount" so API layers can map to 400
     */
    public static void requireStripeCheckoutAmount(Double amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        if (amount.isNaN() || amount.isInfinite()) {
            throw new IllegalArgumentException("Amount must be a valid finite number");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (amount < MIN_STRIPE_LKR) {
            throw new IllegalArgumentException(
                    "Amount must be at least " + MIN_STRIPE_LKR + " LKR for Stripe checkout");
        }
        long minorUnits = Math.round(amount * 100);
        if (minorUnits < 1) {
            throw new IllegalArgumentException(
                    "Amount is too small after rounding — use at least " + MIN_STRIPE_LKR + " LKR");
        }
    }
}
