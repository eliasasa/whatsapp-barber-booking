/*
  Warnings:

  - Made the column `paused` on table `Service` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "paused" SET NOT NULL;
