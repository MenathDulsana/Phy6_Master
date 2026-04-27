package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

/**
 * Repository for TimetableSlot.
 * Provides CRUD and a custom query to fetch slots by course.
 */
@Repository
public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {

    /**
     * Fetch all timetable slots for a given course.
     *
     * @param courseId the ID of the course
     * @return list of timetable slots
     */
    List<TimetableSlot> findByCourseId(Long courseId);

    /**
     * Fetch all slots ordered by day then start time.
     */
    List<TimetableSlot> findAllByOrderByDayOfWeekAscStartTimeAsc();

    /**
     * Find slots that overlap with a given time range on a given day.
     * Two slots overlap when: existingStart < newEnd AND existingEnd > newStart
     */
    @Query("SELECT s FROM TimetableSlot s WHERE s.dayOfWeek = :day AND s.startTime < :endTime AND s.endTime > :startTime")
    List<TimetableSlot> findOverlapping(@Param("day") DayOfWeek day,
                                        @Param("startTime") LocalTime startTime,
                                        @Param("endTime") LocalTime endTime);
}
