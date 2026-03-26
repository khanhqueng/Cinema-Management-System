-- Comprehensive demo seed for Cinema Management System (PostgreSQL)
-- Goals:
-- 1) No missing/invalid FK references
-- 2) Covers full demo flow: auth/users, movies, theaters, seats, showtimes, bookings, seat bookings, reviews, favorites, genre prefs
-- 3) AI tables present (pgvector) and movies.embedding is non-null (placeholder vectors) to prevent semantic search failures
--
-- NOTE: This seed assumes Flyway migrations V1..V4已 run (tables + pgvector exist).

BEGIN;

-- ================================
-- 0) Clean existing data (FK-safe order)
-- ================================

-- Child tables first
DELETE FROM seat_bookings;
DELETE FROM favorite_movies;
DELETE FROM user_genre_preferences;
DELETE FROM user_preference_vectors;
DELETE FROM ai_embeddings_metadata;
DELETE FROM reviews;
DELETE FROM bookings;
DELETE FROM showtimes;
DELETE FROM seats;
DELETE FROM theaters;
DELETE FROM movies;
DELETE FROM users;

-- ================================
-- 1) Reset sequences (id BIGSERIAL)
-- ================================

ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS movies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS theaters_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS seats_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS showtimes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS seat_bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS favorite_movies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_genre_preferences_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_preference_vectors_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ai_embeddings_metadata_id_seq RESTART WITH 1;

-- booking ref sequence used by trigger
ALTER SEQUENCE IF EXISTS booking_ref_seq RESTART WITH 1000;

-- ================================
-- 2) Helper: deterministic placeholder embedding
-- ================================
-- We store embeddings as pgvector but JPA maps it as String with CAST(? AS vector).
-- So here we generate a valid vector literal: '[0.001,0.002,...]'::vector.

DO $$
DECLARE
    i INT;
    v TEXT;
BEGIN
    -- Create a temp table to store one reusable placeholder vector
    CREATE TEMP TABLE IF NOT EXISTS tmp_seed_vectors(
        id INT PRIMARY KEY,
        embedding_text TEXT NOT NULL
    ) ON COMMIT DROP;

    -- Build a 1536-dim vector (small deterministic numbers)
    v := '[';
    FOR i IN 1..1536 LOOP
        v := v || to_char((i % 1000) / 1000000.0, 'FM0.000000');
        IF i < 1536 THEN
            v := v || ',';
        END IF;
    END LOOP;
    v := v || ']';

    INSERT INTO tmp_seed_vectors(id, embedding_text)
    VALUES (1, v)
    ON CONFLICT (id) DO UPDATE SET embedding_text = EXCLUDED.embedding_text;
END $$;

-- ================================
-- 3) Users (Passwords must be BCrypt for login flow)
-- ================================
-- BCrypt for demo password: "Password@123" (cost 10)
-- If you change this, update any README/demo notes accordingly.
INSERT INTO users (email, password, full_name, role, phone, created_at) VALUES
('admin@cinema.demo', '$2a$10$NvBFcrihzHmHnend7MEoPOUBnod9f5iLWXnUvH9BqTx1/hdhFFvIy', 'Demo Admin', 'ADMIN', '0900000000', NOW()),
('user1@cinema.demo', '$2a$10$NvBFcrihzHmHnend7MEoPOUBnod9f5iLWXnUvH9BqTx1/hdhFFvIy', 'Nguyễn Văn A', 'USER', '0900000001', NOW()),
('user2@cinema.demo', '$2a$10$NvBFcrihzHmHnend7MEoPOUBnod9f5iLWXnUvH9BqTx1/hdhFFvIy', 'Trần Thị B', 'USER', '0900000002', NOW());

-- ================================
-- 4) Movies (include embedding)
-- ================================
INSERT INTO movies (title, director, genre, description, duration_minutes, release_date, poster_url, price_base, created_at, embedding)
SELECT m.title, m.director, m.genre, m.description, m.duration_minutes, m.release_date, m.poster_url, m.price_base, m.created_at,
       ((SELECT embedding_text FROM tmp_seed_vectors WHERE id = 1))::vector(1536)
