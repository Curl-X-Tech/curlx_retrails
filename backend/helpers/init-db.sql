-- Waypoint Consolidated Service Architecture Database Initialization
-- Runs automatically when PostgreSQL container is first initialized

CREATE DATABASE general_db;
CREATE DATABASE planning_db;

GRANT ALL PRIVILEGES ON DATABASE general_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE planning_db TO waypoint;
