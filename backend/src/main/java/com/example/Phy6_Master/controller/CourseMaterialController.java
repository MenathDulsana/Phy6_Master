package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.LearningMaterial;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.UserRepository;
import com.example.Phy6_Master.service.ClassAccessService;
import com.example.Phy6_Master.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CourseMaterialController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private ClassAccessService classAccessService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/courses/{courseId}/materials")
    public ResponseEntity<?> getCourseMaterials(@PathVariable Long courseId,
            @RequestParam(required = false) Long userId) {
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }
            var access = classAccessService.checkAccess(user, courseId);
            if (!access.isCanAccess()) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", access.getMessage(), "status", access.getStatus()));
            }
        }

        List<LearningMaterial> materials = studentService.getCourseMaterials(courseId);
        return ResponseEntity.ok(materials);
    }

    
}
