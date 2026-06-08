-- Migration: Store ZaloPay checkout URL for idempotent retries

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(1024);
