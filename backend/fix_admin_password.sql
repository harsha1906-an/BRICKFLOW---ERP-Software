-- Fix admin password to admin123
UPDATE users SET password = '$2b$10$HgS54d2x4lwO8CaFBqm.COU2OQ8hXk1dAJXplkxr8fDqFby53L7FG' WHERE username = 'admin';
SELECT 'Password updated for user: ' || username || ', Role: ' || role FROM users WHERE username = 'admin';
