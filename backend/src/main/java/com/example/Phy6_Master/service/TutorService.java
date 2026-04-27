package com.example.Phy6_Master.service;

import com.example.Phy6_Master.model.Tutor;
import com.example.Phy6_Master.repository.TutorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TutorService {

    private final TutorRepository tutorRepository;

    public TutorService(TutorRepository tutorRepository) {
        this.tutorRepository = tutorRepository;
    }

    public Optional<Tutor> getTutorByUserId(Long userId) {
        return tutorRepository.findByUser_Id(userId);
    }

    public List<Tutor> getAllTutors() {
        return tutorRepository.findAll();
    }
}
