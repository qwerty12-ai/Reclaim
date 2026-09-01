CREATE DATABASE IF NOT EXISTS reclaim;

USE reclaim;

CREATE TABLE cases (
    id VARCHAR(36) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    issue_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'at_risk',
    risk_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
);

CREATE TABLE recovery_executions(
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    amount_recovered DECIMAL(12, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT fk_recovery_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE 
);