-- Waypoint Consolidated Service Architecture Database Initialization
-- Executed automatically when PostgreSQL container is first initialized via /docker-entrypoint-initdb.d/

-- 1. Create Required Application Databases (Idempotent)
SELECT 'CREATE DATABASE general_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'general_db')\gexec

SELECT 'CREATE DATABASE planning_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'planning_db')\gexec

-- 2. Grant Database Privileges to Service User
GRANT ALL PRIVILEGES ON DATABASE general_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE planning_db TO waypoint;

-- 3. Configure Schema and Default Permissions for general_db
\connect general_db
GRANT ALL ON SCHEMA public TO waypoint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO waypoint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO waypoint;

-- 4. Configure Schema and Default Permissions for planning_db
\connect planning_db
GRANT ALL ON SCHEMA public TO waypoint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO waypoint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO waypoint;
