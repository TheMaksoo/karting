# 🗄️ Database Schema

Complete database schema documentation for the Karting Dashboard.

## 📊 Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├──< user_driver >──┐
       │                   │
       ├──< friends        │
       │                   ▼
       │            ┌──────────────┐
       │            │   drivers    │
       │            └──────┬───────┘
       │                   │
       │                   │ 1:N
       │                   ▼
       │            ┌──────────────────────┐
       └──────────> │  karting_sessions    │ <───────┐
                    └──────────┬───────────┘         │
                               │                     │ N:1
                               │ 1:N                 │
                               ▼                     │
                        ┌──────────┐          ┌──────────┐
                        │   laps   │          │  tracks  │
                        └──────────┘          └──────────┘

┌─────────────┐      ┌────────────────┐      ┌──────────────┐
│  settings   │      │ user_settings  │      │   uploads    │
└─────────────┘      └────────────────┘      └──────────────┘

┌─────────────────┐
│ style_variables │
└─────────────────┘
```

## 📋 Tables

### users

Stores user accounts for authentication and authorization.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| name | varchar(255) | NOT NULL | User's full name |
| email | varchar(255) | NOT NULL, UNIQUE | Email address |
| email_verified_at | timestamp | NULL | Email verification timestamp |
| password | varchar(255) | NOT NULL | Hashed password (bcrypt) |
| is_admin | boolean | DEFAULT false | Admin flag |
| registration_status | varchar(20) | DEFAULT 'pending' | Registration status |
| last_login_at | timestamp | NULL | Last login timestamp |
| last_login_ip | varchar(45) | NULL | Last login IP address |
| remember_token | varchar(100) | NULL | Remember me token |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (email)

**Relationships:**
- Has many drivers (through user_driver)
- Has many karting_sessions
- Has many friends (self-referential)
- Has one user_settings

---

### drivers

Stores driver information.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| name | varchar(255) | NOT NULL, UNIQUE | Driver name |
| color | varchar(7) | NOT NULL | Hex color code (#RRGGBB) |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |
| deleted_at | timestamp | NULL | Soft delete timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (name)
- INDEX (is_active)
- INDEX (deleted_at)

**Relationships:**
- Has many karting_sessions
- Belongs to many users (through user_driver)

---

### tracks

Stores karting track information.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| name | varchar(255) | NOT NULL | Track name |
| location | varchar(255) | NULL | Track location |
| track_length | integer | NULL | Track length in meters |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |
| deleted_at | timestamp | NULL | Soft delete timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (name)
- INDEX (deleted_at)

**Relationships:**
- Has many karting_sessions

---

### karting_sessions

Stores individual karting session data.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| driver_id | bigint | NOT NULL, FK | Reference to drivers table |
| track_id | bigint | NOT NULL, FK | Reference to tracks table |
| user_id | bigint | NULL, FK | Reference to users table |
| session_date | date | NOT NULL | Session date |
| session_type | varchar(50) | DEFAULT 'race' | Session type (race/practice/qualifying) |
| session_number | integer | NULL | Session number for the day |
| temperature | integer | NULL | Temperature in Celsius |
| total_laps | integer | DEFAULT 0 | Total number of laps |
| best_lap_time | decimal(8,3) | NULL | Best lap time in seconds |
| average_lap_time | decimal(8,3) | NULL | Average lap time in seconds |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |
| deleted_at | timestamp | NULL | Soft delete timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (driver_id) REFERENCES drivers(id)
- FOREIGN KEY (track_id) REFERENCES tracks(id)
- FOREIGN KEY (user_id) REFERENCES users(id)
- INDEX (session_type)
- INDEX (session_date)
- INDEX (deleted_at)

**Relationships:**
- Belongs to driver
- Belongs to track
- Belongs to user
- Has many laps

---

### laps

Stores individual lap time data.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| karting_session_id | bigint | NOT NULL, FK | Reference to karting_sessions table |
| lap_number | integer | NOT NULL | Lap number in session |
| lap_time | decimal(8,3) | NOT NULL | Lap time in seconds |
| position | integer | NULL | Position in race |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (karting_session_id) REFERENCES karting_sessions(id) ON DELETE CASCADE
- INDEX (lap_time) - Critical for sorting/best lap queries
- INDEX (lap_number)

**Relationships:**
- Belongs to karting_session

---

### user_driver

Pivot table for many-to-many relationship between users and drivers.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| user_id | bigint | NOT NULL, FK | Reference to users table |
| driver_id | bigint | NOT NULL, FK | Reference to drivers table |
| is_main | boolean | DEFAULT false | Main driver flag |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
- UNIQUE (user_id, driver_id)

---

### friends

Stores friendship relationships between users.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| user_id | bigint | NOT NULL, FK | Reference to users table |
| friend_user_id | bigint | NOT NULL, FK | Reference to users table |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (friend_user_id) REFERENCES users(id) ON DELETE CASCADE
- UNIQUE (user_id, friend_user_id)

---

### settings

Global application settings.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| key | varchar(255) | NOT NULL, UNIQUE | Setting key |
| value | text | NULL | Setting value |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (key)

---

### user_settings

User-specific settings.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| user_id | bigint | NOT NULL, FK | Reference to users table |
| key | varchar(255) | NOT NULL | Setting key |
| value | text | NULL | Setting value |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- UNIQUE (user_id, key)

---

### style_variables

Customizable CSS variables for application styling.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| key | varchar(255) | NOT NULL, UNIQUE | CSS variable name |
| value | varchar(255) | NOT NULL | CSS variable value |
| category | varchar(50) | NULL | Category (colors, spacing, etc.) |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (key)

---

### uploads

Tracks file uploads and imports.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, AI | Primary key |
| user_id | bigint | NOT NULL, FK | Reference to users table |
| filename | varchar(255) | NOT NULL | Original filename |
| file_type | varchar(50) | NOT NULL | File type (eml, csv, txt) |
| status | varchar(20) | DEFAULT 'pending' | Upload status |
| uploaded_from_ip | varchar(45) | NULL | IP address of uploader |
| created_at | timestamp | NULL | Creation timestamp |
| updated_at | timestamp | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX (status)

---

## 📈 Typical Queries

### Get Driver Statistics

```sql
SELECT 
    d.id,
    d.name,
    COUNT(DISTINCT ks.id) as total_sessions,
    COUNT(l.id) as total_laps,
    MIN(l.lap_time) as best_lap,
    AVG(l.lap_time) as avg_lap
