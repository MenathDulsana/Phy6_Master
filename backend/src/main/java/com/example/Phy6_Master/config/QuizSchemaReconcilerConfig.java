package com.example.Phy6_Master.config;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Reconciles the student_answers.selected_option_id foreign key on MySQL.
 * Hibernate may generate the FK pointing at the wrong table depending on schema
 * creation order; this runner corrects it at startup if needed.
 */
@Configuration
public class QuizSchemaReconcilerConfig {

    @Bean
    public CommandLineRunner reconcileStudentAnswersOptionFk(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        return args -> {
            if (!isMySql(dataSource)) {
                return;
            }

            List<Map<String, Object>> fkRows = jdbcTemplate.queryForList(
                    """
                    SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'student_answers'
                      AND COLUMN_NAME = 'selected_option_id'
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                    """
            );

            boolean alreadyCorrect = fkRows.stream()
                    .anyMatch(row -> "answer_options".equalsIgnoreCase((String) row.get("REFERENCED_TABLE_NAME")));
            if (alreadyCorrect) {
                return;
            }

            for (Map<String, Object> row : fkRows) {
                String fkName = (String) row.get("CONSTRAINT_NAME");
                jdbcTemplate.execute("ALTER TABLE student_answers DROP FOREIGN KEY `" + escapeBackticks(fkName) + "`");
            }

            jdbcTemplate.execute(
                    "ALTER TABLE student_answers " +
                            "ADD CONSTRAINT fk_student_answer_selected_option " +
                            "FOREIGN KEY (selected_option_id) REFERENCES answer_options(id)"
            );
        };
    }

    private boolean isMySql(DataSource dataSource) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            return connection.getMetaData().getDatabaseProductName().toLowerCase().contains("mysql");
        }
    }

    private String escapeBackticks(String value) {
        return value.replace("`", "``");
    }
}
