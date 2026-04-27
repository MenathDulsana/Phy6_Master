package com.example.Phy6_Master.dto;

/**
 * DTO for creating / updating a timetable slot.
 * Times are sent as strings (HH:mm) for easy JSON handling.
 */
public class TimetableSlotDTO {

    private Long courseId; // which course this slot belongs to
    private String dayOfWeek; // e.g. "MONDAY"
    private String startTime; // e.g. "09:00"
    private String endTime; // e.g. "11:00"
    private String location; // e.g. "Room 101" or "Zoom link"
    private String notes; // optional teacher notes
    private String meetingLink; // optional online meeting URL

    public TimetableSlotDTO() {
    }

    public TimetableSlotDTO(Long courseId, String dayOfWeek,
            String startTime, String endTime,
            String location, String notes) {
        this.courseId = courseId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.notes = notes;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(String meetingLink) {
        this.meetingLink = meetingLink;
    }
}
