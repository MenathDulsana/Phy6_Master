package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.*;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.model.PasswordResetToken;
import com.example.Phy6_Master.model.Student;
import com.example.Phy6_Master.model.Teacher;
import com.example.Phy6_Master.model.Tutor;
import com.example.Phy6_Master.model.Accountant;
import com.example.Phy6_Master.repository.PasswordResetTokenRepository;
import com.example.Phy6_Master.repository.UserRepository;
import com.example.Phy6_Master.repository.StudentRepository;
import com.example.Phy6_Master.repository.TeacherRepository;
import com.example.Phy6_Master.repository.TutorRepository;
import com.example.Phy6_Master.repository.AccountantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final TutorRepository tutorRepository;
    private final AccountantRepository accountantRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, StudentRepository studentRepository,
                       TeacherRepository teacherRepository, TutorRepository tutorRepository,
                       AccountantRepository accountantRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.tutorRepository = tutorRepository;
        this.accountantRepository = accountantRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse signIn(AuthSignInRequest request) {
        String identifier = request.getUsername().trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getRole(),
                "Signed in successfully"
        );
    }

    @Transactional
    public AuthResponse signUpStudent(AuthSignUpRequest request) {
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            throw new IllegalArgumentException("Username already exists");
        });

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
                throw new IllegalArgumentException("Email already exists");
            });
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.STUDENT);
        user.setIsActive(true);

        User saved = userRepository.save(user);

        // Tute requests, enrollments, and other student flows expect a `students` row linked by user_id.
        Student student = new Student();
        student.setUser(saved);
        student.setStudentId("STU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        studentRepository.save(student);

        return new AuthResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getName(),
                saved.getRole(),
                "Account created successfully"
        );
    }

    public StudentResponse signUpAsStudent(StudentSignUpRequest request) {
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            throw new IllegalArgumentException("Username already exists");
        });

        // Create User
        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.Role.STUDENT);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // Create Student Profile
        Student student = new Student();
        student.setUser(savedUser);
        student.setStudentId("STU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        student.setSchool(request.getSchool());
        student.setBatch(request.getBatch());
        student.setAddress(request.getAddress());
        student.setParentName(request.getParentName());
        student.setParentPhoneNumber(request.getParentPhoneNumber());

        Student savedStudent = studentRepository.save(student);

        return new StudentResponse(
                savedUser.getId(),
                savedStudent.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhoneNumber(),
                savedStudent.getEnrollmentNumber(),
                savedStudent.getSchool(),
                savedStudent.getBatch(),
                savedStudent.getStream(),
                savedStudent.getAddress(),
                savedStudent.getParentName(),
                savedStudent.getParentPhoneNumber(),
                savedUser.getRole(),
                "Student account created successfully"
        );
    }

    public TeacherResponse signUpAsTeacher(TeacherSignUpRequest request) {
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            throw new IllegalArgumentException("Username already exists");
        });

        // Create User
        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.Role.TEACHER);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // Create Teacher Profile
        Teacher teacher = new Teacher();
        teacher.setUser(savedUser);
        teacher.setEmployeeId("EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        teacher.setEmail(request.getTeacherEmail());
        teacher.setPassword(passwordEncoder.encode(request.getTeacherPassword()));
        teacher.setQualification(request.getQualification());
        teacher.setSpecialization(request.getSpecialization());
        teacher.setDepartment(request.getDepartment());
        teacher.setExperience(request.getExperience());
        teacher.setOffice(request.getOffice());
        teacher.setOfficePhoneNumber(request.getOfficePhoneNumber());

        Teacher savedTeacher = teacherRepository.save(teacher);

        return new TeacherResponse(
                savedUser.getId(),
                savedTeacher.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhoneNumber(),
                teacher.getEmail(),
                teacher.getQualification(),
                teacher.getSpecialization(),
                teacher.getDepartment(),
                teacher.getExperience(),
                teacher.getOffice(),
                teacher.getOfficePhoneNumber(),
                savedUser.getRole(),
                "Teacher account created successfully"
        );
    }

    @Transactional
    public ForgotPasswordResponse requestPasswordReset(ForgotPasswordRequest request) {
        User user = userRepository.findByUsername(request.getIdentifier())
                .or(() -> userRepository.findByEmail(request.getIdentifier()))
                .orElse(null);

        // Return generic message even if user not found (security best practice)
        if (user == null) {
            return new ForgotPasswordResponse(
                    "If an account exists for this identifier, a reset token has been generated.",
                    null,
                    null
            );
        }

        // Invalidate any existing unused tokens for this user
        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findByUserAndUsedFalse(user);
        for (PasswordResetToken activeToken : activeTokens) {
            activeToken.setUsed(true);
        }
        if (!activeTokens.isEmpty()) {
            passwordResetTokenRepository.saveAll(activeTokens);
        }

        // Create new token (15 min expiry)
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setUsed(false);
        passwordResetTokenRepository.save(token);

        return new ForgotPasswordResponse(
                "Password reset token generated. Use it to reset your password.",
                token.getToken(),
                15
        );
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository
                .findByTokenAndUsedFalseAndExpiresAtAfter(request.getToken(), LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        return "Password reset successful. You can now sign in.";
    }

    public void ensureDefaultTeacher() {
        userRepository.findByUsername("teacher").ifPresentOrElse(
                u -> {
                    if ("Default Teacher".equals(u.getName())) {
                        u.setName("Teacher");
                        userRepository.save(u);
                    }
                },
                () -> {
                    User teacher = new User();
                    teacher.setName("Teacher");
                    teacher.setUsername("teacher");
                    teacher.setPassword(passwordEncoder.encode("teacher123"));
                    teacher.setRole(User.Role.TEACHER);
                    userRepository.save(teacher);
                });
    }

    public void ensureDefaultAccountant() {
        userRepository.findByUsername("acc2").ifPresentOrElse(
                u -> {
                    if ("Default Accountant".equals(u.getName())) {
                        u.setName("Accountant");
                        userRepository.save(u);
                    }
                },
                () -> {
                    User acc = new User();
                    acc.setName("Accountant");
                    acc.setUsername("acc2");
                    acc.setPassword(passwordEncoder.encode("123456"));
                    acc.setEmail("ac2@gmail.com");
                    acc.setPhoneNumber("0771234567");
                    acc.setRole(User.Role.ACCOUNTANT);
                    acc.setIsActive(true);
                    User savedUser = userRepository.save(acc);

                    Accountant accountant = new Accountant();
                    accountant.setUser(savedUser);
                    accountant.setAccountantId("ACC-DEF");
                    accountant.setDepartment("Finance");
                    accountant.setDesignation("Senior Accountant");
                    accountant.setQualification("BSc Accounting");
                    accountant.setOfficeLocation("Main Office");
                    accountantRepository.save(accountant);
                });
    }

    public TutorResponse signUpAsTutor(TutorSignUpRequest request) {
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            throw new IllegalArgumentException("Username already exists");
        });

        // Create User
        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.Role.TUTOR);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // Create Tutor Profile
        Tutor tutor = new Tutor();
        tutor.setUser(savedUser);
        tutor.setTutorId("TUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        tutor.setSpecialization(request.getSpecialization());
        tutor.setQualification(request.getQualification());
        tutor.setExperience(request.getExperience());
        tutor.setHourlyRate(request.getHourlyRate());
        tutor.setBio(request.getBio());

        Tutor savedTutor = tutorRepository.save(tutor);

        return new TutorResponse(
                savedUser.getId(),
                savedTutor.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhoneNumber(),
                tutor.getSpecialization(),
                tutor.getQualification(),
                tutor.getExperience(),
                tutor.getHourlyRate(),
                tutor.getBio(),
                savedUser.getRole(),
                "Tutor account created successfully"
        );
    }

    public AccountantResponse signUpAsAccountant(AccountantSignUpRequest request) {
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            throw new IllegalArgumentException("Username already exists");
        });

        // Create User
        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.Role.ACCOUNTANT);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // Create Accountant Profile
        Accountant accountant = new Accountant();
        accountant.setUser(savedUser);
        accountant.setAccountantId("ACC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        accountant.setDepartment(request.getDepartment());
        accountant.setQualification(request.getQualification());
        accountant.setDesignation(request.getDesignation());
        accountant.setOfficeLocation(request.getOfficeLocation());

        Accountant savedAccountant = accountantRepository.save(accountant);

        return new AccountantResponse(
                savedUser.getId(),
                savedAccountant.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhoneNumber(),
                accountant.getDepartment(),
                accountant.getQualification(),
                accountant.getDesignation(),
                accountant.getOfficeLocation(),
                savedUser.getRole(),
                "Accountant account created successfully"
        );
    }

    /**
     * Ensures the default tute manager login exists and has a {@link Tutor} row.
     * Accept/decline flows require {@code GET /api/tutors/profile/{userId}} to resolve tutor PK for {@code tutorId}.
     */
    @Transactional
    public void ensureDefaultTuteManager() {
        User u = userRepository.findByUsername("tutemanager").orElseGet(() -> {
            User tuteManager = new User();
            tuteManager.setName("Tutmanager");
            tuteManager.setUsername("tutemanager");
            tuteManager.setPassword(passwordEncoder.encode("tutemanager123"));
            tuteManager.setRole(User.Role.TUTOR);
            tuteManager.setIsActive(true);
            return userRepository.save(tuteManager);
        });
        if ("Default Tute Manager".equals(u.getName())) {
            u.setName("Tutmanager");
            userRepository.save(u);
        }
        Tutor tutor = tutorRepository.findByUser_Id(u.getId()).orElseGet(() -> {
            Tutor t = new Tutor();
            t.setUser(u);
            t.setTutorId("TUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            t.setSpecialization("General");
            t.setQualification("—");
            t.setExperience("0");
            t.setHourlyRate(0.0);
            t.setBio("Tutmanager");
            return tutorRepository.save(t);
        });
        if (tutor.getBio() != null && tutor.getBio().equalsIgnoreCase("Default tute manager")) {
            tutor.setBio("Tutmanager");
            tutorRepository.save(tutor);
        }
    }
}
