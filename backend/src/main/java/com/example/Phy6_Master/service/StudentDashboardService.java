package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.quiz.PerformanceInsightDto;
import com.example.Phy6_Master.dto.quiz.QuizAttemptDto;
import com.example.Phy6_Master.dto.quiz.QuizResultSummaryDto;
import com.example.Phy6_Master.dto.quiz.StudentDashboardResponseDto;
import com.example.Phy6_Master.exception.ForbiddenException;
import com.example.Phy6_Master.exception.NotFoundException;
import com.example.Phy6_Master.model.Question;
import com.example.Phy6_Master.model.QuizResult;
import com.example.Phy6_Master.model.StudentAnswer;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.QuizResultRepository;
import com.example.Phy6_Master.repository.StudentAnswerRepository;
import com.example.Phy6_Master.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudentDashboardService {

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private StudentAnswerRepository studentAnswerRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public StudentDashboardResponseDto getDashboard(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found with id: " + studentId));
        if (student.getRole() != User.Role.STUDENT) {
            throw new ForbiddenException("User is not a student");
        }

        List<QuizResult> results = quizResultRepository.findByStudent_IdOrderByEvaluatedAtDesc(studentId);
        if (results.isEmpty()) {
            return emptyDashboard();
        }

        StudentDashboardResponseDto response = new StudentDashboardResponseDto();
        response.setTotalQuizzes(results.size());
        response.setAverageScore(round2(results.stream().mapToDouble(QuizResult::getScorePercentage).average().orElse(0.0)));
        response.setHighestScore(round2(results.stream().mapToDouble(QuizResult::getScorePercentage).max().orElse(0.0)));
        response.setLowestScore(round2(results.stream().mapToDouble(QuizResult::getScorePercentage).min().orElse(0.0)));
        response.setRecentAttempts(toRecentAttempts(results));

        List<Long> sessionIds = results.stream().map(r -> r.getSession().getId()).toList();
        List<StudentAnswer> answers = sessionIds.isEmpty()
                ? List.of()
                : studentAnswerRepository.findBySession_IdIn(sessionIds);

        PerformanceBuckets buckets = buildPerformanceBuckets(answers);
        response.setStrengths(buckets.strengths());
        response.setWeaknesses(buckets.weaknesses());
        return response;
    }

    @Transactional(readOnly = true)
    public List<QuizResultSummaryDto> getLatestResultsByQuiz(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found with id: " + studentId));
        if (student.getRole() != User.Role.STUDENT) {
            throw new ForbiddenException("User is not a student");
        }

        List<QuizResult> results = quizResultRepository.findByStudent_IdOrderByEvaluatedAtDesc(studentId);
        Map<Long, QuizResult> latestByQuiz = new LinkedHashMap<>();
        for (QuizResult result : results) {
            Long quizId = result.getQuiz().getId();
            latestByQuiz.putIfAbsent(quizId, result);
        }
        return latestByQuiz.values().stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<QuizAttemptDto> getQuizAttempts(Long studentId, Long quizId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found with id: " + studentId));
        if (student.getRole() != User.Role.STUDENT) {
            throw new ForbiddenException("User is not a student");
        }

        List<QuizResult> results = quizResultRepository.findByStudent_IdAndQuiz_IdOrderByEvaluatedAtDesc(studentId, quizId);
        int totalAttempts = results.size();
        List<QuizAttemptDto> attempts = new ArrayList<>();

        for (int i = 0; i < results.size(); i++) {
            QuizResult result = results.get(i);
            QuizAttemptDto dto = new QuizAttemptDto();
            dto.setAttemptNumber(totalAttempts - i);
            dto.setStatus(result.getStatus());
            dto.setScorePercentage(round2(result.getScorePercentage()));
            dto.setCorrectAnswers(result.getCorrectAnswersCount());
            dto.setTotalQuestions(result.getTotalQuestions());

            if (result.getSession() != null) {
                dto.setStartedAt(result.getSession().getStartedAt());
                dto.setCompletedAt(result.getSession().getCompletedAt());
                if (result.getSession().getStartedAt() != null && result.getSession().getCompletedAt() != null) {
                    long durationSeconds = ChronoUnit.SECONDS.between(result.getSession().getStartedAt(), result.getSession().getCompletedAt());
                    dto.setDurationSeconds(Math.max(durationSeconds, 0));
                }
            }
            attempts.add(dto);
        }
        return attempts;
    }

    private StudentDashboardResponseDto emptyDashboard() {
        StudentDashboardResponseDto response = new StudentDashboardResponseDto();
        response.setTotalQuizzes(0);
        response.setAverageScore(0.0);
        response.setHighestScore(0.0);
        response.setLowestScore(0.0);
        response.setRecentAttempts(List.of());
        response.setStrengths(List.of());
        response.setWeaknesses(List.of());
        return response;
    }

    private List<QuizResultSummaryDto> toRecentAttempts(List<QuizResult> results) {
        return results.stream().limit(10).map(this::toSummary).toList();
    }

    private QuizResultSummaryDto toSummary(QuizResult result) {
        QuizResultSummaryDto summary = new QuizResultSummaryDto();
        summary.setQuizId(result.getQuiz().getId());
        summary.setQuizTitle(result.getQuiz().getTitle());
        summary.setScorePercentage(round2(result.getScorePercentage()));
        summary.setCorrectAnswers(result.getCorrectAnswersCount());
        summary.setTotalQuestions(result.getTotalQuestions());
        summary.setStatus(result.getStatus());
        summary.setAttemptedAt(result.getEvaluatedAt());
        return summary;
    }

    private PerformanceBuckets buildPerformanceBuckets(List<StudentAnswer> answers) {
        Map<Long, QuestionPerformance> byQuestion = new LinkedHashMap<>();
        for (StudentAnswer answer : answers) {
            if (answer.getQuestion() == null || answer.getSelectedOption() == null) {
                continue;
            }
            Question question = answer.getQuestion();
            QuestionPerformance perf = byQuestion.computeIfAbsent(question.getId(), id -> new QuestionPerformance(question.getText()));
            perf.attempts++;
            if (answer.getSelectedOption().isCorrect()) {
                perf.correctCount++;
            }
        }

        List<QuestionPerformance> all = new ArrayList<>(byQuestion.values());
        all.removeIf(p -> p.attempts == 0);

        List<PerformanceInsightDto> strengths = all.stream()
                .filter(p -> p.accuracy() >= 70.0)
                .sorted(Comparator.comparingDouble(QuestionPerformance::accuracy).reversed())
                .limit(5)
                .map(this::toInsight)
                .toList();

        List<PerformanceInsightDto> weaknesses = all.stream()
                .filter(p -> p.accuracy() <= 50.0)
                .sorted(Comparator.comparingDouble(QuestionPerformance::accuracy))
                .limit(5)
                .map(this::toInsight)
                .toList();

        if (strengths.isEmpty()) {
            strengths = all.stream()
                    .sorted(Comparator.comparingDouble(QuestionPerformance::accuracy).reversed())
                    .limit(3)
                    .map(this::toInsight)
                    .toList();
        }

        if (weaknesses.isEmpty()) {
            weaknesses = all.stream()
                    .sorted(Comparator.comparingDouble(QuestionPerformance::accuracy))
                    .limit(3)
                    .map(this::toInsight)
                    .toList();
        }

        return new PerformanceBuckets(strengths, weaknesses);
    }

    private PerformanceInsightDto toInsight(QuestionPerformance perf) {
        PerformanceInsightDto insight = new PerformanceInsightDto();
        insight.setLabel(perf.label);
        insight.setAttempts(perf.attempts);
        insight.setCorrectCount(perf.correctCount);
        insight.setAccuracyPercentage(round2(perf.accuracy()));
        return insight;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record PerformanceBuckets(List<PerformanceInsightDto> strengths, List<PerformanceInsightDto> weaknesses) {
    }

    private static class QuestionPerformance {
        private final String label;
        private int attempts;
        private int correctCount;

        private QuestionPerformance(String label) {
            this.label = label;
        }

        private double accuracy() {
            if (attempts == 0) {
                return 0.0;
            }
            return ((double) correctCount * 100.0) / attempts;
        }
    }
}
