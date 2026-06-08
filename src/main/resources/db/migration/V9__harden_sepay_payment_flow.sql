ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);

ALTER TABLE seat_bookings
    DROP CONSTRAINT IF EXISTS uk_showtime_seat;

CREATE UNIQUE INDEX IF NOT EXISTS uk_showtime_seat_reserved
    ON seat_bookings(showtime_id, seat_id)
    WHERE status = 'RESERVED';
