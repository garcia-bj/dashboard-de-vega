-- ============================================================
-- De Vega - Schema de Base de Datos
-- PostgreSQL 16
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    role            VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('admin', 'user')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    meta_data       JSONB,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- SOCIAL ACCOUNTS (Meta: Facebook, Instagram)
-- ============================================================
CREATE TABLE social_accounts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider                VARCHAR(20) NOT NULL
                            CHECK (provider IN ('facebook', 'instagram')),
    page_id                 VARCHAR(100) NOT NULL,
    page_name               VARCHAR(255) NOT NULL,
    access_token            TEXT NOT NULL,
    token_expires_at        TIMESTAMP,
    instagram_business_id   VARCHAR(100),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);

-- ============================================================
-- PUBLICATIONS
-- ============================================================
CREATE TABLE publications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    prompt          TEXT NOT NULL,
    caption         TEXT,
    ai_model        VARCHAR(30) NOT NULL DEFAULT 'gemini'
                    CHECK (ai_model IN (
                        'gemini', 'openai_dalle',
                        'openrouter_flux', 'openrouter_stable_diffusion'
                    )),
    image_url       TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN (
                        'draft', 'pending', 'generating', 'generated',
                        'scheduled', 'publishing', 'published', 'failed'
                    )),
    targets         JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_at    TIMESTAMP NOT NULL,
    published_at    TIMESTAMP,
    meta_data       JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publications_user ON publications(user_id);
CREATE INDEX idx_publications_status ON publications(status);
CREATE INDEX idx_publications_scheduled ON publications(scheduled_at);
CREATE INDEX idx_publications_ai_model ON publications(ai_model);

-- ============================================================
-- GENERATION LOGS
-- ============================================================
CREATE TABLE generation_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id  UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    ai_model        VARCHAR(30) NOT NULL,
    prompt          TEXT NOT NULL,
    image_url       TEXT,
    request_payload JSONB,
    response_payload JSONB,
    duration_ms     INTEGER,
    cost_usd        FLOAT,
    error_message   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gen_logs_publication ON generation_logs(publication_id);
CREATE INDEX idx_gen_logs_ai_model ON generation_logs(ai_model);
CREATE INDEX idx_gen_logs_created ON generation_logs(created_at);

-- ============================================================
-- PUBLISH LOGS
-- ============================================================
CREATE TABLE publish_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id      UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    social_account_id   UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    target              VARCHAR(20) NOT NULL
                        CHECK (target IN (
                            'facebook_feed', 'instagram_feed', 'instagram_story'
                        )),
    success             BOOLEAN NOT NULL DEFAULT FALSE,
    meta_post_id        VARCHAR(100),
    meta_permalink      TEXT,
    error_message       TEXT,
    response_payload    JSONB,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pub_logs_publication ON publish_logs(publication_id);
CREATE INDEX idx_pub_logs_social_account ON publish_logs(social_account_id);
CREATE INDEX idx_pub_logs_target ON publish_logs(target);
CREATE INDEX idx_pub_logs_success ON publish_logs(success);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_publications_updated_at
    BEFORE UPDATE ON publications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: Admin user (password: admin123)
-- Debes cambiar esto en producción
-- ============================================================
-- La password 'admin123' hasheada con bcrypt:
INSERT INTO users (email, hashed_password, full_name, role)
VALUES (
    'admin@devega.com',
    '$2b$12$LJ3m4ys3GZfnYMz8kVsKaOTSfVFKrFJvPJ0MqgwpRNTeSxLW0EFui',
    'Brandon Admin',
    'admin'
) ON CONFLICT (email) DO NOTHING;
