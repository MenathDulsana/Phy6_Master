package com.example.Phy6_Master.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Represents a single scheduled class slot in the teacher's timetable.
 * Each slot is linked to a Course and specifies the day and time of the class.
 */
@Entity
@Table(name = "timetable_slots")
public class TimetableSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The course this slot belongs to
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Course course;

    // Day of week: MONDAY, TUESDAY … SUNDAY
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    // Class start time (e.g. 09:00)
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    // Class end time (e.g. 11:00)
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    // Optional: physical room or online meeting link
    @Column(name = "location")
    private String location;

    // Optional: any notes the teacher wants to add
    @Column(name = "notes", length = 500)
    private String notes;

    // Optional: online meeting link (e.g. Zoom / Google Meet URL)
    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    // ── Constructors ──────────────────────────────────────────────────────────

    public TimetableSlot() {
    }

    public TimetableSlot(Course course, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime,
            String location, String notes) {
        this.course = course;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.notes = notes;
    }

    public TimetableSlot(Course course, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime,
            String location, String notes, String meetingLink) {
        this(course, dayOfWeek, startTime, endTime, location, notes);
        this.meetingLink = meetingLink;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
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
