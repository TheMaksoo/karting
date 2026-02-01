# ADR-004: Use MySQL for Database

## Status

**Accepted**

## Date

2024-01-15

## Context

We needed a relational database for storing:

- Users and authentication data
- Drivers with profiles
- Tracks with locations
- Karting sessions with metadata
- Individual lap times
- Friend relationships
- User preferences

The data is highly relational (sessions have laps, drivers, tracks) and requires complex queries for analytics.

## Decision

We chose **MySQL 8.0** as the primary database.

### Schema Highlights

```sql
-- Core tables
users (id, name, email, password, ...)
drivers (id, user_id, name, color, is_active, ...)
tracks (id, name, city, country, distance, ...)
karting_sessions (id, track_id, session_type, session_date, ...)
laps (id, karting_session_id, driver_id, lap_number, lap_time, ...)

-- Relationships
user_drivers (user_id, driver_id, is_main_driver)
friends (user_id, friend_id, status)
user_track_nicknames (user_id, track_id, nickname)
```

### Performance Indexes

```sql
-- Critical indexes for lap time queries
CREATE INDEX idx_laps_lap_time ON laps(lap_time);
CREATE INDEX idx_laps_driver_session ON laps(driver_id, karting_session_id);

-- Session filtering
CREATE INDEX idx_sessions_type ON karting_sessions(session_type);
CREATE INDEX idx_sessions_date ON karting_sessions(session_date);

-- Driver lookups
CREATE INDEX idx_drivers_name ON drivers(name);
CREATE INDEX idx_drivers_active ON drivers(is_active);
```

### Reasons

1. **Relational Data**: Perfect for our highly relational schema with complex joins.

2. **Laravel Integration**: First-class Eloquent ORM support, migrations, seeders.

3. **Performance**: Excellent query optimizer, InnoDB storage engine, JSON support.

4. **Hosting**: Available on all major cloud providers, managed options (RDS, PlanetScale).

5. **Tooling**: MySQL Workbench, phpMyAdmin, CLI tools.

## Alternatives Considered

### Option 1: PostgreSQL
- **Pros**: Advanced features (arrays, JSONB), better standards compliance
- **Cons**: Slightly more complex hosting, less common in PHP ecosystem

### Option 2: SQLite
- **Pros**: Zero configuration, file-based, great for development
- **Cons**: Concurrent write limitations, not suitable for production scale

### Option 3: MongoDB
- **Pros**: Flexible schema, good for document storage
- **Cons**: Not ideal for relational data, complex joins, less Laravel integration

## Consequences

### Positive
- Strong data integrity with foreign keys
- Efficient complex queries with proper indexing
- Easy backups and replication
- Familiar to most developers
- Great Laravel/Eloquent integration

### Negative
- Schema migrations needed for changes
- Horizontal scaling more complex than NoSQL
- Connection pooling needed at scale

### Neutral
- UTF8MB4 encoding for emoji support
- InnoDB as default storage engine
- Soft deletes increase storage over time

## Development Setup

```bash
# Using SQLite for development (optional)
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Production MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=karting
DB_USERNAME=karting_user
DB_PASSWORD=secure_password
```

## References

- [Laravel Database Documentation](https://laravel.com/docs/database)
- [MySQL 8.0 Features](https://dev.mysql.com/doc/refman/8.0/en/mysql-nutshell.html)
- [Database Schema Documentation](../wiki/Database-Schema.md)
