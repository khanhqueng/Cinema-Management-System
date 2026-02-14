-- V4__setup_pgvector_for_ai.sql
-- Setup pgvector extension for AI-powered movie recommendations
-- This enables vector similarity search for OpenAI embeddings

-- =================================
-- ENABLE PGVECTOR EXTENSION
-- =================================

-- Enable the pgvector extension for vector operations
-- This allows storing and querying high-dimensional vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- =================================
-- ADD VECTOR EMBEDDING COLUMN TO MOVIES
-- =================================

-- Add embedding column to store OpenAI embeddings (1536 dimensions)
-- This will store vector representations of movie content for similarity search
ALTER TABLE movies
ADD COLUMN embedding vector(1536);

-- Add index for fast vector similarity search using cosine distance
-- This dramatically speeds up similarity queries
CREATE INDEX idx_movies_embedding_cosine
ON movies USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =================================
-- CREATE AI METADATA TABLE
-- =================================

-- Track AI operations and embedding generation status
CREATE TABLE ai_embeddings_metadata (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'MOVIE', 'USER_PREFERENCE', etc.
    entity_id BIGINT NOT NULL,
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'text-embedding-ada-002',
    embedding_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding_status VARCHAR(20) DEFAULT 'GENERATED', -- GENERATED, FAILED, PENDING
    content_hash VARCHAR(64), -- Hash of content that was embedded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for AI metadata
CREATE INDEX idx_ai_embeddings_entity ON ai_embeddings_metadata(entity_type, entity_id);
CREATE INDEX idx_ai_embeddings_status ON ai_embeddings_metadata(embedding_status);
CREATE INDEX idx_ai_embeddings_model ON ai_embeddings_metadata(embedding_model);

-- =================================
-- CREATE USER PREFERENCE VECTORS TABLE
-- =================================

-- Store aggregated user preference vectors for fast recommendations
CREATE TABLE user_preference_vectors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_vector vector(1536), -- Aggregated preference embedding
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    genre_weights JSONB, -- Store genre preference weights as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Index for fast user preference lookups
CREATE INDEX idx_user_preference_vectors_user ON user_preference_vectors(user_id);
CREATE INDEX idx_user_preference_vectors_updated ON user_preference_vectors(last_updated);

-- =================================
-- HELPER FUNCTIONS FOR VECTOR OPERATIONS
-- =================================

-- Function to calculate cosine similarity between two vectors
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS FLOAT AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar movies using vector similarity
-- This will be used by the recommendation service
CREATE OR REPLACE FUNCTION find_similar_movies(
    input_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.5,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    movie_id BIGINT,
    title VARCHAR(255),
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.title,
        cosine_similarity(m.embedding, input_embedding) as similarity_score
    FROM movies m
    WHERE m.embedding IS NOT NULL
      AND cosine_similarity(m.embedding, input_embedding) >= similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- =================================
-- UPDATE TRIGGER FOR PREFERENCE VECTORS
-- =================================

-- Trigger function to update user preference vector timestamp
CREATE OR REPLACE FUNCTION update_preference_vector_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamp when preference vector changes
CREATE TRIGGER trigger_user_preference_vectors_update
    BEFORE UPDATE ON user_preference_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_preference_vector_timestamp();

-- =================================
-- PERFORMANCE OPTIMIZATION
-- =================================

-- Create partial index for movies with embeddings (most commonly queried)
CREATE INDEX idx_movies_with_embeddings
ON movies(id, title)
WHERE embedding IS NOT NULL;

-- Add comment documentation
COMMENT ON COLUMN movies.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions) for semantic similarity search';
COMMENT ON TABLE ai_embeddings_metadata IS 'Tracks AI embedding generation status and metadata';
COMMENT ON TABLE user_preference_vectors IS 'Aggregated user preference vectors for fast recommendation computation';
COMMENT ON FUNCTION find_similar_movies IS 'Find movies similar to input embedding using cosine similarity';