FROM (
    VALUES
    ('Mai', 'Tran Thanh', 'COMEDY', 'Câu chuyện về một cô gái trẻ đi tìm ý nghĩa cuộc sống.', 131, DATE '2024-02-10', 'https://upload.wikimedia.org/wikipedia/vi/thumb/3/36/Mai_2024_poster.jpg/250px-Mai_2024_poster.jpg', 150000::DECIMAL(10,2), NOW()),
    ('Godzilla x Kong: The New Empire', 'Adam Wingard', 'ACTION', 'Godzilla và Kong đối đầu với mối đe doạ mới.', 115, DATE '2024-03-29', 'https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg', 180000::DECIMAL(10,2), NOW()),
    ('Dune: Part Two', 'Denis Villeneuve', 'SCI_FI', 'Paul Atreides liên minh cùng người Fremen để trả thù.', 166, DATE '2024-03-01', 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 200000::DECIMAL(10,2), NOW()),
    ('Oppenheimer', 'Christopher Nolan', 'DRAMA', 'Câu chuyện về J. Robert Oppenheimer và dự án chế tạo bom nguyên tử.', 180, DATE '2023-07-21', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 190000::DECIMAL(10,2), NOW()),
    ('Avatar: The Way of Water', 'James Cameron', 'SCI_FI', 'Gia đình Sully đối mặt với các mối đe doạ mới khi khám phá thế giới đại dương Pandora.', 192, DATE '2022-12-16', 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 220000::DECIMAL(10,2), NOW()),
    ('Top Gun: Maverick', 'Joseph Kosinski', 'ACTION', 'Sau 30 năm, Maverick huấn luyện thế hệ phi công mới và đối diện quá khứ.', 130, DATE '2022-05-27', 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', 175000::DECIMAL(10,2), NOW()),
    ('Barbie', 'Greta Gerwig', 'COMEDY', 'Barbie và Ken bắt đầu hành trình khám phá bản thân trong thế giới thực.', 114, DATE '2023-07-21', 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 160000::DECIMAL(10,2), NOW()),
    ('Interstellar', 'Christopher Nolan', 'SCI_FI', 'Một nhóm nhà thám hiểm du hành qua hố sâu không gian để cứu lấy nhân loại.', 169, DATE '2014-11-07', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 185000::DECIMAL(10,2), NOW()),
    ('The Dark Knight', 'Christopher Nolan', 'ACTION', 'Batman đối đầu Joker trong cuộc chiến vì linh hồn của Gotham.', 152, DATE '2008-07-18', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 190000::DECIMAL(10,2), NOW()),
    ('Scream VI', 'Matt Bettinelli-Olpin', 'HORROR', 'Ghostface trở lại gieo rắc nỗi kinh hoàng giữa lòng New York.', 122, DATE '2023-03-10', 'https://image.tmdb.org/t/p/w500/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg', 150000::DECIMAL(10,2), NOW())
) AS m(title, director, genre, description, duration_minutes, release_date, poster_url, price_base, created_at);

-- AI metadata for those movies
INSERT INTO ai_embeddings_metadata(entity_type, entity_id, embedding_model, embedding_generated_at, embedding_status, content_hash, created_at, updated_at)
SELECT 'MOVIE', id, 'seed-placeholder', NOW(), 'GENERATED', NULL, NOW(), NOW()
FROM movies;

-- ================================
-- 5) Theaters
-- ================================
INSERT INTO theaters (name, capacity, theater_type, created_at) VALUES
('Regal Cinema 1', 150, 'STANDARD', NOW()),
('VIP Lounge Theater', 60, 'VIP', NOW()),
('Premium Theater Hall', 280, 'STANDARD', NOW()),
('Galaxy Cinema 2', 140, 'STANDARD', NOW()),
('Premium VIP Suite', 45, 'VIP', NOW());

-- ================================
-- 6) Seats (generate for all theaters)
-- ================================
-- For demo: generate rows A-J, seat 1-15 for STANDARD theaters; A-F, 1-10 for VIP.
DO $$
DECLARE
    t RECORD;
    r TEXT;
    s INT;
    max_rows INT;
    max_seats INT;
    row_idx INT;
