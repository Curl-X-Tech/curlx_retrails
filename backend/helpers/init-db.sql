-- ReTrails Database Initialization
-- Executed automatically when PostgreSQL container is first initialized via /docker-entrypoint-initdb.d/

-- 1. Create Application Database (Idempotent)
SELECT 'CREATE DATABASE retrails_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'retrails_db')\gexec

-- 2. Grant Database Privileges to Service User
GRANT ALL PRIVILEGES ON DATABASE retrails_db TO waypoint;

-- 3. Configure Schema and Default Permissions for retrails_db
\connect retrails_db
GRANT ALL ON SCHEMA public TO waypoint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO waypoint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO waypoint;
