package com.example.Phy6_Master.service;

import com.example.Phy6_Master.model.Teacher;
import com.example.Phy6_Master.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public TeacherService(TeacherRepository teacherRepository) {
        this.teacherRepository = teacherRepository;
    }

    public Optional<Teacher> getTeacherByUserId(Long userId) {
        return teacherRepository.findByUser_Id(userId);
    }

    public Optional<Teacher> getTeacherByEmployeeId(String employeeId) {
        return teacherRepository.findByEmployeeId(employeeId);
    }

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Teacher updateTeacherProfile(Long userId, Teacher teacherDetails) {
        Optional<Teacher> teacher = teacherRepository.findByUser_Id(userId);

        if (!teacher.isPresent()) {
            throw new IllegalArgumentException("Teacher not found for user ID: " + userId);
        }

        Teacher existingTeacher = teacher.get();

        if (teacherDetails.getQualification() != null) {
            existingTeacher.setQualification(teacherDetails.getQualification());
        }
        if (teacherDetails.getSpecialization() != null) {
            existingTeacher.setSpecialization(teacherDetails.getSpecialization());
        }
        if (teacherDetails.getDepartment() != null) {
            existingTeacher.setDepartment(teacherDetails.getDepartment());
        }
        if (teacherDetails.getExperience() != null) {
            existingTeacher.setExperience(teacherDetails.getExperience());
        }
        if (teacherDetails.getOffice() != null) {
            existingTeacher.setOffice(teacherDetails.getOffice());
        }
        if (teacherDetails.getOfficePhoneNumber() != null) {
            existingTeacher.setOfficePhoneNumber(teacherDetails.getOfficePhoneNumber());
        }

        return teacherRepository.save(existingTeacher);
    }

    public Teacher createTeacher(Teacher teacher) {
        return teacherRepository.save(teacher);
    }

    public void deleteTeacher(Long teacherId) {
        teacherRepository.deleteById(teacherId);
    }
}
