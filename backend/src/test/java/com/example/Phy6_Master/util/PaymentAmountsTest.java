package com.example.Phy6_Master.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class PaymentAmountsTest {

    @Test
    void acceptsTypicalFee() {
        assertDoesNotThrow(() -> PaymentAmounts.requireStripeCheckoutAmount(99.99));
    }

    @ParameterizedTest
    @ValueSource(doubles = { -1, -0.01, 0, Double.NaN })
    void rejectsNonPositiveOrNan(double bad) {
        assertThrows(IllegalArgumentException.class, () -> PaymentAmounts.requireStripeCheckoutAmount(bad));
    }

    @Test
    void rejectsInfinite() {
        assertThrows(IllegalArgumentException.class,
                () -> PaymentAmounts.requireStripeCheckoutAmount(Double.POSITIVE_INFINITY));
    }

    @Test
    void rejectsNull() {
        assertThrows(IllegalArgumentException.class, () -> PaymentAmounts.requireStripeCheckoutAmount(null));
    }

    @Test
    void rejectsSubCentThatRoundsToZeroMinorUnits() {
        assertThrows(IllegalArgumentException.class, () -> PaymentAmounts.requireStripeCheckoutAmount(0.001));
    }
}
