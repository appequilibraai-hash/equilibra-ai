-- Script para adicionar campos faltantes à tabela users
-- Execute isto no seu banco de dados do VPS

-- Adicionar campos que podem estar faltando
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `username` varchar(64);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `loginMethod` varchar(64) DEFAULT 'local';
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` enum('user', 'admin') DEFAULT 'user' NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `isEmailVerified` int DEFAULT 0 NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `onboardingCompleted` int DEFAULT 0 NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lastSignedIn` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordResetToken` varchar(255);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordResetExpires` timestamp;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerificationToken` varchar(255);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerificationExpires` timestamp;

-- Adicionar índices se não existirem
ALTER TABLE `users` ADD UNIQUE KEY IF NOT EXISTS `email_unique` (`email`);
ALTER TABLE `users` ADD UNIQUE KEY IF NOT EXISTS `openId_unique` (`openId`);

-- Verificar estrutura final
DESCRIBE `users`;