BEGIN
    FOR t IN SELECT id, theater_type FROM theaters ORDER BY id LOOP
        IF t.theater_type = 'VIP' THEN
            max_rows := 6;
            max_seats := 10;
        ELSE
            max_rows := 10;
            max_seats := 15;
        END IF;

        FOR row_idx IN 1..max_rows LOOP
            r := chr(ascii('A') + row_idx - 1);
            FOR s IN 1..max_seats LOOP
                INSERT INTO seats(theater_id, row_letter, seat_number, seat_type, is_active, created_at)
                VALUES (t.id, r, s,
                        CASE
                            WHEN t.theater_type = 'VIP' AND r IN ('B','C') AND s IN (3,4,7,8) THEN 'COUPLE'
                            WHEN r = 'A' AND s IN (1,2,max_seats-1,max_seats) THEN 'WHEELCHAIR'
                            WHEN t.theater_type = 'VIP' THEN 'VIP'
                            ELSE 'STANDARD'
                        END,
                        true,
                        NOW())
                ON CONFLICT (theater_id, row_letter, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ================================
-- 7) Showtimes (next 7 days, all theaters)
-- ================================
-- Create a dense enough schedule for browsing + booking.
INSERT INTO showtimes (movie_id, theater_id, show_datetime, price, available_seats, created_at)
SELECT
    m.id as movie_id,
    t.id as theater_id,
    (CURRENT_DATE + make_interval(days => d.day_offset) + ts.show_time)::timestamp as show_datetime,
    (m.price_base + CASE WHEN t.theater_type = 'VIP' THEN 50000 ELSE 0 END)::DECIMAL(10,2) as price,
    t.capacity as available_seats,
    NOW()
FROM movies m
CROSS JOIN theaters t
CROSS JOIN (
    VALUES (0), (1), (2), (3), (4), (5), (6)
) d(day_offset)
CROSS JOIN (
    VALUES (TIME '10:00'), (TIME '13:30'), (TIME '19:30')
) ts(show_time)
; -- all movies get showtimes

-- ================================
-- 8) Reviews (to support top-rated tier)
-- ================================
INSERT INTO reviews(movie_id, user_id, rating, review_text, created_at) VALUES
(1, 2, 5, 'Rat hay va cam dong.', NOW()),
(2, 2, 4, 'Hanh dong hoanh trang.', NOW()),
(3, 3, 5, 'Xuat sac, hinh anh dep.', NOW()),
(4, 3, 4, 'Noi dung tot.', NOW()),
(8, 2, 5, 'Mot trong nhung phim hay nhat.', NOW());

-- ================================
-- 9) Favorites + genre preferences (progressive profiling)
-- ================================
INSERT INTO favorite_movies(user_id, movie_id, added_at) VALUES
(2, 3, NOW()),
(2, 8, NOW()),
(3, 2, NOW()),
(3, 9, NOW());

INSERT INTO user_genre_preferences(user_id, genre, preference_score, created_at, updated_at) VALUES
(2, 'SCI_FI', 5, NOW(), NOW()),
(2, 'ACTION', 4, NOW(), NOW()),
(3, 'ACTION', 5, NOW(), NOW()),
(3, 'COMEDY', 4, NOW(), NOW());

-- Create a placeholder preference vector per user
INSERT INTO user_preference_vectors(user_id, preference_vector, last_updated, genre_weights, created_at)
SELECT u.id,
       ((SELECT embedding_text FROM tmp_seed_vectors WHERE id = 1))::vector(1536),
       NOW(),
       jsonb_build_object('seed','true'),
       NOW()
FROM users u
WHERE u.role = 'USER';

-- ================================
-- 10) Bookings + seat_bookings (full booking flow demo)
-- ================================
-- Pick a showtime that exists (movie 1 in theater 1 today 10:00)
WITH st AS (
    SELECT id, theater_id
    FROM showtimes
    WHERE movie_id = 1 AND theater_id = 1
    ORDER BY show_datetime
    LIMIT 1
), b AS (
    INSERT INTO bookings(user_id, showtime_id, seats_booked, total_amount, booking_status, booking_reference, created_at)
    SELECT 2,
           st.id,
           2,
           (SELECT price FROM showtimes WHERE id = st.id) * 2,
           'CONFIRMED',
           -- trigger would generate, but column is NOT NULL; provide stable value for seed
           'BK00001000',
           NOW()
    FROM st
    RETURNING id AS booking_id, showtime_id
)
INSERT INTO seat_bookings(seat_id, showtime_id, booking_id, status, created_at, updated_at)
SELECT s.id, b.showtime_id, b.booking_id, 'RESERVED', NOW(), NOW()
FROM b
JOIN st ON st.id = b.showtime_id
JOIN LATERAL (
    SELECT id
    FROM seats
    WHERE theater_id = st.theater_id AND is_active = true
    ORDER BY row_letter, seat_number
    LIMIT 2
) s ON true;

COMMIT;

SELECT 'CINEMA MOCK DATA CREATION COMPLETED' as status;
