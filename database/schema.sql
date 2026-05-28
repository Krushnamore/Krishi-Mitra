-- ============================================================
-- Agri Insights Hub v2 - SQL Schema Reference
-- (Primary DB is MongoDB; this SQL schema is for reference/migration)
-- ============================================================

CREATE DATABASE IF NOT EXISTS agri_insights;
USE agri_insights;

-- Users table (replaces Clerk authentication)
CREATE TABLE users (
    id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash
    role          ENUM('farmer','retailer') NOT NULL,
    -- Geolocation (saved from browser)
    lat           DECIMAL(10,7) DEFAULT NULL,
    lng           DECIMAL(10,7) DEFAULT NULL,
    city          VARCHAR(100)  DEFAULT NULL,
    -- Farmer-specific
    farm_size     VARCHAR(50)   DEFAULT NULL,
    crop_types    JSON          DEFAULT NULL,     -- ["wheat","rice"]
    -- Retailer-specific
    shop_name     VARCHAR(150)  DEFAULT NULL,
    shop_address  TEXT          DEFAULT NULL,
    -- Timestamps
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table (retailer inventory)
CREATE TABLE products (
    id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
    user_id         VARCHAR(36)   NOT NULL,
    product_name    VARCHAR(200)  NOT NULL,
    quantity        DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    category        VARCHAR(100)  DEFAULT 'General',
    unit            VARCHAR(50)   DEFAULT 'units',
    cost_per_unit   DECIMAL(10,2) DEFAULT 0.00   CHECK (cost_per_unit >= 0),
    expiry_date     DATE          DEFAULT NULL,
    min_stock_level DECIMAL(12,2) DEFAULT 10,
    max_stock_level DECIMAL(12,2) DEFAULT 1000,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_expiry (expiry_date)
);

-- Refresh tokens (optional: for token rotation)
CREATE TABLE refresh_tokens (
    id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id    VARCHAR(36)  NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rt_user (user_id)
);

-- ============================================================
-- Sample seed data
-- ============================================================

-- Sample farmer user (password: farmer123)
INSERT INTO users (name, email, password_hash, role, city, farm_size, crop_types)
VALUES (
  'Ramesh Kumar',
  'ramesh@example.com',
  '$2b$12$examplehashedpassword',
  'farmer',
  'Latur',
  '5 acres',
  '["wheat","soybean","cotton"]'
);

-- Sample retailer user (password: retailer123)
INSERT INTO users (name, email, password_hash, role, city, shop_name, shop_address)
VALUES (
  'Suresh Agro Store',
  'suresh@example.com',
  '$2b$12$examplehashedpassword',
  'retailer',
  'Latur',
  'Suresh Agro Supplies',
  'Main Market Road, Latur, Maharashtra 413512'
);

-- Sample products for the retailer
INSERT INTO products (user_id, product_name, quantity, category, unit, cost_per_unit, min_stock_level, max_stock_level)
SELECT id, 'Urea Fertilizer', 500, 'Fertilizer', 'kg', 6.50, 100, 2000
FROM users WHERE email = 'suresh@example.com';

INSERT INTO products (user_id, product_name, quantity, category, unit, cost_per_unit, min_stock_level, max_stock_level)
SELECT id, 'DAP Fertilizer', 80, 'Fertilizer', 'bags', 1350.00, 50, 500
FROM users WHERE email = 'suresh@example.com';

INSERT INTO products (user_id, product_name, quantity, category, unit, cost_per_unit, expiry_date, min_stock_level, max_stock_level)
SELECT id, 'Chlorpyrifos Pesticide', 45, 'Pesticide', 'liters', 280.00, '2025-06-30', 20, 200
FROM users WHERE email = 'suresh@example.com';

-- ============================================================
-- Useful queries
-- ============================================================

-- Get inventory stats for a retailer
SELECT
  COUNT(*) AS total_products,
  SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
  SUM(CASE WHEN quantity > 0 AND quantity <= min_stock_level THEN 1 ELSE 0 END) AS low_stock,
  SUM(CASE WHEN quantity >= max_stock_level THEN 1 ELSE 0 END) AS over_stock,
  SUM(quantity * cost_per_unit) AS total_stock_value
FROM products
WHERE user_id = '<retailer_user_id>';

-- Get expiring products (next 5 days)
SELECT product_name, quantity, expiry_date
FROM products
WHERE user_id = '<retailer_user_id>'
  AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 5 DAY);

-- Find retailers near a location (using Haversine for geo-distance)
SELECT
  u.id, u.name, u.shop_name, u.shop_address, u.city,
  (6371 * ACOS(
    COS(RADIANS(<farmer_lat>)) * COS(RADIANS(u.lat))
    * COS(RADIANS(u.lng) - RADIANS(<farmer_lng>))
    + SIN(RADIANS(<farmer_lat>)) * SIN(RADIANS(u.lat))
  )) AS distance_km
FROM users u
WHERE u.role = 'retailer'
  AND u.lat IS NOT NULL
HAVING distance_km < 50
ORDER BY distance_km ASC
LIMIT 10;
