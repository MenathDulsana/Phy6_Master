package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.TimetableSlotDTO;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.TimetableSlot;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.TimetableSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Timetable Scheduling.
 * Handles all business logic for creating, reading, updating, and
 * deleting timetable slots for the teacher's courses.
 */
@Service
public class TimetableService {

    @Autowired
    private TimetableSlotRepository timetableSlotRepository;

    @Autowired
    private CourseRepository courseRepository;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Create a new timetable slot.
     *
     * @param dto DTO containing slot data
     * @return the saved TimetableSlot entity
     */
    public TimetableSlot createSlot(TimetableSlotDTO dto) {
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException(
                        "Course not found with id: " + dto.getCourseId()));

        validateTimes(dto.getStartTime(), dto.getEndTime());

        // Check for clashes
        DayOfWeek day = parseDayOfWeek(dto.getDayOfWeek());
        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end = LocalTime.parse(dto.getEndTime());
        checkForClash(day, start, end, null);

        TimetableSlot slot = new TimetableSlot(
                course,
                day,
                start,
                end,
                dto.getLocation(),
                dto.getNotes());
        slot.setMeetingLink(dto.getMeetingLink());

        return timetableSlotRepository.save(slot);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Get all timetable slots, ordered by day and start time.
     */
    public List<TimetableSlot> getAllSlots() {
        return timetableSlotRepository.findAllByOrderByDayOfWeekAscStartTimeAsc();
    }

    /**
     * Get all timetable slots for a specific course.
     *
     * @param courseId the course ID
     * @return list of slots for that course
     */
    public List<TimetableSlot> getSlotsByCourse(Long courseId) {
        // Validate course exists
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found with id: " + courseId);
        }
        return timetableSlotRepository.findByCourseId(courseId);
    }

    /**
     * Get a single slot by its ID.
     */
    public Optional<TimetableSlot> getSlotById(Long id) {
        return timetableSlotRepository.findById(id);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /**
     * Update an existing timetable slot.
     *
     * @param id  the slot ID to update
     * @param dto DTO with updated values
     * @return the updated TimetableSlot entity
     */
    public TimetableSlot updateSlot(Long id, TimetableSlotDTO dto) {
        TimetableSlot slot = timetableSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Timetable slot not found with id: " + id));

        // Update course if changed
        if (dto.getCourseId() != null) {
            Course course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new RuntimeException(
                            "Course not found with id: " + dto.getCourseId()));
            slot.setCourse(course);
        }

        if (dto.getDayOfWeek() != null) {
            slot.setDayOfWeek(parseDayOfWeek(dto.getDayOfWeek()));
        }

        if (dto.getStartTime() != null && dto.getEndTime() != null) {
            validateTimes(dto.getStartTime(), dto.getEndTime());
            LocalTime newStart = LocalTime.parse(dto.getStartTime());
            LocalTime newEnd = LocalTime.parse(dto.getEndTime());
            DayOfWeek day = dto.getDayOfWeek() != null ? parseDayOfWeek(dto.getDayOfWeek()) : slot.getDayOfWeek();
            checkForClash(day, newStart, newEnd, id);
            slot.setStartTime(newStart);
            slot.setEndTime(newEnd);
        } else if (dto.getStartTime() != null) {
            LocalTime newStart = LocalTime.parse(dto.getStartTime());
            DayOfWeek day = dto.getDayOfWeek() != null ? parseDayOfWeek(dto.getDayOfWeek()) : slot.getDayOfWeek();
            checkForClash(day, newStart, slot.getEndTime(), id);
            slot.setStartTime(newStart);
        } else if (dto.getEndTime() != null) {
            LocalTime newEnd = LocalTime.parse(dto.getEndTime());
            DayOfWeek day = dto.getDayOfWeek() != null ? parseDayOfWeek(dto.getDayOfWeek()) : slot.getDayOfWeek();
            checkForClash(day, slot.getStartTime(), newEnd, id);
            slot.setEndTime(newEnd);
        } else if (dto.getDayOfWeek() != null) {
            // Day changed but times unchanged — still need clash check
            DayOfWeek day = parseDayOfWeek(dto.getDayOfWeek());
            checkForClash(day, slot.getStartTime(), slot.getEndTime(), id);
        }

        if (dto.getLocation() != null) {
            slot.setLocation(dto.getLocation());
        }

        if (dto.getNotes() != null) {
            slot.setNotes(dto.getNotes());
        }

        if (dto.getMeetingLink() != null) {
            slot.setMeetingLink(dto.getMeetingLink());
        }

        return timetableSlotRepository.save(slot);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /**
     * Delete a timetable slot by ID.
     *
     * @param id the slot ID
     */
    public void deleteSlot(Long id) {
        TimetableSlot slot = timetableSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Timetable slot not found with id: " + id));
        timetableSlotRepository.delete(slot);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Validate that start time is before end time.
     */
    private void validateTimes(String startTime, String endTime) {
        try {
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);
            if (!start.isBefore(end)) {
                throw new IllegalArgumentException(
                        "Start time must be before end time.");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Invalid time format. Use HH:mm (e.g. 09:00).");
        }
    }

    /**
     * Check that no existing slot overlaps with the given day/time range.
     * Excludes the slot with excludeId (for updates).
     */
    private void checkForClash(DayOfWeek day, LocalTime start, LocalTime end, Long excludeId) {
        List<TimetableSlot> overlapping = timetableSlotRepository.findOverlapping(day, start, end);
        // When updating, exclude the slot being edited
        if (excludeId != null) {
            overlapping = overlapping.stream()
                    .filter(s -> !s.getId().equals(excludeId))
                    .collect(java.util.stream.Collectors.toList());
        }
        if (!overlapping.isEmpty()) {
            TimetableSlot clash = overlapping.get(0);
            String clashCourse = clash.getCourse() != null ? clash.getCourse().getTitle() : "another class";
            throw new RuntimeException(
                    "Time clash! \"" + clashCourse + "\" is already scheduled on "
                    + day + " from " + clash.getStartTime() + " to " + clash.getEndTime() + ".");
        }
    }

    /**
     * Parse a day-of-week string to the DayOfWeek enum.
     */
    private DayOfWeek parseDayOfWeek(String day) {
        try {
            return DayOfWeek.valueOf(day.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid day: " + day +
                            ". Use one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY");
        }
    }
}
