-- Fix existing MySQL enum/short column for users.role to allow full role names
ALTER TABLE users
    MODIFY COLUMN role VARCHAR(20) NOT NULL;
