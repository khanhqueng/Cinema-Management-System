-- V2__insert_sample_data.sql
-- Sample data for development and testing

-- =================================
-- SAMPLE USERS (passwords = 'password')
-- =================================
INSERT INTO users (email, password, full_name, role, phone) VALUES
('admin@cinema.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cinema Admin', 'ADMIN', '0123456789'),
('john@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'USER', '0123456788'),
('jane@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'USER', '0123456787');

-- =================================
-- SAMPLE THEATERS
-- =================================
INSERT INTO theaters (name, capacity, theater_type) VALUES
('Theater A', 100, 'STANDARD'),
('Theater B', 80, 'STANDARD'),
('VIP Theater', 50, 'VIP');

-- =================================
-- SAMPLE MOVIES
-- =================================
INSERT INTO movies (title, description, genre, director, duration_minutes, release_date, poster_url, price_base) VALUES
('Spider-Man: No Way Home',
 'Peter Parker seeks help from Doctor Strange when his secret identity is revealed.',
 'Action', 'Jon Watts', 148, '2021-12-17',
 'https://via.placeholder.com/300x450/FF0000/FFFFFF?text=Spider-Man', 120000),

('The Batman',
 'Batman ventures into Gotham City''s underworld when a sadistic killer leaves behind a trail of cryptic clues.',
 'Action', 'Matt Reeves', 176, '2022-03-04',
 'https://via.placeholder.com/300x450/000000/FFFFFF?text=Batman', 130000),

('Dune',
 'Feature adaptation of Frank Herbert''s science fiction novel about a duke''s son on the desert planet.',
 'Sci-Fi', 'Denis Villeneuve', 155, '2021-10-22',
 'https://via.placeholder.com/300x450/8B4513/FFFFFF?text=Dune', 110000),

('Top Gun: Maverick',
 'After more than thirty years of service, Pete "Maverick" Mitchell is where he belongs.',
 'Action', 'Joseph Kosinski', 130, '2022-05-27',
 'https://via.placeholder.com/300x450/4169E1/FFFFFF?text=Top+Gun', 125000);

-- =================================
-- SAMPLE SHOWTIMES (Next 3 days)
-- =================================
INSERT INTO showtimes (movie_id, theater_id, show_datetime, price, available_seats)
SELECT
    m.id,
    t.id,
    (CURRENT_DATE + (day_offset || ' days')::INTERVAL + (hour_offset || ' hours')::INTERVAL)::TIMESTAMP,
    CASE
        WHEN t.theater_type = 'VIP' THEN m.price_base * 1.5
        ELSE m.price_base
    END,
    t.capacity
FROM movies m
CROSS JOIN theaters t
CROSS JOIN (VALUES (0, 10), (0, 14), (0, 18), (0, 21),
                   (1, 10), (1, 14), (1, 18), (1, 21),
                   (2, 10), (2, 14), (2, 18), (2, 21)) AS times(day_offset, hour_offset)
WHERE m.id <= 2; -- Only first 2 movies for simplicity

-- =================================
-- SAMPLE BOOKINGS
-- =================================
INSERT INTO bookings (user_id, showtime_id, seats_booked, total_amount, booking_status)
SELECT
    2, -- John Doe
    st.id,
    2, -- 2 seats
    st.price * 2,
    'CONFIRMED'
FROM showtimes st
WHERE st.id = (SELECT MIN(id) FROM showtimes);

INSERT INTO bookings (user_id, showtime_id, seats_booked, total_amount, booking_status)
SELECT
    3, -- Jane Smith
    st.id,
    1, -- 1 seat
    st.price * 1,
    'CONFIRMED'
FROM showtimes st
WHERE st.id = (SELECT MIN(id) + 1 FROM showtimes);

-- =================================
-- SAMPLE REVIEWS
-- =================================
INSERT INTO reviews (movie_id, user_id, rating, review_text) VALUES
(1, 2, 5, 'Amazing movie! The action sequences were incredible and the story was very engaging.'),
(1, 3, 4, 'Great movie overall, though it felt a bit long. Definitely worth watching!'),
(2, 2, 4, 'Solid Batman movie with great cinematography. Robert Pattinson did a good job.');