FROM drivers d
LEFT JOIN karting_sessions ks ON d.id = ks.driver_id
LEFT JOIN laps l ON ks.id = l.karting_session_id
WHERE d.deleted_at IS NULL
  AND ks.deleted_at IS NULL
GROUP BY d.id, d.name;
```

### Get Track Records

```sql
SELECT 
    t.name as track_name,
    d.name as driver_name,
    MIN(l.lap_time) as record_time,
    ks.session_date
FROM tracks t
JOIN karting_sessions ks ON t.id = ks.track_id
JOIN laps l ON ks.id = l.karting_session_id
JOIN drivers d ON ks.driver_id = d.id
WHERE t.deleted_at IS NULL
  AND ks.deleted_at IS NULL
  AND d.deleted_at IS NULL
GROUP BY t.id, t.name
ORDER BY record_time ASC;
```

### Get Session with Laps

```sql
SELECT 
    ks.*,
    d.name as driver_name,
    t.name as track_name,
    l.lap_number,
    l.lap_time
FROM karting_sessions ks
JOIN drivers d ON ks.driver_id = d.id
JOIN tracks t ON ks.track_id = t.id
LEFT JOIN laps l ON ks.id = l.karting_session_id
WHERE ks.id = ?
  AND ks.deleted_at IS NULL
ORDER BY l.lap_number;
```

## 🔒 Data Integrity

### Foreign Key Constraints

All relationships use foreign key constraints to maintain referential integrity:

- `ON DELETE CASCADE`: Automatically delete child records (e.g., laps when session is deleted)
- `ON DELETE RESTRICT`: Prevent deletion if child records exist (e.g., tracks with sessions)

### Soft Deletes

The following tables use soft deletes (deleted_at column):
- drivers
- tracks
- karting_sessions

This allows for data recovery and maintains historical references.

### Unique Constraints

- users.email
- drivers.name
- tracks.name (optional)
- settings.key
- user_settings(user_id, key)
- user_driver(user_id, driver_id)
- friends(user_id, friend_user_id)

## 📊 Performance Considerations

### Indexes

Indexes are strategically placed on:
- Foreign keys for join performance
- Frequently filtered columns (is_active, session_type, session_date)
- Sort columns (lap_time)
- Unique constraints

### Query Optimization

1. **Eager Loading**: Use Eloquent's `with()` to prevent N+1 queries
2. **Selective Columns**: Only select needed columns
3. **Pagination**: Use pagination for large result sets
4. **Caching**: Cache frequently accessed data (driver stats, track records)

## 🔄 Migration History

Database changes are versioned through Laravel migrations:

1. **Initial Schema** (2024-11-21)
   - Created users, drivers, tracks, sessions, laps tables

2. **Performance Indexes** (2025-01-15)
   - Added indexes on lap_time, session_type, driver names
   - Added soft deletes to main tables

3. **User Features** (2025-12-11)
   - Added friends table
   - Added user_settings table
   - Added session_number field

4. **Security Enhancements** (2026-01-30)
   - Added last_login_at, last_login_ip to users
   - Added uploaded_from_ip to uploads
   - Added registration_status to users

5. **Flexibility Updates** (2026-01-30)
   - Made temperature nullable
   - Made settings.value nullable

## 📚 Data Types Reference

### Decimals

`lap_time`: decimal(8,3)
- Total: 8 digits
- Decimal places: 3
- Range: 0.001 to 99999.999 seconds
- Example: 45.123 (45 seconds, 123 milliseconds)

### Varchar Lengths

- `name`: 255 characters (standard for names)
- `email`: 255 characters (email standard)
- `color`: 7 characters (hex color: #RRGGBB)
- `location`: 255 characters (full address)

### Enums (stored as varchar)

`session_type`: 'race', 'practice', 'qualifying'
`registration_status`: 'pending', 'approved', 'rejected'
`upload_status`: 'pending', 'processing', 'completed', 'failed'

## 🔧 Maintenance

### Regular Tasks

```sql
-- Optimize tables
OPTIMIZE TABLE drivers, tracks, karting_sessions, laps;

-- Analyze tables for query optimization
ANALYZE TABLE drivers, tracks, karting_sessions, laps;

-- Check for orphaned records
SELECT * FROM laps WHERE karting_session_id NOT IN (SELECT id FROM karting_sessions);
```

### Backup Strategy

1. **Daily automated backups** of entire database
2. **Weekly full backup** with compression
3. **Transaction logs** for point-in-time recovery
4. **Test restores** monthly

## 📈 Growth Projections

Current capacity and growth estimates:

| Table | Current | Monthly Growth | 1-Year Estimate |
|-------|---------|----------------|-----------------|
| users | 10 | +5 | 70 |
| drivers | 25 | +3 | 61 |
| tracks | 7 | +1 | 19 |
| sessions | 150 | +40 | 630 |
| laps | 12,543 | +3,200 | 50,943 |

**Storage**: ~124 MB currently, estimated ~800 MB in 1 year

---

*Last Updated: February 2026*
