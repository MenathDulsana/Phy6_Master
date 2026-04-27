package com.example.Phy6_Master.dto.quiz;

import java.util.List;

public class StudentDashboardResponseDto {
    private Integer totalQuizzes;
    private Double averageScore;
    private Double highestScore;
    private Double lowestScore;
    private List<QuizResultSummaryDto> recentAttempts;
    private List<PerformanceInsightDto> strengths;
    private List<PerformanceInsightDto> weaknesses;

    public Integer getTotalQuizzes() {
        return totalQuizzes;
    }

    public void setTotalQuizzes(Integer totalQuizzes) {
        this.totalQuizzes = totalQuizzes;
    }

    public Double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(Double averageScore) {
        this.averageScore = averageScore;
    }

    public Double getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(Double highestScore) {
        this.highestScore = highestScore;
    }

    public Double getLowestScore() {
        return lowestScore;
    }

    public void setLowestScore(Double lowestScore) {
        this.lowestScore = lowestScore;
    }

    public List<QuizResultSummaryDto> getRecentAttempts() {
        return recentAttempts;
    }

    public void setRecentAttempts(List<QuizResultSummaryDto> recentAttempts) {
        this.recentAttempts = recentAttempts;
    }

    public List<PerformanceInsightDto> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<PerformanceInsightDto> strengths) {
        this.strengths = strengths;
    }

    public List<PerformanceInsightDto> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<PerformanceInsightDto> weaknesses) {
        this.weaknesses = weaknesses;
    }
}