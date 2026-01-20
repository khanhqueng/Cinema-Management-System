-- V1__create_core_schema.sql
-- Core schema for Cinema Management System - University Project
-- Focus: Authentication + CRUD + Basic Booking

-- =================================
-- USERS - Authentication & Authorization
-- =================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- BCrypt encoded
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER', -- USER, ADMIN
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- MOVIES - Content Management
-- =================================
CREATE TABLE movies (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(50),
    director VARCHAR(100),
    duration_minutes INTEGER NOT NULL,
    release_date DATE,
    poster_url VARCHAR(500),
    price_base DECIMAL(10,2) NOT NULL DEFAULT 100000, -- Base ticket price
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- THEATERS - Venue Management
-- =================================
CREATE TABLE theaters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL, -- Total seats
    theater_type VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, VIP
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- SHOWTIMES - Schedule Management
-- =================================
CREATE TABLE showtimes (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL REFERENCES movies(id),
    theater_id BIGINT NOT NULL REFERENCES theaters(id),
    show_datetime TIMESTAMP NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL, -- Track availability simply
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- BOOKINGS - Core Business Logic
-- =================================
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    showtime_id BIGINT NOT NULL REFERENCES showtimes(id),
    seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'CONFIRMED', -- CONFIRMED, CANCELLED
    booking_reference VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- REVIEWS - User Feedback (Simple)
-- =================================
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL REFERENCES movies(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(movie_id, user_id) -- One review per user per movie
);

-- =================================
-- ESSENTIAL INDEXES
-- =================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX idx_showtimes_datetime ON showtimes(show_datetime);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);

-- =================================
-- TRIGGERS & FUNCTIONS
-- =================================

-- Auto-generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS VARCHAR(10) AS $$
DECLARE
    ref VARCHAR(10);
BEGIN
    ref := 'BK' || LPAD(nextval('booking_ref_seq')::TEXT, 8, '0');
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for booking references
CREATE SEQUENCE booking_ref_seq START 1000;

-- Trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference := generate_booking_reference();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_booking_reference
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_reference();

-- Function to update available seats after booking
CREATE OR REPLACE FUNCTION update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease available seats when booking is made
        UPDATE showtimes
        SET available_seats = available_seats - NEW.seats_booked
        WHERE id = NEW.showtime_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Increase available seats when booking is cancelled
        UPDATE showtimes
        SET available_seats = available_seats + OLD.seats_booked
        WHERE id = OLD.showtime_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seats
    AFTER INSERT OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_available_seats();