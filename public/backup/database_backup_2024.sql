-- VULNERABILITY: Old backup file with sensitive information
-- MarketHub Database Backup - January 2024

-- Admin users
INSERT INTO users (email, password_hash, role) VALUES 
('admin@markethub.com', 'admin123', 'admin'),
('superadmin@markethub.com', 'password123', 'superadmin'),
('developer@markethub.com', 'dev2024!', 'admin');

-- Database connection string
-- postgresql://admin:SuperSecret123!@localhost:5432/markethub

-- API Configuration
-- STRIPE_SECRET_KEY=sk_live_51ABC123XYZ
-- PAYPAL_CLIENT_SECRET=sb_secret_abc123
-- AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

-- Test credit cards used in development
-- 4111111111111111 (Visa)
-- 5500000000000004 (Mastercard)
-- CVV: 123, Expiry: 12/25

-- Server SSH credentials
-- Host: 192.168.1.100
-- User: root
-- Pass: ServerRoot2024!
