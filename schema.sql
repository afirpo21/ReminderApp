CREATE DATABASE IF NOT EXISTS reminderdb;
USE reminderdb;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    default_email VARCHAR(255) DEFAULT NULL,
    reminder_frequency VARCHAR(20) DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    note TEXT,
    scheduled_at DATETIME NOT NULL,
    channel VARCHAR(10) CHECK (channel IN ('EMAIL', 'SMS')),
    target_contact VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    frequency VARCHAR(20) DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
