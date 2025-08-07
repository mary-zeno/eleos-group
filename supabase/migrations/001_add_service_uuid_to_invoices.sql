-- Add request_id column to invoices table to link invoices to specific requests
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS request_id UUID;

-- Create index on request_id for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_request_id ON invoices(request_id);

-- Create composite index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_service_request ON invoices(user_id, service_type, request_id);
