-- Fix FOREIGN KEY constraint to allow NULL values for guest donations
-- This allows non-members to make donations without user_id

-- Step 1: Drop the existing FOREIGN KEY constraint
ALTER TABLE donations DROP FOREIGN KEY IF EXISTS FK_donations_user;

-- Step 2: Modify the column to explicitly allow NULL (if it has NOT NULL constraint)
ALTER TABLE donations MODIFY COLUMN user_id BIGINT NULL;

-- Step 3: Recreate the FOREIGN KEY constraint
-- When user_id is NULL, it represents a guest donation (no FK validation)
-- When user_id has a value, it must reference a valid user
ALTER TABLE donations
ADD CONSTRAINT FK_donations_user
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE CASCADE;
