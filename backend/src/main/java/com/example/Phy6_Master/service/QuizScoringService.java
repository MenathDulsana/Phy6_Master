package com.example.Phy6_Master.service;

import com.example.Phy6_Master.model.Question;
import com.example.Phy6_Master.model.QuizResultStatus;
import com.example.Phy6_Master.model.StudentAnswer;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class QuizScoringService {

    public ScoreResult score(List<Question> questions, Map<Long, StudentAnswer> answerByQuestion, int passThresholdPercentage) {
        int correctAnswers = 0;
        for (Question question : questions) {
            StudentAnswer answer = answerByQuestion.get(question.getId());
            if (answer != null && answer.getSelectedOption() != null && answer.getSelectedOption().isCorrect()) {
                correctAnswers++;
            }
        }

        int totalQuestions = questions.size();
        double percentage = totalQuestions == 0
                ? 0.0
                : ((double) correctAnswers * 100.0) / totalQuestions;

        QuizResultStatus status = percentage >= passThresholdPercentage
                ? QuizResultStatus.PASS
                : QuizResultStatus.FAIL;

        return new ScoreResult(correctAnswers, totalQuestions, percentage, status);
    }

    public record ScoreResult(int correctAnswersCount, int totalQuestions, double scorePercentage, QuizResultStatus status) {
    }
}