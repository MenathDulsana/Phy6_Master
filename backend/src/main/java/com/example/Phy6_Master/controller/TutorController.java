package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.Tutor;
import com.example.Phy6_Master.service.TutorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tutors")
public class TutorController {

    private final TutorService tutorService;

    public TutorController(TutorService tutorService) {
        this.tutorService = tutorService;
    }

    @GetMapping("/profile/{userId}")
    public Tutor getTutorProfile(@PathVariable Long userId) {
        return tutorService.getTutorByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found for user ID: " + userId));
    }

    @GetMapping("/all")
    public List<Tutor> getAllTutors() {
        return tutorService.getAllTutors();
    }
}
