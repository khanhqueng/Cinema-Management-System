-- Comprehensive demo seed for Cinema Management System (PostgreSQL)
-- Goals:
-- 1) No missing/invalid FK references
-- 2) Covers full demo flow: auth/users, movies, theaters, seats, showtimes, bookings, seat bookings, reviews, favorites, genre prefs
-- 3) AI tables present (pgvector) and vector_store has placeholder vectors for semantic search
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
-- DELETE FROM vector_store;
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
-- Build a reusable valid vector literal: '[0.001,0.002,...]'::vector.

CREATE TEMP TABLE IF NOT EXISTS tmp_seed_vectors(
    id INT PRIMARY KEY,
    embedding_text TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_seed_vectors(id, embedding_text)
SELECT
    1,
    '[' || string_agg(to_char(((g.i % 1000)::numeric / 1000000.0), 'FM0.000000'), ',' ORDER BY g.i) || ']'
FROM generate_series(1, 1536) AS g(i)
ON CONFLICT (id) DO UPDATE SET embedding_text = EXCLUDED.embedding_text;

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
-- 4) Movies
-- ================================
INSERT INTO movies (title, director, genre, description, duration_minutes, release_date, poster_url, price_base, created_at)
VALUES
('Mai', 'Trấn Thành', 'COMEDY', 'Câu chuyện về một cô gái trẻ tìm kiếm ý nghĩa cuộc sống qua những cuộc phiêu lưu đầy tiếng cười và cảm động.', 131, DATE '2024-02-10', 'https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg', 150000::DECIMAL(10,2), NOW()),
('Godzilla x Kong: The New Empire', 'Adam Wingard', 'ACTION', 'The epic battle continues as Godzilla and Kong face their greatest threat yet in this spectacular monster showdown.', 115, DATE '2024-03-29', 'https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg', 180000::DECIMAL(10,2), NOW()),
('Dune: Part Two', 'Denis Villeneuve', 'SCI_FI', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', 166, DATE '2024-03-01', 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 200000::DECIMAL(10,2), NOW()),
('Cô Dâu Hào Môn', 'Vũ Ngọc Đãng', 'ROMANTIC', 'Câu chuyện tình yêu phức tạp giữa cô gái nghèo và thiếu gia nhà giàu với những bí mật gia đình đen tối.', 114, DATE '2024-01-12', 'https://cdn.galaxycine.vn/media/2024/10/18/co-dau-hao-mon-500_1729221052856.jpg', 140000::DECIMAL(10,2), NOW()),
('Oppenheimer', 'Christopher Nolan', 'DRAMA', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 180, DATE '2023-07-21', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 190000::DECIMAL(10,2), NOW()),
('Spider-Man: No Way Home', 'Jon Watts', 'ACTION', 'Peter Parker seeks help from Doctor Strange when his secret identity is revealed, opening the multiverse.', 148, DATE '2021-12-17', 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', 170000::DECIMAL(10,2), NOW()),
('Lật Mặt 6: Tấm Vé Định Mệnh', 'Lý Hải', 'ACTION', 'Cuộc đua sinh tử đầy kịch tính với những pha hành động mãn nhãn và tình tiết bất ngờ.', 138, DATE '2023-04-28', 'https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg', 160000::DECIMAL(10,2), NOW()),
('Avatar: The Way of Water', 'James Cameron', 'SCI_FI', 'Jake Sully and his family face new threats as they explore the underwater world of Pandora.', 192, DATE '2022-12-16', 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 220000::DECIMAL(10,2), NOW()),
('Top Gun: Maverick', 'Joseph Kosinski', 'ACTION', 'After thirty years, Maverick faces his past while training a new generation of Navy pilots.', 130, DATE '2022-05-27', 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', 175000::DECIMAL(10,2), NOW()),
('Nhà Bà Nữ', 'Trấn Thành', 'COMEDY', 'Hài kịch gia đình về những tình huống dở khóc dở cười trong một gia đình đa thế hệ.', 108, DATE '2023-10-20', 'https://upload.wikimedia.org/wikipedia/vi/thumb/6/6f/%C3%81p_ph%C3%ADch_phim_Nh%C3%A0_b%C3%A0_N%E1%BB%AF.jpg/250px-%C3%81p_ph%C3%ADch_phim_Nh%C3%A0_b%C3%A0_N%E1%BB%AF.jpg', 140000::DECIMAL(10,2), NOW()),
('John Wick: Chapter 4', 'Chad Stahelski', 'ACTION', 'John Wick faces his most deadly adversaries yet as he seeks freedom from the High Table.', 169, DATE '2023-03-24', 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg', 180000::DECIMAL(10,2), NOW()),
('Fast X', 'Louis Leterrier', 'ACTION', 'Dom Toretto faces a new threat that puts his entire family in danger in this explosive sequel.', 141, DATE '2023-05-19', 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg', 170000::DECIMAL(10,2), NOW()),
('Barbie', 'Greta Gerwig', 'COMEDY', 'Barbie and Ken embark on a journey of self-discovery in this colorful and humorous adventure.', 114, DATE '2023-07-21', 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 160000::DECIMAL(10,2), NOW()),
('Guardians of the Galaxy Vol. 3', 'James Gunn', 'SCI_FI', 'The Guardians face their final mission together as they protect the galaxy one last time.', 150, DATE '2023-05-05', 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg', 180000::DECIMAL(10,2), NOW()),
('Indiana Jones 5', 'James Mangold', 'ADVENTURE', 'Indiana Jones returns for one final adventure across time and space.', 154, DATE '2023-06-30', 'https://image.tmdb.org/t/p/w500/Af4bXE63pVsb2FtbW8uYIyPBadD.jpg', 190000::DECIMAL(10,2), NOW()),
('Transformers: Rise of the Beasts', 'Steven Caple Jr.', 'ACTION', 'The Autobots team up with the Maximals to face a new threat to Earth.', 127, DATE '2023-06-09', 'https://image.tmdb.org/t/p/w500/gPbM0MK8CP8A174rmUwGsADNYKD.jpg', 170000::DECIMAL(10,2), NOW()),
('Scream VI', 'Matt Bettinelli-Olpin', 'HORROR', 'Ghostface returns to terrorize a new generation in New York City.', 122, DATE '2023-03-10', 'https://image.tmdb.org/t/p/w500/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg', 150000::DECIMAL(10,2), NOW()),
('Evil Dead Rise', 'Lee Cronin', 'HORROR', 'A twisted tale of two estranged sisters whose reunion is cut short by demonic possession.', 96, DATE '2023-04-21', 'https://image.tmdb.org/t/p/w500/5ik4ATKmNtmJU6AYD0bLm56BCVM.jpg', 140000::DECIMAL(10,2), NOW()),
('The Super Mario Bros. Movie', 'Aaron Horvath', 'ANIMATION', 'Mario and Luigi embark on an adventure through the Mushroom Kingdom.', 92, DATE '2023-04-05', 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg', 130000::DECIMAL(10,2), NOW()),
('Cocaine Bear', 'Elizabeth Banks', 'COMEDY', 'A wild bear gets into cocaine and goes on a rampage in this darkly comedic thriller.', 95, DATE '2023-02-24', 'https://image.tmdb.org/t/p/w500/gOnmaxHo0412UVr1QM5Nekv1xPi.jpg', 120000::DECIMAL(10,2), NOW()),
('Ant-Man and the Wasp: Quantumania', 'Peyton Reed', 'SCI_FI', 'Scott Lang and Hope van Dyne explore the Quantum Realm with unexpected consequences.', 124, DATE '2023-02-17', 'https://image.tmdb.org/t/p/w500/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg', 160000::DECIMAL(10,2), NOW()),
('Creed III', 'Michael B. Jordan', 'DRAMA', 'Adonis Creed faces his toughest opponent yet - someone from his past.', 116, DATE '2023-03-03', 'https://image.tmdb.org/t/p/w500/cvsXj3I9Q2iyyIo95AecSd1tad7.jpg', 150000::DECIMAL(10,2), NOW()),
('Shazam! Fury of the Gods', 'David F. Sandberg', 'ACTION', 'Billy Batson and his foster siblings face the Daughters of Atlas.', 130, DATE '2023-03-17', 'https://image.tmdb.org/t/p/w500/2VK4d3mqqTc7LVZLnLPeRiPaJ71.jpg', 160000::DECIMAL(10,2), NOW()),
('The Flash', 'Andy Muschietti', 'ACTION', 'Barry Allen uses his superpowers to travel back in time and change events of the past.', 144, DATE '2023-06-16', 'https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', 170000::DECIMAL(10,2), NOW()),
('Spider-Man: Across the Spider-Verse', 'Joaquim Dos Santos', 'ANIMATION', 'Miles Morales catapults across the Multiverse to join forces with Spider-People.', 140, DATE '2023-06-02', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 180000::DECIMAL(10,2), NOW()),
('M3GAN', 'Gerard Johnstone', 'HORROR', 'A robotics engineer creates a lifelike doll programmed to be a child''s greatest companion.', 102, DATE '2023-01-06', 'https://image.tmdb.org/t/p/w500/xYLBgw7dHyEqmcrSk2Sq3asuSq5.jpg', 140000::DECIMAL(10,2), NOW()),
('Avatar', 'James Cameron', 'SCI_FI', 'A paraplegic Marine dispatched to Pandora becomes torn between duty and the alien world.', 162, DATE '2009-12-18', 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', 200000::DECIMAL(10,2), NOW()),
('Titanic', 'James Cameron', 'ROMANTIC', 'A love story aboard the ill-fated maiden voyage of the RMS Titanic.', 194, DATE '1997-12-19', 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 180000::DECIMAL(10,2), NOW()),
('The Dark Knight', 'Christopher Nolan', 'ACTION', 'Batman faces his greatest psychological and physical tests in this epic crime saga.', 152, DATE '2008-07-18', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 190000::DECIMAL(10,2), NOW()),
('Interstellar', 'Christopher Nolan', 'SCI_FI', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 169, DATE '2014-11-07', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 185000::DECIMAL(10,2), NOW()),
('Tee Yod: Quỷ Ăn Tạng', 'Taweewat Wantha', 'HORROR', 'Câu chuyện kinh dị về linh hồn báo thù trong ngôi đền cổ ở Thái Lan.', 111, DATE '2023-10-12', 'https://image.tmdb.org/t/p/w500/7bWxAsNPv9CXHOhZbJVlj2KxgfP.jpg', 130000::DECIMAL(10,2), NOW()),
('Người Vợ Cuối Cùng', 'Victor Vũ', 'THRILLER', 'Bí ẩn về người phụ nữ biến mất và những sự thật đen tối được hé lộ.', 105, DATE '2023-12-22', 'https://image.tmdb.org/t/p/w500/aWPhMZ0P2DyfWB7k5NXhGHSZHGC.jpg', 140000::DECIMAL(10,2), NOW()),
('Deadpool & Wolverine', 'Shawn Levy', 'ACTION', 'Wade Wilson returns with his signature humor and violence alongside Wolverine in the MCU.', 128, DATE '2024-07-26', 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', 200000::DECIMAL(10,2), NOW()),
('Wonka', 'Paul King', 'FAMILY', 'The origin story of Willy Wonka and his magical chocolate factory.', 116, DATE '2023-12-15', 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg', 150000::DECIMAL(10,2), NOW()),
('Napoleon', 'Ridley Scott', 'DRAMA', 'A personal look at the French Emperor''s origins and swift rise to power.', 158, DATE '2023-11-22', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Napoleon_Film_poster.jpg', 180000::DECIMAL(10,2), NOW()),
('The Hunger Games: The Ballad of Songbirds & Snakes', 'Francis Lawrence', 'ACTION', 'The story of Coriolanus Snow before he became the tyrannical President.', 157, DATE '2023-11-17', 'https://image.tmdb.org/t/p/w500/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg', 170000::DECIMAL(10,2), NOW()),
('Mission: Impossible – Dead Reckoning', 'Christopher McQuarrie', 'ACTION', 'Ethan Hunt faces his most dangerous mission yet against a mysterious enemy.', 163, DATE '2023-07-12', 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg', 190000::DECIMAL(10,2), NOW()),
('The Little Mermaid', 'Rob Marshall', 'FAMILY', 'The beloved Disney classic comes to life in this live-action adaptation.', 135, DATE '2023-05-26', 'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg', 160000::DECIMAL(10,2), NOW()),
('Elemental', 'Peter Sohn', 'ANIMATION', 'In a city where fire, water, land, and air residents live together.', 101, DATE '2023-06-16', 'https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg', 140000::DECIMAL(10,2), NOW()),
('The Nun II', 'Michael Chaves', 'HORROR', 'The demonic nun Valak returns to spread terror in 1956 France.', 110, DATE '2023-09-08', 'https://image.tmdb.org/t/p/w500/5gzzkR7y3hnY8AD1wXjCnVlHba5.jpg', 150000::DECIMAL(10,2), NOW()),
('Killers of the Flower Moon', 'Martin Scorsese', 'CRIME', 'Members of the Osage tribe are murdered under mysterious circumstances.', 206, DATE '2023-10-20', 'https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg', 200000::DECIMAL(10,2), NOW()),
('The Exorcist: Believer', 'David Gordon Green', 'HORROR', 'When two girls disappear into the woods and return with no memory of what happened.', 111, DATE '2023-10-06', 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/ExorcistBelieverPoster.jpg/250px-ExorcistBelieverPoster.jpg', 150000::DECIMAL(10,2), NOW()),
('A Haunting in Venice', 'Kenneth Branagh', 'THRILLER', 'Hercule Poirot investigates a supernatural mystery in post-war Venice.', 103, DATE '2023-09-15', 'https://image.tmdb.org/t/p/w500/1Xgjl22MkAZQUavvOeBqRehrvqO.jpg', 140000::DECIMAL(10,2), NOW()),
('Saw X', 'Kevin Greutert', 'HORROR', 'John Kramer returns for another twisted game of survival.', 118, DATE '2023-09-29', 'https://image.tmdb.org/t/p/w500/aQPeznSu7XDTrrdCtT5eLiu52Yu.jpg', 160000::DECIMAL(10,2), NOW()),
('The Creator', 'Gareth Edwards', 'SCI_FI', 'A former soldier hunts for the mysterious architect of advanced AI.', 133, DATE '2023-09-29', 'https://image.tmdb.org/t/p/w500/vBZ0qvaRxqEhZwl6LWmruJqWE8Z.jpg', 170000::DECIMAL(10,2), NOW()),
('PAW Patrol: The Mighty Movie', 'Cal Brunker', 'FAMILY', 'The PAW Patrol pups gain superpowers after a meteor crashes into Adventure City.', 88, DATE '2023-09-29', 'https://image.tmdb.org/t/p/w500/aTvePCU7exLepwg5hWySjwxojQK.jpg', 120000::DECIMAL(10,2), NOW()),
('The Equalizer 3', 'Antoine Fuqua', 'ACTION', 'Robert McCall finds himself at home in Southern Italy but discovers his new friends are under attack.', 109, DATE '2023-09-01', 'https://upload.wikimedia.org/wikipedia/en/e/e1/The_Equalizer_3_poster.jpg', 160000::DECIMAL(10,2), NOW()),
('Expend4bles', 'Scott Waugh', 'ACTION', 'The Expendables face their most formidable opponent yet.', 103, DATE '2023-09-22', 'https://image.tmdb.org/t/p/w500/iwsMu0ehRPbtaSxqiaUDQB9qMWT.jpg', 150000::DECIMAL(10,2), NOW()),
('Blue Beetle', 'Angel Manuel Soto', 'ACTION', 'A Mexican-American teenager finds an alien scarab that gives him incredible powers.', 127, DATE '2023-08-18', 'https://upload.wikimedia.org/wikipedia/vi/c/c1/Blue_Beetle_poster.jpg', 170000::DECIMAL(10,2), NOW()),
('Gran Turismo', 'Neill Blomkamp', 'DRAMA', 'Based on the true story of a Gran Turismo player who became a professional race car driver.', 134, DATE '2023-08-25', 'https://image.tmdb.org/t/p/w500/51tqzRtKMMZEYUpSYkrUE7v9ehm.jpg', 160000::DECIMAL(10,2), NOW()),
('Venom: The Last Dance', 'Kelly Marcel', 'ACTION', 'Eddie and Venom are on the run in the final chapter of their symbiotic story.', 120, DATE '2024-10-25', 'https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg', 140000::DECIMAL(10,2), NOW()),
('Wicked', 'Jon M. Chu', 'FAMILY', 'The untold story of the witches of Oz, focusing on Elphaba before she became the Wicked Witch.', 160, DATE '2024-11-22', 'https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg', 130000::DECIMAL(10,2), NOW());

-- Seed placeholder movie vectors in Spring AI vector_store
-- INSERT INTO vector_store (content, metadata, embedding)
-- SELECT
--     CONCAT(
--         'Title: ', m.title,
--         '. Description: ', COALESCE(m.description, ''),
--         '. Genre: ', COALESCE(m.genre, ''),
--         '. Director: ', COALESCE(m.director, '')
--     ),
--     json_build_object('movieId', m.id::text),
--     ((SELECT embedding_text FROM tmp_seed_vectors WHERE id = 1))::vector(1536)
-- FROM movies m;

-- -- AI metadata for those movies
-- INSERT INTO ai_embeddings_metadata(entity_type, entity_id, embedding_model, embedding_generated_at, embedding_status, content_hash, created_at, updated_at)
-- SELECT 'MOVIE', id, 'seed-placeholder', NOW(), 'GENERATED', NULL, NOW(), NOW()
-- FROM movies;

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
INSERT INTO seats(theater_id, row_letter, seat_number, seat_type, is_active, created_at)
SELECT
    t.id,
    chr(ascii('A') + r.row_idx - 1) AS row_letter,
    s.seat_number,
    CASE
        WHEN t.theater_type = 'VIP'
             AND chr(ascii('A') + r.row_idx - 1) IN ('B', 'C')
             AND s.seat_number IN (3, 4, 7, 8) THEN 'COUPLE'
        WHEN chr(ascii('A') + r.row_idx - 1) = 'A'
             AND s.seat_number IN (1, 2, cfg.max_seats - 1, cfg.max_seats) THEN 'WHEELCHAIR'
        WHEN t.theater_type = 'VIP' THEN 'VIP'
        ELSE 'STANDARD'
    END,
    true,
    NOW()
FROM theaters t
CROSS JOIN LATERAL (
    SELECT
        CASE WHEN t.theater_type = 'VIP' THEN 6 ELSE 10 END AS max_rows,
        CASE WHEN t.theater_type = 'VIP' THEN 10 ELSE 15 END AS max_seats
) cfg
CROSS JOIN LATERAL generate_series(1, cfg.max_rows) AS r(row_idx)
CROSS JOIN LATERAL generate_series(1, cfg.max_seats) AS s(seat_number)
ON CONFLICT (theater_id, row_letter, seat_number) DO NOTHING;

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
