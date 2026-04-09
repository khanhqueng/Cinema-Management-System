-- V6__index_vector_store_movie_id.sql
-- Speed up movie embedding existence checks backed by vector_store metadata

CREATE INDEX IF NOT EXISTS vector_store_movie_id_idx
    ON vector_store ((metadata::jsonb ->> 'movieId'))
    WHERE metadata IS NOT NULL
      AND metadata::jsonb ? 'movieId';
