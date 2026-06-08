-- Add image column to User table if it doesn't exist
-- Needed for databases that were set up before this column was added to the schema
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
