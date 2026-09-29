-- Waypoint Multi-Service Database Initialization
-- Runs automatically when PostgreSQL container is first initialized

CREATE DATABASE orders_db;
CREATE DATABASE outlets_db;
CREATE DATABASE routes_db;
CREATE DATABASE vehicles_db;
CREATE DATABASE planning_db;
CREATE DATABASE dispatch_db;

GRANT ALL PRIVILEGES ON DATABASE orders_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE outlets_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE routes_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE vehicles_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE planning_db TO waypoint;
GRANT ALL PRIVILEGES ON DATABASE dispatch_db TO waypoint;
