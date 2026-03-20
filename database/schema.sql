-- Creator Platform — MySQL schema (run in phpMyAdmin or mysql CLI)
-- Charset: utf8mb4 for full Unicode

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS group_bookings;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS group_sessions;
DROP TABLE IF EXISTS creators;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('creator', 'buyer') NOT NULL DEFAULT 'buyer',
  name VARCHAR(255) NOT NULL,
  razorpay_customer_id VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE creators (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  bio TEXT,
  stripe_connect_account_id VARCHAR(255) NULL,
  razorpay_linked_account_id VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_creators_user (user_id),
  CONSTRAINT fk_creators_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  creator_id CHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  session_date DATE NOT NULL COMMENT 'Logical date in session_tz',
  session_tz VARCHAR(64) NOT NULL DEFAULT 'UTC',
  window_start_minute SMALLINT UNSIGNED NOT NULL COMMENT 'Minutes from midnight in session_tz',
  window_end_minute SMALLINT UNSIGNED NOT NULL,
  slot_duration_minutes SMALLINT UNSIGNED NOT NULL,
  price_amount BIGINT NOT NULL COMMENT 'Minor units (e.g. cents)',
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sessions_creator_date (creator_id, session_date),
  CONSTRAINT fk_sessions_creator FOREIGN KEY (creator_id) REFERENCES creators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE slots (
  id CHAR(36) NOT NULL PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  start_utc DATETIME(3) NOT NULL,
  end_utc DATETIME(3) NOT NULL,
  status ENUM('available', 'locked', 'booked') NOT NULL DEFAULT 'available',
  lock_expires_at DATETIME(3) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_slots_session_start (session_id, start_utc),
  KEY idx_slots_status (session_id, status),
  CONSTRAINT fk_slots_session FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  slot_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NULL,
  status ENUM('pending_payment', 'confirmed', 'cancelled_user', 'cancelled_creator') NOT NULL DEFAULT 'pending_payment',
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bookings_slot (slot_id),
  KEY idx_bookings_user (user_id),
  KEY idx_bookings_payment (payment_id),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_slot FOREIGN KEY (slot_id) REFERENCES slots (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  creator_id CHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  session_tz VARCHAR(64) NOT NULL DEFAULT 'UTC',
  daily_start_minute SMALLINT UNSIGNED NOT NULL,
  daily_end_minute SMALLINT UNSIGNED NOT NULL,
  max_participants INT UNSIGNED NOT NULL,
  price_amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_group_sessions_creator (creator_id),
  CONSTRAINT fk_group_sessions_creator FOREIGN KEY (creator_id) REFERENCES creators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_bookings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  group_session_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NULL,
  status ENUM('pending_payment', 'confirmed', 'cancelled_user', 'cancelled_creator') NOT NULL DEFAULT 'pending_payment',
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_group_booking_user_session (user_id, group_session_id),
  KEY idx_group_bookings_session (group_session_id),
  CONSTRAINT fk_group_bookings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_group_bookings_session FOREIGN KEY (group_session_id) REFERENCES group_sessions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id CHAR(36) NOT NULL PRIMARY KEY,
  creator_id CHAR(36) NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price_amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  delivery_regions JSON NOT NULL COMMENT 'Array of region codes',
  image_url VARCHAR(2048) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_creator (creator_id),
  CONSTRAINT fk_products_creator FOREIGN KEY (creator_id) REFERENCES creators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending_payment',
  shipping_address JSON NULL,
  payment_id CHAR(36) NULL,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_user (user_id),
  KEY idx_orders_product (product_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  provider ENUM('stripe', 'razorpay') NOT NULL,
  purpose ENUM('slot', 'group', 'product') NOT NULL,
  user_id CHAR(36) NOT NULL,
  creator_id CHAR(36) NOT NULL,
  amount_total BIGINT NOT NULL,
  platform_fee BIGINT NOT NULL,
  creator_amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status ENUM('pending', 'requires_action', 'authorized', 'captured', 'failed', 'refunded_partial', 'refunded_full') NOT NULL DEFAULT 'pending',
  external_order_id VARCHAR(255) NULL,
  external_payment_id VARCHAR(255) NULL,
  external_client_secret TEXT NULL,
  booking_id CHAR(36) NULL,
  group_booking_id CHAR(36) NULL,
  order_id CHAR(36) NULL,
  scheduled_transfer_at DATETIME NULL COMMENT 'Freeze: transfer after this time',
  transferred_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_payments_user (user_id),
  KEY idx_payments_creator (creator_id),
  KEY idx_payments_external (provider, external_order_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_creator FOREIGN KEY (creator_id) REFERENCES creators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL;

ALTER TABLE group_bookings
  ADD CONSTRAINT fk_group_bookings_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL;

CREATE TABLE refunds (
  id CHAR(36) NOT NULL PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  amount BIGINT NOT NULL,
  reason VARCHAR(500) NULL,
  status ENUM('pending', 'succeeded', 'failed') NOT NULL DEFAULT 'pending',
  external_refund_id VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_refunds_payment (payment_id),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application-level: one individual slot booking per user per UTC calendar day
-- Enforced in service layer + optional check via trigger or scheduled job
