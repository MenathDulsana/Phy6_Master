package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
public class TutorDashboardStatsDTO {
    private Integer incomingRequests;
    private Integer activeRequests;
    private Integer delivered;
    private Integer totalSessions;

    public TutorDashboardStatsDTO() {}

    public Integer getIncomingRequests() { return incomingRequests; }
    public void setIncomingRequests(Integer incomingRequests) { this.incomingRequests = incomingRequests; }

    public Integer getActiveRequests() { return activeRequests; }
    public void setActiveRequests(Integer activeRequests) { this.activeRequests = activeRequests; }

    public Integer getDelivered() { return delivered; }
    public void setDelivered(Integer delivered) { this.delivered = delivered; }

    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }
}
