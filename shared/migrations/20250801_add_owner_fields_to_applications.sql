-- Migration: Add owner fields to applications table
ALTER TABLE applications
  ADD COLUMN owner_name TEXT,
  ADD COLUMN owner_email TEXT,
  ADD COLUMN owner_phone TEXT,
  ADD COLUMN owner_business_address TEXT;

-- Optional: If you want to remove the old owner_contact_info field, uncomment the next line
-- ALTER TABLE applications DROP COLUMN owner_contact_info;
