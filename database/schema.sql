CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF');
CREATE TYPE project_status AS ENUM ('ACTIVE', 'PLANNING', 'COMPLETED');
CREATE TYPE location_type AS ENUM ('SITE', 'ZONE', 'FLOOR', 'ROOM', 'AREA');
CREATE TYPE asset_status AS ENUM
  ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'LOST', 'DAMAGED', 'INACTIVE');
CREATE TYPE transaction_type AS ENUM
  ('CREATE', 'UPDATE', 'CHECK_OUT', 'CHECK_IN', 'MOVE', 'PROJECT_TRANSFER', 'STATUS_CHANGE');

CREATE TABLE users (
  user_id text PRIMARY KEY,
  name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'STAFF',
  department varchar(100) NOT NULL DEFAULT '',
  phone varchar(20),
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));

CREATE TABLE projects (
  project_id text PRIMARY KEY,
  project_name varchar(255) NOT NULL,
  project_code varchar(50) NOT NULL UNIQUE,
  address text,
  manager_user_id text REFERENCES users(user_id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'PLANNING',
  start_date date,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_memberships (
  project_id text NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE locations (
  location_id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  location_name varchar(255) NOT NULL,
  location_type location_type NOT NULL,
  parent_location_id text REFERENCES locations(location_id) ON DELETE RESTRICT,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX locations_name_per_project
  ON locations (project_id, lower(location_name));
CREATE INDEX locations_parent_idx ON locations(parent_location_id);

CREATE TABLE asset_categories (
  category_id text PRIMARY KEY,
  category_name varchar(100) NOT NULL UNIQUE,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assets (
  asset_id text PRIMARY KEY,
  asset_name varchar(255) NOT NULL,
  category_id text NOT NULL REFERENCES asset_categories(category_id) ON DELETE RESTRICT,
  project_id text NOT NULL REFERENCES projects(project_id) ON DELETE RESTRICT,
  serial_number varchar(100),
  qr_code varchar(255) NOT NULL UNIQUE,
  rfid_code varchar(255) UNIQUE,
  status asset_status NOT NULL DEFAULT 'AVAILABLE',
  current_location_id text REFERENCES locations(location_id) ON DELETE RESTRICT,
  current_user_id text REFERENCES users(user_id) ON DELETE SET NULL,
  checked_out_at timestamptz,
  expected_return_at timestamptz,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assets_checkout_state CHECK (
    (status = 'IN_USE' AND current_user_id IS NOT NULL AND checked_out_at IS NOT NULL)
    OR
    (status <> 'IN_USE' AND current_user_id IS NULL AND checked_out_at IS NULL
      AND expected_return_at IS NULL)
  ),
  CONSTRAINT assets_return_after_checkout CHECK (
    expected_return_at IS NULL OR expected_return_at >= checked_out_at
  )
);
CREATE INDEX assets_project_status_idx ON assets(project_id, status);
CREATE INDEX assets_location_idx ON assets(current_location_id);
CREATE INDEX assets_current_user_idx ON assets(current_user_id) WHERE current_user_id IS NOT NULL;

CREATE TABLE asset_transactions (
  transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL REFERENCES assets(asset_id) ON DELETE RESTRICT,
  transaction_type transaction_type NOT NULL,
  performed_by_user_id text NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  custodian_user_id text REFERENCES users(user_id) ON DELETE SET NULL,
  from_location_id text REFERENCES locations(location_id) ON DELETE RESTRICT,
  to_location_id text REFERENCES locations(location_id) ON DELETE RESTRICT,
  from_project_id text REFERENCES projects(project_id) ON DELETE RESTRICT,
  to_project_id text REFERENCES projects(project_id) ON DELETE RESTRICT,
  previous_status asset_status,
  new_status asset_status,
  note text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX asset_transactions_history_idx ON asset_transactions(asset_id, occurred_at DESC);
CREATE INDEX asset_transactions_actor_idx ON asset_transactions(performed_by_user_id, occurred_at DESC);

CREATE TABLE refresh_tokens (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  CONSTRAINT refresh_tokens_expiry CHECK (expires_at > created_at)
);
CREATE INDEX refresh_tokens_user_active_idx
  ON refresh_tokens(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE password_reset_tokens (
  reset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT password_reset_expiry CHECK (expires_at > created_at)
);
CREATE INDEX password_reset_tokens_user_idx ON password_reset_tokens(user_id, expires_at);

CREATE TABLE audit_logs (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id text REFERENCES users(user_id) ON DELETE SET NULL,
  project_id text REFERENCES projects(project_id) ON DELETE SET NULL,
  asset_id text REFERENCES assets(asset_id) ON DELETE SET NULL,
  event_type varchar(64) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_project_time_idx ON audit_logs(project_id, occurred_at DESC);
CREATE INDEX audit_logs_asset_time_idx ON audit_logs(asset_id, occurred_at DESC);
CREATE INDEX audit_logs_actor_time_idx ON audit_logs(actor_user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER locations_set_updated_at
  BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER asset_categories_set_updated_at
  BEFORE UPDATE ON asset_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER assets_set_updated_at
  BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
