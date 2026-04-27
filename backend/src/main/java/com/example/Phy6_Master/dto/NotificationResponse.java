package com.example.Phy6_Master.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    /** When set, links this alert to a payment (for downloads and grouping in the student app). */
    private Long paymentId;
    /** Official receipt number when the related payment has one. */
    private String receiptNumber;
    private String title;
    private String message;
    private String classReference;
    private String type;
    /** Explicit JSON name so clients always receive {@code isRead} (Jackson can otherwise emit {@code read}). */
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
