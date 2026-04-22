/*
  Warnings:

  - You are about to drop the column `generatedAT` on the `summaries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `summaries` DROP COLUMN `generatedAT`,
    ADD COLUMN `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
