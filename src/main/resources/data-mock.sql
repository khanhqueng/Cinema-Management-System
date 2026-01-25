-- Clear existing data first
DELETE FROM bookings;
DELETE FROM showtimes;
DELETE FROM seats;
DELETE FROM theaters;
DELETE FROM movies;

-- Reset sequences for PostgreSQL (equivalent to AUTO_INCREMENT)
ALTER SEQUENCE IF EXISTS movies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS theaters_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS showtimes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS seats_id_seq RESTART WITH 1;

-- Insert Movies with real poster URLs
INSERT INTO movies (title, director, genre, description, duration_minutes, release_date, poster_url, price_base, created_at) VALUES
('Mai', 'Trấn Thành', 'COMEDY', 'Câu chuyện về một cô gái trẻ tìm kiếm ý nghĩa cuộc sống qua những cuộc phiêu lưu đầy tiếng cười và cảm động.', 131, '2024-02-10', 'https://image.tmdb.org/t/p/w500/yPqy6wlZGvdSiYw2LiLG4pGNVFO.jpg', 150000, NOW()),
('Godzilla x Kong: The New Empire', 'Adam Wingard', 'ACTION', 'The epic battle continues as Godzilla and Kong face their greatest threat yet in this spectacular monster showdown.', 115, '2024-03-29', 'https://image.tmdb.org/t/p/w500/gmIjqb3QXI0M5lBBHH9gGHcgRbc.jpg', 180000, NOW()),
('Dune: Part Two', 'Denis Villeneuve', 'SCI_FI', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', 166, '2024-03-01', 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 200000, NOW()),
('Cô Dâu Hào Môn', 'Vũ Ngọc Đãng', 'ROMANTIC', 'Câu chuyện tình yêu phức tạp giữa cô gái nghèo và thiếu gia nhà giàu với những bí mật gia đình đen tối.', 114, '2024-01-12', 'https://image.tmdb.org/t/p/w500/3jYQZQGKIv6X2WXwT9FtgLRO0LO.jpg', 140000, NOW()),
('Oppenheimer', 'Christopher Nolan', 'DRAMA', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 180, '2023-07-21', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 190000, NOW()),
('Spider-Man: No Way Home', 'Jon Watts', 'ACTION', 'Peter Parker seeks help from Doctor Strange when his secret identity is revealed, opening the multiverse.', 148, '2021-12-17', 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', 170000, NOW()),
('Lật Mặt 6: Tấm Vé Định Mệnh', 'Lý Hải', 'ACTION', 'Cuộc đua sinh tử đầy kịch tính với những pha hành động mãn nhãn và tình tiết bất ngờ.', 138, '2023-04-28', 'https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg', 160000, NOW()),
('Avatar: The Way of Water', 'James Cameron', 'SCI_FI', 'Jake Sully and his family face new threats as they explore the underwater world of Pandora.', 192, '2022-12-16', 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 220000, NOW()),
('Top Gun: Maverick', 'Joseph Kosinski', 'ACTION', 'After thirty years, Maverick faces his past while training a new generation of Navy pilots.', 130, '2022-05-27', 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', 175000, NOW()),
('Nhà Bà Nữ', 'Trấn Thành', 'COMEDY', 'Hài kịch gia đình về những tình huống dở khóc dở cười trong một gia đình đa thế hệ.', 108, '2023-10-20', 'https://image.tmdb.org/t/p/w500/rV1LQrFrjZgFtT6A7QTfT5S3Q1l.jpg', 140000, NOW()),
('John Wick: Chapter 4', 'Chad Stahelski', 'ACTION', 'John Wick faces his most deadly adversaries yet as he seeks freedom from the High Table.', 169, '2023-03-24', 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg', 180000, NOW()),
('Fast X', 'Louis Leterrier', 'ACTION', 'Dom Toretto faces a new threat that puts his entire family in danger in this explosive sequel.', 141, '2023-05-19', 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg', 170000, NOW()),
('Barbie', 'Greta Gerwig', 'COMEDY', 'Barbie and Ken embark on a journey of self-discovery in this colorful and humorous adventure.', 114, '2023-07-21', 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 160000, NOW()),
('Guardians of the Galaxy Vol. 3', 'James Gunn', 'SCI_FI', 'The Guardians face their final mission together as they protect the galaxy one last time.', 150, '2023-05-05', 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg', 180000, NOW()),
('Indiana Jones 5', 'James Mangold', 'ADVENTURE', 'Indiana Jones returns for one final adventure across time and space.', 154, '2023-06-30', 'https://image.tmdb.org/t/p/w500/Af4bXE63pVsb2FtbW8uYIyPBadD.jpg', 190000, NOW()),
('Transformers: Rise of the Beasts', 'Steven Caple Jr.', 'ACTION', 'The Autobots team up with the Maximals to face a new threat to Earth.', 127, '2023-06-09', 'https://image.tmdb.org/t/p/w500/gPbM0MK8CP8A174rmUwGsADNYKD.jpg', 170000, NOW()),
('Scream VI', 'Matt Bettinelli-Olpin', 'HORROR', 'Ghostface returns to terrorize a new generation in New York City.', 122, '2023-03-10', 'https://image.tmdb.org/t/p/w500/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg', 150000, NOW()),
('Evil Dead Rise', 'Lee Cronin', 'HORROR', 'A twisted tale of two estranged sisters whose reunion is cut short by demonic possession.', 96, '2023-04-21', 'https://image.tmdb.org/t/p/w500/5ik4ATKmNtmJU6AYD0bLm56BCVM.jpg', 140000, NOW()),
('The Super Mario Bros. Movie', 'Aaron Horvath', 'ANIMATION', 'Mario and Luigi embark on an adventure through the Mushroom Kingdom.', 92, '2023-04-05', 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg', 130000, NOW()),
('Cocaine Bear', 'Elizabeth Banks', 'COMEDY', 'A wild bear gets into cocaine and goes on a rampage in this darkly comedic thriller.', 95, '2023-02-24', 'https://image.tmdb.org/t/p/w500/gOnmaxHo0412UVr1QM5Nekv1xPi.jpg', 120000, NOW()),
('Ant-Man and the Wasp: Quantumania', 'Peyton Reed', 'SCI_FI', 'Scott Lang and Hope van Dyne explore the Quantum Realm with unexpected consequences.', 124, '2023-02-17', 'https://image.tmdb.org/t/p/w500/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg', 160000, NOW()),
('Creed III', 'Michael B. Jordan', 'DRAMA', 'Adonis Creed faces his toughest opponent yet - someone from his past.', 116, '2023-03-03', 'https://image.tmdb.org/t/p/w500/cvsXj3I9Q2iyyIo95AecSd1tad7.jpg', 150000, NOW()),
('Shazam! Fury of the Gods', 'David F. Sandberg', 'ACTION', 'Billy Batson and his foster siblings face the Daughters of Atlas.', 130, '2023-03-17', 'https://image.tmdb.org/t/p/w500/2VK4d3mqqTc7LVZLnLPeRiPaJ71.jpg', 160000, NOW()),
('The Flash', 'Andy Muschietti', 'ACTION', 'Barry Allen uses his superpowers to travel back in time and change events of the past.', 144, '2023-06-16', 'https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', 170000, NOW()),
('Spider-Man: Across the Spider-Verse', 'Joaquim Dos Santos', 'ANIMATION', 'Miles Morales catapults across the Multiverse to join forces with Spider-People.', 140, '2023-06-02', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 180000, NOW()),
('M3GAN', 'Gerard Johnstone', 'HORROR', 'A robotics engineer creates a lifelike doll programmed to be a child''s greatest companion.', 102, '2023-01-06', 'https://image.tmdb.org/t/p/w500/xYLBgw7dHyEqmcrSk2Sq3asuSq5.jpg', 140000, NOW()),
('Avatar', 'James Cameron', 'SCI_FI', 'A paraplegic Marine dispatched to Pandora becomes torn between duty and the alien world.', 162, '2009-12-18', 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', 200000, NOW()),
('Titanic', 'James Cameron', 'ROMANTIC', 'A love story aboard the ill-fated maiden voyage of the RMS Titanic.', 194, '1997-12-19', 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 180000, NOW()),
('The Dark Knight', 'Christopher Nolan', 'ACTION', 'Batman faces his greatest psychological and physical tests in this epic crime saga.', 152, '2008-07-18', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 190000, NOW()),
('Interstellar', 'Christopher Nolan', 'SCI_FI', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 169, '2014-11-07', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 185000, NOW()),
('Tee Yod: Quỷ Ăn Tạng', 'Taweewat Wantha', 'HORROR', 'Câu chuyện kinh dị về linh hồn báo thù trong ngôi đền cổ ở Thái Lan.', 111, '2023-10-12', 'https://image.tmdb.org/t/p/w500/7bWxAsNPv9CXHOhZbJVlj2KxgfP.jpg', 130000, NOW()),
('Người Vợ Cuối Cùng', 'Victor Vũ', 'THRILLER', 'Bí ẩn về người phụ nữ biến mất và những sự thật đen tối được hé lộ.', 105, '2023-12-22', 'https://image.tmdb.org/t/p/w500/aWPhMZ0P2DyfWB7k5NXhGHSZHGC.jpg', 140000, NOW()),
('Deadpool & Wolverine', 'Shawn Levy', 'ACTION', 'Wade Wilson returns with his signature humor and violence alongside Wolverine in the MCU.', 128, '2024-07-26', 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', 200000, NOW()),
('Wonka', 'Paul King', 'FAMILY', 'The origin story of Willy Wonka and his magical chocolate factory.', 116, '2023-12-15', 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg', 150000, NOW()),
('Napoleon', 'Ridley Scott', 'DRAMA', 'A personal look at the French Emperor''s origins and swift rise to power.', 158, '2023-11-22', 'https://image.tmdb.org/t/p/w500/vcZlWHW4xTOK0RuHGUJrw5MIshy.jpg', 180000, NOW()),
('The Hunger Games: The Ballad of Songbirds & Snakes', 'Francis Lawrence', 'ACTION', 'The story of Coriolanus Snow before he became the tyrannical President.', 157, '2023-11-17', 'https://image.tmdb.org/t/p/w500/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg', 170000, NOW()),
('Mission: Impossible – Dead Reckoning', 'Christopher McQuarrie', 'ACTION', 'Ethan Hunt faces his most dangerous mission yet against a mysterious enemy.', 163, '2023-07-12', 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg', 190000, NOW()),
('The Little Mermaid', 'Rob Marshall', 'FAMILY', 'The beloved Disney classic comes to life in this live-action adaptation.', 135, '2023-05-26', 'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg', 160000, NOW()),
('Elemental', 'Peter Sohn', 'ANIMATION', 'In a city where fire, water, land, and air residents live together.', 101, '2023-06-16', 'https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg', 140000, NOW()),
('The Nun II', 'Michael Chaves', 'HORROR', 'The demonic nun Valak returns to spread terror in 1956 France.', 110, '2023-09-08', 'https://image.tmdb.org/t/p/w500/5gzzkR7y3hnY8AD1wXjCnVlHba5.jpg', 150000, NOW()),
('Killers of the Flower Moon', 'Martin Scorsese', 'CRIME', 'Members of the Osage tribe are murdered under mysterious circumstances.', 206, '2023-10-20', 'https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg', 200000, NOW()),
('The Exorcist: Believer', 'David Gordon Green', 'HORROR', 'When two girls disappear into the woods and return with no memory of what happened.', 111, '2023-10-06', 'https://image.tmdb.org/t/p/w500/qVKirUdmoex8SdfUk8WDDWwC7jk.jpg', 150000, NOW()),
('A Haunting in Venice', 'Kenneth Branagh', 'THRILLER', 'Hercule Poirot investigates a supernatural mystery in post-war Venice.', 103, '2023-09-15', 'https://image.tmdb.org/t/p/w500/1Xgjl22MkAZQUavvOeBqRehrvqO.jpg', 140000, NOW()),
('Saw X', 'Kevin Greutert', 'HORROR', 'John Kramer returns for another twisted game of survival.', 118, '2023-09-29', 'https://image.tmdb.org/t/p/w500/aQPeznSu7XDTrrdCtT5eLiu52Yu.jpg', 160000, NOW()),
('The Creator', 'Gareth Edwards', 'SCI_FI', 'A former soldier hunts for the mysterious architect of advanced AI.', 133, '2023-09-29', 'https://image.tmdb.org/t/p/w500/vBZ0qvaRxqEhZwl6LWmruJqWE8Z.jpg', 170000, NOW()),
('PAW Patrol: The Mighty Movie', 'Cal Brunker', 'FAMILY', 'The PAW Patrol pups gain superpowers after a meteor crashes into Adventure City.', 88, '2023-09-29', 'https://image.tmdb.org/t/p/w500/aTvePCU7exLepwg5hWySjwxojQK.jpg', 120000, NOW()),
('The Equalizer 3', 'Antoine Fuqua', 'ACTION', 'Robert McCall finds himself at home in Southern Italy but discovers his new friends are under attack.', 109, '2023-09-01', 'https://image.tmdb.org/t/p/w500/b0Ej6fnXAP8fK75hlyi2tsAoCRH.jpg', 160000, NOW()),
('Expend4bles', 'Scott Waugh', 'ACTION', 'The Expendables face their most formidable opponent yet.', 103, '2023-09-22', 'https://image.tmdb.org/t/p/w500/iwsMu0ehRPbtaSxqiaUDQB9qMWT.jpg', 150000, NOW()),
('Blue Beetle', 'Angel Manuel Soto', 'ACTION', 'A Mexican-American teenager finds an alien scarab that gives him incredible powers.', 127, '2023-08-18', 'https://image.tmdb.org/t/p/w500/AfhYDbfZDIyadbBSWOaAajnJEDw.jpg', 170000, NOW()),
('Gran Turismo', 'Neill Blomkamp', 'DRAMA', 'Based on the true story of a Gran Turismo player who became a professional race car driver.', 134, '2023-08-25', 'https://image.tmdb.org/t/p/w500/51tqzRtKMMZEYUpSYkrUE7v9ehm.jpg', 160000, NOW()),
('Venom: The Last Dance', 'Kelly Marcel', 'ACTION', 'Eddie and Venom are on the run in the final chapter of their symbiotic story.', 120, '2024-10-25', 'https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg', 140000, NOW()),
('Wicked', 'Jon M. Chu', 'FAMILY', 'The untold story of the witches of Oz, focusing on Elphaba before she became the Wicked Witch.', 160, '2024-11-22', 'https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg', 130000, NOW());

-- Insert Theaters (only STANDARD and VIP types, no IMAX)
INSERT INTO theaters (name, capacity, theater_type, created_at) VALUES
('Regal Cinema 1', 150, 'STANDARD', NOW()),
('VIP Lounge Theater', 60, 'VIP', NOW()),
('Premium Theater Hall', 280, 'STANDARD', NOW()),
('Galaxy Cinema 2', 140, 'STANDARD', NOW()),
('Premium VIP Suite', 45, 'VIP', NOW()),
('Grand Theater', 320, 'STANDARD', NOW()),
('Century Theater 3', 130, 'STANDARD', NOW()),
('Luxury VIP Room', 55, 'VIP', NOW()),
('Mega Screen Theater', 300, 'STANDARD', NOW()),
('Classic Cinema 4', 120, 'STANDARD', NOW()),
('Elite VIP Theater', 50, 'VIP', NOW()),
('Standard Hall 5', 135, 'STANDARD', NOW()),
('Comfort Zone VIP', 65, 'VIP', NOW()),
('Giant Screen Theater', 290, 'STANDARD', NOW()),
('Community Cinema 6', 110, 'STANDARD', NOW());

-- Insert Seats for each theater (theater_id, row_letter, seat_number, seat_type, is_active, created_at)
-- Theater 1: Regal Cinema 1 (150 seats, STANDARD) - 10 rows x 15 seats
INSERT INTO seats (theater_id, row_letter, seat_number, seat_type, is_active, created_at) VALUES
-- Row A (1-15) - Front row, mix of STANDARD and WHEELCHAIR
(1, 'A', 1, 'WHEELCHAIR', true, NOW()), (1, 'A', 2, 'WHEELCHAIR', true, NOW()), (1, 'A', 3, 'STANDARD', true, NOW()), (1, 'A', 4, 'STANDARD', true, NOW()), (1, 'A', 5, 'STANDARD', true, NOW()),
(1, 'A', 6, 'STANDARD', true, NOW()), (1, 'A', 7, 'STANDARD', true, NOW()), (1, 'A', 8, 'STANDARD', true, NOW()), (1, 'A', 9, 'STANDARD', true, NOW()), (1, 'A', 10, 'STANDARD', true, NOW()),
(1, 'A', 11, 'STANDARD', true, NOW()), (1, 'A', 12, 'STANDARD', true, NOW()), (1, 'A', 13, 'WHEELCHAIR', true, NOW()), (1, 'A', 14, 'WHEELCHAIR', true, NOW()), (1, 'A', 15, 'STANDARD', true, NOW()),
-- Row B-J (STANDARD seats)
(1, 'B', 1, 'STANDARD', true, NOW()), (1, 'B', 2, 'STANDARD', true, NOW()), (1, 'B', 3, 'STANDARD', true, NOW()), (1, 'B', 4, 'STANDARD', true, NOW()), (1, 'B', 5, 'STANDARD', true, NOW()),
(1, 'B', 6, 'STANDARD', true, NOW()), (1, 'B', 7, 'STANDARD', true, NOW()), (1, 'B', 8, 'STANDARD', true, NOW()), (1, 'B', 9, 'STANDARD', true, NOW()), (1, 'B', 10, 'STANDARD', true, NOW()),
(1, 'B', 11, 'STANDARD', true, NOW()), (1, 'B', 12, 'STANDARD', true, NOW()), (1, 'B', 13, 'STANDARD', true, NOW()), (1, 'B', 14, 'STANDARD', true, NOW()), (1, 'B', 15, 'STANDARD', true, NOW()),
-- Continue with rows C through J (standard 15 seats each row)
(1, 'C', 1, 'STANDARD', true, NOW()), (1, 'C', 2, 'STANDARD', true, NOW()), (1, 'C', 3, 'STANDARD', true, NOW()), (1, 'C', 4, 'STANDARD', true, NOW()), (1, 'C', 5, 'STANDARD', true, NOW()),
(1, 'C', 6, 'STANDARD', true, NOW()), (1, 'C', 7, 'STANDARD', true, NOW()), (1, 'C', 8, 'STANDARD', true, NOW()), (1, 'C', 9, 'STANDARD', true, NOW()), (1, 'C', 10, 'STANDARD', true, NOW()),
(1, 'C', 11, 'STANDARD', true, NOW()), (1, 'C', 12, 'STANDARD', true, NOW()), (1, 'C', 13, 'STANDARD', true, NOW()), (1, 'C', 14, 'STANDARD', true, NOW()), (1, 'C', 15, 'STANDARD', true, NOW()),
(1, 'D', 1, 'STANDARD', true, NOW()), (1, 'D', 2, 'STANDARD', true, NOW()), (1, 'D', 3, 'STANDARD', true, NOW()), (1, 'D', 4, 'STANDARD', true, NOW()), (1, 'D', 5, 'STANDARD', true, NOW()),
(1, 'D', 6, 'STANDARD', true, NOW()), (1, 'D', 7, 'STANDARD', true, NOW()), (1, 'D', 8, 'STANDARD', true, NOW()), (1, 'D', 9, 'STANDARD', true, NOW()), (1, 'D', 10, 'STANDARD', true, NOW()),
(1, 'D', 11, 'STANDARD', true, NOW()), (1, 'D', 12, 'STANDARD', true, NOW()), (1, 'D', 13, 'STANDARD', true, NOW()), (1, 'D', 14, 'STANDARD', true, NOW()), (1, 'D', 15, 'STANDARD', true, NOW()),
(1, 'E', 1, 'STANDARD', true, NOW()), (1, 'E', 2, 'STANDARD', true, NOW()), (1, 'E', 3, 'STANDARD', true, NOW()), (1, 'E', 4, 'STANDARD', true, NOW()), (1, 'E', 5, 'STANDARD', true, NOW()),
(1, 'E', 6, 'STANDARD', true, NOW()), (1, 'E', 7, 'STANDARD', true, NOW()), (1, 'E', 8, 'STANDARD', true, NOW()), (1, 'E', 9, 'STANDARD', true, NOW()), (1, 'E', 10, 'STANDARD', true, NOW()),
(1, 'E', 11, 'STANDARD', true, NOW()), (1, 'E', 12, 'STANDARD', true, NOW()), (1, 'E', 13, 'STANDARD', true, NOW()), (1, 'E', 14, 'STANDARD', true, NOW()), (1, 'E', 15, 'STANDARD', true, NOW()),
(1, 'F', 1, 'STANDARD', true, NOW()), (1, 'F', 2, 'STANDARD', true, NOW()), (1, 'F', 3, 'STANDARD', true, NOW()), (1, 'F', 4, 'STANDARD', true, NOW()), (1, 'F', 5, 'STANDARD', true, NOW()),
(1, 'F', 6, 'STANDARD', true, NOW()), (1, 'F', 7, 'STANDARD', true, NOW()), (1, 'F', 8, 'STANDARD', true, NOW()), (1, 'F', 9, 'STANDARD', true, NOW()), (1, 'F', 10, 'STANDARD', true, NOW()),
(1, 'F', 11, 'STANDARD', true, NOW()), (1, 'F', 12, 'STANDARD', true, NOW()), (1, 'F', 13, 'STANDARD', true, NOW()), (1, 'F', 14, 'STANDARD', true, NOW()), (1, 'F', 15, 'STANDARD', true, NOW()),
(1, 'G', 1, 'STANDARD', true, NOW()), (1, 'G', 2, 'STANDARD', true, NOW()), (1, 'G', 3, 'STANDARD', true, NOW()), (1, 'G', 4, 'STANDARD', true, NOW()), (1, 'G', 5, 'STANDARD', true, NOW()),
(1, 'G', 6, 'STANDARD', true, NOW()), (1, 'G', 7, 'STANDARD', true, NOW()), (1, 'G', 8, 'STANDARD', true, NOW()), (1, 'G', 9, 'STANDARD', true, NOW()), (1, 'G', 10, 'STANDARD', true, NOW()),
(1, 'G', 11, 'STANDARD', true, NOW()), (1, 'G', 12, 'STANDARD', true, NOW()), (1, 'G', 13, 'STANDARD', true, NOW()), (1, 'G', 14, 'STANDARD', true, NOW()), (1, 'G', 15, 'STANDARD', true, NOW()),
(1, 'H', 1, 'STANDARD', true, NOW()), (1, 'H', 2, 'STANDARD', true, NOW()), (1, 'H', 3, 'STANDARD', true, NOW()), (1, 'H', 4, 'STANDARD', true, NOW()), (1, 'H', 5, 'STANDARD', true, NOW()),
(1, 'H', 6, 'STANDARD', true, NOW()), (1, 'H', 7, 'STANDARD', true, NOW()), (1, 'H', 8, 'STANDARD', true, NOW()), (1, 'H', 9, 'STANDARD', true, NOW()), (1, 'H', 10, 'STANDARD', true, NOW()),
(1, 'H', 11, 'STANDARD', true, NOW()), (1, 'H', 12, 'STANDARD', true, NOW()), (1, 'H', 13, 'STANDARD', true, NOW()), (1, 'H', 14, 'STANDARD', true, NOW()), (1, 'H', 15, 'STANDARD', true, NOW()),
(1, 'I', 1, 'STANDARD', true, NOW()), (1, 'I', 2, 'STANDARD', true, NOW()), (1, 'I', 3, 'STANDARD', true, NOW()), (1, 'I', 4, 'STANDARD', true, NOW()), (1, 'I', 5, 'STANDARD', true, NOW()),
(1, 'I', 6, 'STANDARD', true, NOW()), (1, 'I', 7, 'STANDARD', true, NOW()), (1, 'I', 8, 'STANDARD', true, NOW()), (1, 'I', 9, 'STANDARD', true, NOW()), (1, 'I', 10, 'STANDARD', true, NOW()),
(1, 'I', 11, 'STANDARD', true, NOW()), (1, 'I', 12, 'STANDARD', true, NOW()), (1, 'I', 13, 'STANDARD', true, NOW()), (1, 'I', 14, 'STANDARD', true, NOW()), (1, 'I', 15, 'STANDARD', true, NOW()),
(1, 'J', 1, 'STANDARD', true, NOW()), (1, 'J', 2, 'STANDARD', true, NOW()), (1, 'J', 3, 'STANDARD', true, NOW()), (1, 'J', 4, 'STANDARD', true, NOW()), (1, 'J', 5, 'STANDARD', true, NOW()),
(1, 'J', 6, 'STANDARD', true, NOW()), (1, 'J', 7, 'STANDARD', true, NOW()), (1, 'J', 8, 'STANDARD', true, NOW()), (1, 'J', 9, 'STANDARD', true, NOW()), (1, 'J', 10, 'STANDARD', true, NOW()),
(1, 'J', 11, 'STANDARD', true, NOW()), (1, 'J', 12, 'STANDARD', true, NOW()), (1, 'J', 13, 'STANDARD', true, NOW()), (1, 'J', 14, 'STANDARD', true, NOW()), (1, 'J', 15, 'STANDARD', true, NOW()),

-- Theater 2: VIP Lounge Theater (60 seats, VIP) - 6 rows x 10 seats with COUPLE seats
(2, 'A', 1, 'VIP', true, NOW()), (2, 'A', 2, 'VIP', true, NOW()), (2, 'A', 3, 'VIP', true, NOW()), (2, 'A', 4, 'VIP', true, NOW()), (2, 'A', 5, 'VIP', true, NOW()),
(2, 'A', 6, 'VIP', true, NOW()), (2, 'A', 7, 'VIP', true, NOW()), (2, 'A', 8, 'VIP', true, NOW()), (2, 'A', 9, 'VIP', true, NOW()), (2, 'A', 10, 'VIP', true, NOW()),
(2, 'B', 1, 'VIP', true, NOW()), (2, 'B', 2, 'VIP', true, NOW()), (2, 'B', 3, 'COUPLE', true, NOW()), (2, 'B', 4, 'COUPLE', true, NOW()), (2, 'B', 5, 'VIP', true, NOW()),
(2, 'B', 6, 'VIP', true, NOW()), (2, 'B', 7, 'COUPLE', true, NOW()), (2, 'B', 8, 'COUPLE', true, NOW()), (2, 'B', 9, 'VIP', true, NOW()), (2, 'B', 10, 'VIP', true, NOW()),
(2, 'C', 1, 'VIP', true, NOW()), (2, 'C', 2, 'VIP', true, NOW()), (2, 'C', 3, 'COUPLE', true, NOW()), (2, 'C', 4, 'COUPLE', true, NOW()), (2, 'C', 5, 'VIP', true, NOW()),
(2, 'C', 6, 'VIP', true, NOW()), (2, 'C', 7, 'COUPLE', true, NOW()), (2, 'C', 8, 'COUPLE', true, NOW()), (2, 'C', 9, 'VIP', true, NOW()), (2, 'C', 10, 'VIP', true, NOW()),
(2, 'D', 1, 'VIP', true, NOW()), (2, 'D', 2, 'VIP', true, NOW()), (2, 'D', 3, 'VIP', true, NOW()), (2, 'D', 4, 'VIP', true, NOW()), (2, 'D', 5, 'VIP', true, NOW()),
(2, 'D', 6, 'VIP', true, NOW()), (2, 'D', 7, 'VIP', true, NOW()), (2, 'D', 8, 'VIP', true, NOW()), (2, 'D', 9, 'VIP', true, NOW()), (2, 'D', 10, 'VIP', true, NOW()),
(2, 'E', 1, 'VIP', true, NOW()), (2, 'E', 2, 'VIP', true, NOW()), (2, 'E', 3, 'VIP', true, NOW()), (2, 'E', 4, 'VIP', true, NOW()), (2, 'E', 5, 'VIP', true, NOW()),
(2, 'E', 6, 'VIP', true, NOW()), (2, 'E', 7, 'VIP', true, NOW()), (2, 'E', 8, 'VIP', true, NOW()), (2, 'E', 9, 'VIP', true, NOW()), (2, 'E', 10, 'VIP', true, NOW()),
(2, 'F', 1, 'VIP', true, NOW()), (2, 'F', 2, 'VIP', true, NOW()), (2, 'F', 3, 'VIP', true, NOW()), (2, 'F', 4, 'VIP', true, NOW()), (2, 'F', 5, 'VIP', true, NOW()),
(2, 'F', 6, 'VIP', true, NOW()), (2, 'F', 7, 'VIP', true, NOW()), (2, 'F', 8, 'VIP', true, NOW()), (2, 'F', 9, 'VIP', true, NOW()), (2, 'F', 10, 'VIP', true, NOW());

-- Note: Adding seats for remaining theaters would make this file very long
-- For brevity, we'll add seats for just first 2 theaters as examples
-- In production, you would generate seats for all 15 theaters programmatically

-- Insert simple showtimes for next 7 days
INSERT INTO showtimes (movie_id, theater_id, show_datetime, price, available_seats, created_at) VALUES
-- Day 1 (Today)
(1, 1, (CURRENT_DATE + TIME '10:00:00'), 150000, 120, NOW()),
(1, 1, (CURRENT_DATE + TIME '13:30:00'), 150000, 110, NOW()),
(1, 1, (CURRENT_DATE + TIME '19:30:00'), 180000, 140, NOW()),
(2, 2, (CURRENT_DATE + TIME '11:00:00'), 220000, 45, NOW()),
(2, 2, (CURRENT_DATE + TIME '16:00:00'), 220000, 50, NOW()),
(3, 3, (CURRENT_DATE + TIME '14:00:00'), 160000, 250, NOW()),
(3, 3, (CURRENT_DATE + TIME '20:00:00'), 190000, 260, NOW()),
-- Day 2 (Tomorrow)
(1, 1, ((CURRENT_DATE + INTERVAL '1 day') + TIME '10:00:00'), 150000, 130, NOW()),
(2, 2, ((CURRENT_DATE + INTERVAL '1 day') + TIME '11:00:00'), 220000, 55, NOW()),
(3, 3, ((CURRENT_DATE + INTERVAL '1 day') + TIME '14:00:00'), 160000, 270, NOW()),
(4, 4, ((CURRENT_DATE + INTERVAL '1 day') + TIME '15:30:00'), 140000, 120, NOW()),
(5, 5, ((CURRENT_DATE + INTERVAL '1 day') + TIME '18:00:00'), 250000, 40, NOW()),
-- Day 3
(1, 1, ((CURRENT_DATE + INTERVAL '2 days') + TIME '13:30:00'), 150000, 135, NOW()),
(2, 2, ((CURRENT_DATE + INTERVAL '2 days') + TIME '16:00:00'), 220000, 48, NOW()),
(6, 6, ((CURRENT_DATE + INTERVAL '2 days') + TIME '19:30:00'), 170000, 300, NOW()),
(7, 7, ((CURRENT_DATE + INTERVAL '2 days') + TIME '21:00:00'), 160000, 115, NOW()),
-- Day 4
(8, 8, ((CURRENT_DATE + INTERVAL '3 days') + TIME '10:30:00'), 260000, 45, NOW()),
(9, 9, ((CURRENT_DATE + INTERVAL '3 days') + TIME '13:00:00'), 175000, 280, NOW()),
(10, 10, ((CURRENT_DATE + INTERVAL '3 days') + TIME '16:45:00'), 140000, 105, NOW()),
-- Day 5
(11, 11, ((CURRENT_DATE + INTERVAL '4 days') + TIME '12:00:00'), 240000, 42, NOW()),
(12, 12, ((CURRENT_DATE + INTERVAL '4 days') + TIME '18:30:00'), 170000, 125, NOW()),
(13, 13, ((CURRENT_DATE + INTERVAL '4 days') + TIME '20:15:00'), 200000, 58, NOW()),
-- Day 6
(14, 14, ((CURRENT_DATE + INTERVAL '5 days') + TIME '11:15:00'), 180000, 275, NOW()),
(15, 15, ((CURRENT_DATE + INTERVAL '5 days') + TIME '17:30:00'), 190000, 100, NOW()),
(16, 1, ((CURRENT_DATE + INTERVAL '5 days') + TIME '21:30:00'), 170000, 140, NOW()),
-- Day 7
(17, 2, ((CURRENT_DATE + INTERVAL '6 days') + TIME '10:45:00'), 240000, 52, NOW()),
(18, 3, ((CURRENT_DATE + INTERVAL '6 days') + TIME '15:15:00'), 140000, 260, NOW()),
(19, 4, ((CURRENT_DATE + INTERVAL '6 days') + TIME '19:00:00'), 130000, 125, NOW()),
(20, 5, ((CURRENT_DATE + INTERVAL '6 days') + TIME '22:00:00'), 200000, 38, NOW());

-- Note: Skipping booking inserts since they require user_id references
-- which may not exist yet. Bookings can be created through the API after users are registered.

SELECT 'CINEMA MOCK DATA CREATION COMPLETED' as status;