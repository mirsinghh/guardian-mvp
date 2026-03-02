-- Migration: Add location_verification_result column to risk_checks table
-- Run this if your database was created before this update

ALTER TABLE risk_checks 
ADD COLUMN IF NOT EXISTS location_verification_result BOOLEAN;

-- Update existing records with NULL location verification to have a default value
UPDATE risk_checks 
SET location_verification_result = true 
WHERE location_verification_result IS NULL;
