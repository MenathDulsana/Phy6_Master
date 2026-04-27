package com.example.Phy6_Master.config;

import com.example.Phy6_Master.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeederConfig {

    @Bean
    public CommandLineRunner seedDefaultTeacher(AuthService authService) {
        return args -> {
            authService.ensureDefaultTeacher();
            authService.ensureDefaultAccountant();
            authService.ensureDefaultTuteManager();
        };
    }
}
