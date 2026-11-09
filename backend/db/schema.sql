CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL,
    email            VARCHAR(255)  NOT NULL UNIQUE,
    password_hash    TEXT          NOT NULL,
    role             VARCHAR(20)   NOT NULL DEFAULT 'user',
    email_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
    profile_picture  TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50)   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS income_categories (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50)   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255)   NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category    VARCHAR(50)    NOT NULL,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS income (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255)   NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category    VARCHAR(50)    NOT NULL,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_income_user_created ON income (user_id, created_at DESC);

-- One-time codes for registration and login
CREATE TABLE IF NOT EXISTS email_otps (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash    TEXT         NOT NULL,
    purpose     VARCHAR(20)  NOT NULL CHECK (purpose IN ('registration', 'login')),
    attempts    INTEGER      NOT NULL DEFAULT 0,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps (user_id, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT         NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT         NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT         NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS budgets (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category    VARCHAR(50)    NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets (user_id);