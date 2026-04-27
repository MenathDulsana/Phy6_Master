package com.example.Phy6_Master.repository;

import com.example.Phy6_Master.model.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TutorRequestRepository extends JpaRepository<TutorRequest, Long> {

    Page<TutorRequest> findByAssignedTutor(Tutor tutor, Pageable pageable);

    Page<TutorRequest> findByStatus(TutorRequest.RequestStatus status, Pageable pageable);

    Page<TutorRequest> findByStatusOrderByUpdatedAtDesc(TutorRequest.RequestStatus status, Pageable pageable);

    Page<TutorRequest> findByAssignedTutorAndStatus(Tutor tutor, TutorRequest.RequestStatus status, Pageable pageable);

    Page<TutorRequest> findByAssignedTutorAndStatusIn(
            Tutor tutor,
            List<TutorRequest.RequestStatus> statuses,
            Pageable pageable
    );

    Page<TutorRequest> findByStatusIn(List<TutorRequest.RequestStatus> statuses, Pageable pageable);

    Page<TutorRequest> findByStudent(Student student, Pageable pageable);

    List<TutorRequest> findByStudent(Student student);

    Page<TutorRequest> findByStatusAndAssignedTutorIsNull(TutorRequest.RequestStatus status, Pageable pageable);

    long countByStatus(TutorRequest.RequestStatus status);

    long countByStatusIn(List<TutorRequest.RequestStatus> statuses); // ✅ ADDED

    long countByAssignedTutorAndStatus(Tutor tutor, TutorRequest.RequestStatus status);

    @Query("SELECT tr FROM TutorRequest tr WHERE tr.assignedTutor = :tutor " +
           "AND tr.completedDate BETWEEN :startDate AND :endDate")
    List<TutorRequest> findCompletedRequestsByTutorAndDateRange(
            @Param("tutor") Tutor tutor,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    
    @Query("SELECT tr FROM TutorRequest tr ORDER BY tr.createdAt DESC")
    List<TutorRequest> findRecentRequests(Pageable pageable);


    @Query("SELECT tr FROM TutorRequest tr WHERE tr.status = :status ORDER BY tr.createdAt ASC")
    List<TutorRequest> findPendingRequestsOrderedByDate(
            @Param("status") TutorRequest.RequestStatus status
    );
}
