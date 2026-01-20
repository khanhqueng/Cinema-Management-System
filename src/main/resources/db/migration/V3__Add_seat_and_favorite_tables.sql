-- Migration V3: Add seat management and favorite movies functionality

-- Create seats table for detailed seat management
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    theater_id BIGINT NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
    row_letter VARCHAR(2) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_theater_row_seat UNIQUE (theater_id, row_letter, seat_number)
);

-- Create seat_bookings table to track individual seat reservations
CREATE TABLE seat_bookings (
    id BIGSERIAL PRIMARY KEY,
    seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    showtime_id BIGINT NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_showtime_seat UNIQUE (showtime_id, seat_id)
);

-- Create favorite_movies table for user's favorite movies
CREATE TABLE favorite_movies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_movie_favorite UNIQUE (user_id, movie_id)
);

-- Create user_genre_preferences table for personalized recommendations
CREATE TABLE user_genre_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre VARCHAR(50) NOT NULL,
    preference_score INTEGER NOT NULL DEFAULT 3 CHECK (preference_score >= 1 AND preference_score <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_user_genre UNIQUE (user_id, genre)
);

-- Create indexes for better performance
CREATE INDEX idx_seats_theater_active ON seats(theater_id, is_active);
CREATE INDEX idx_seat_bookings_showtime ON seat_bookings(showtime_id);
CREATE INDEX idx_seat_bookings_booking ON seat_bookings(booking_id);
CREATE INDEX idx_seat_bookings_status ON seat_bookings(status);
CREATE INDEX idx_favorite_movies_user ON favorite_movies(user_id);
CREATE INDEX idx_favorite_movies_movie ON favorite_movies(movie_id);
CREATE INDEX idx_favorite_movies_added ON favorite_movies(added_at);
CREATE INDEX idx_user_preferences_user ON user_genre_preferences(user_id);
CREATE INDEX idx_user_preferences_genre ON user_genre_preferences(genre);
CREATE INDEX idx_user_preferences_score ON user_genre_preferences(preference_score);

-- Add some sample data for testing (you can remove this in production)
-- This will be handled by the application initialization instead