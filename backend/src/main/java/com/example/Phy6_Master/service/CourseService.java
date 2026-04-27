package com.example.Phy6_Master.service;

import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    public Course createCourse(Long teacherId, String title, String description,
                               String batch, String subject, String type, String imageUrl) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setBatch(batch);
        course.setSubject(subject);
        course.setType(type);
        course.setImageUrl(imageUrl);

        if (teacherId != null) {
            User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + teacherId));
            course.setTeacher(teacher);
        }

        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public Course updateCourse(Long id, Course courseDetails) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));

        course.setTitle(courseDetails.getTitle());
        course.setDescription(courseDetails.getDescription());
        course.setBatch(courseDetails.getBatch());
        course.setSubject(courseDetails.getSubject());
        course.setType(courseDetails.getType());
        course.setImageUrl(courseDetails.getImageUrl());

        // Assuming teacher doesn't change often, or handle separately if needed

        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));

        courseRepository.delete(course);
    }
}
