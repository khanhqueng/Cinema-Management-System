-- V5__add_spring_ai_vector_store.sql
-- Create vector_store table for Spring AI PgVectorStore
-- Spring AI manages document storage here; similarity search uses native pgvector <=> operator

CREATE TABLE IF NOT EXISTS vector_store (
    id     UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT,
    metadata JSON,
    embedding vector(1536)
);

-- HNSW index for fast cosine similarity search (better recall than IVFFlat for small-mid datasets)
CREATE INDEX IF NOT EXISTS vector_store_embedding_hnsw_idx
    ON vector_store USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
