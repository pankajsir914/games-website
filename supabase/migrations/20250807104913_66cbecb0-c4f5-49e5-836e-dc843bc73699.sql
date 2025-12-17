-- First migration: Add master_admin to enum
ALTER TYPE admin_role ADD VALUE 'master_admin';