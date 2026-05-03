-- Add paused column to Service
ALTER TABLE "Service" ADD COLUMN "paused" BOOLEAN DEFAULT false;