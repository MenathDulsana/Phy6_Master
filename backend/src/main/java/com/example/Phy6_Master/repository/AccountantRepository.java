package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.Accountant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountantRepository extends JpaRepository<Accountant, Long> {
    Optional<Accountant> findByUser_Id(Long userId);
    Optional<Accountant> findByAccountantId(String accountantId);
}
