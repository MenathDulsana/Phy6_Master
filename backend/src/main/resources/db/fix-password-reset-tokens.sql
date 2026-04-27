-- Run once in MySQL if Hibernate logs DDL failure on password_reset_tokens.id
-- (e.g. legacy VARCHAR/UUID ids vs current entity: BIGINT auto_increment).
-- After this, restart the app with ddl-auto=update.
--
-- Option A — keep table, clear rows, fix column type:
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM password_reset_tokens;
ALTER TABLE password_reset_tokens MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
SET FOREIGN_KEY_CHECKS = 1;
--
-- Option B — if Option A still fails, let Hibernate recreate the table:
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS password_reset_tokens;
-- SET FOREIGN_KEY_CHECKS = 1;
-- (then restart the app)
