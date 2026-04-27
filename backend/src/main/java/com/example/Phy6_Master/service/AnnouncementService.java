package com.example.Phy6_Master.service;

import com.example.Phy6_Master.model.Announcement;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.AnnouncementRepository;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;


    public Announcement createAnnouncement(Long courseId, Long teacherId,
                                           String title, String content) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Allow if course has no teacher (legacy) or if teacher owns the course
        if (course.getTeacher() != null && !course.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Teacher can only create announcements for their own courses");
        }

        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setCourse(course);
        announcement.setTeacher(teacher);

        return announcementRepository.save(announcement);
    }



    public List<Announcement> getAnnouncementsByCourse(Long courseId) {
        return announcementRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    public List<Announcement> getAnnouncementsByTeacher(Long teacherId) {
        return announcementRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
    }

    public List<Announcement> getAnnouncementsForStudent(Long userId) {
        return announcementRepository.findByEnrolledCourses(userId);
    }

    public Optional<Announcement> getAnnouncementById(Long id) {
        return announcementRepository.findById(id);
    }

    
    public Announcement updateAnnouncement(Long id, Long teacherId,
                                           String title, String content) {

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));

        if (!announcement.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You can only update your own announcements");
        }

        announcement.setTitle(title);
        announcement.setContent(content);

        return announcementRepository.save(announcement);
    }



    @Transactional
    public void deleteAnnouncement(Long id, Long teacherId) {

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));

        if (!announcement.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You can only delete your own announcements");
        }

        announcementRepository.delete(announcement);
    }
}