# 📡 API Reference

Complete API documentation for the Karting Dashboard RESTful API.

## 🔗 Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://yourdomain.com/karting/api`

## 🔐 Authentication

All endpoints except health checks and login/register require authentication.

### Authentication Header
```http
Authorization: Bearer {your_token}
```

### Rate Limiting

| Endpoint Type | Rate Limit |
|--------------|------------|
| **Public** (login/register) | 5 requests/minute |
| **Authenticated** | 60 requests/minute |

## 📋 Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| **200** | OK - Request successful |
| **201** | Created - Resource created |
| **204** | No Content - Delete successful |
| **400** | Bad Request - Invalid input |
| **401** | Unauthorized - Authentication required |
| **403** | Forbidden - Insufficient permissions |
| **404** | Not Found - Resource not found |
| **422** | Unprocessable Entity - Validation failed |
| **429** | Too Many Requests - Rate limit exceeded |
| **500** | Internal Server Error |

---

## 🏥 Health Endpoints

### Check Health
```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T12:00:00Z"
}
```

### Detailed Health Check
```http
GET /health/detailed
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T12:00:00Z",
  "services": {
    "database": "healthy",
    "cache": "healthy"
  },
  "metrics": {
    "total_sessions": 150,
    "total_laps": 12000,
    "total_drivers": 25
  }
}
```

### Readiness Check
```http
GET /health/ready
```

### Liveness Check
```http
GET /health/live
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "token": "1|abc123xyz...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

**Errors**:
- **401**: Invalid credentials
- **422**: Validation failed
- **429**: Too many login attempts

### Register
```http
POST /auth/register
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

**Response** (201):
```json
{
  "message": "Registration successful. Awaiting admin approval.",
  "status": "pending"
}
```

### Logout
```http
POST /auth/logout
```

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User
```http
GET /auth/me
```

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "is_admin": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Change Password
```http
POST /auth/change-password
```

**Request Body**:
```json
{
  "current_password": "OldPass123!",
  "password": "NewPass123!",
  "password_confirmation": "NewPass123!"
}
```

**Response** (200):
```json
{
  "message": "Password changed successfully"
}
```

---

## 👥 Driver Endpoints

### List All Drivers
```http
GET /drivers
```

**Query Parameters**:
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "color": "#FF5733",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Single Driver
```http
GET /drivers/{id}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "John Doe",
  "color": "#FF5733",
  "is_active": true,
  "sessions_count": 15,
  "total_laps": 450,
  "best_lap_time": 45.123,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Create Driver
```http
POST /drivers
```

**Request Body**:
```json
{
  "name": "Jane Smith",
  "color": "#3498DB",
  "is_active": true
}
```

**Response** (201):
```json
{
  "id": 2,
  "name": "Jane Smith",
  "color": "#3498DB",
  "is_active": true,
  "created_at": "2024-02-01T00:00:00Z"
}
```

### Update Driver
```http
PUT /drivers/{id}
PATCH /drivers/{id}
```

**Request Body**:
```json
{
  "name": "Jane Doe",
  "color": "#9B59B6",
  "is_active": true
}
```

**Response** (200): Updated driver object

### Delete Driver
```http
DELETE /drivers/{id}
```

**Response** (204): No content

**Note**: Uses soft deletes. Driver is marked as deleted but remains in database.

### Get Driver Statistics
```http
GET /stats/drivers
```

**Query Parameters**:
- `driver_id` (integer): Specific driver ID

**Response** (200):
```json
{
  "data": [
    {
      "driver_id": 1,
      "driver_name": "John Doe",
      "total_sessions": 15,
      "total_laps": 450,
      "best_lap_time": 45.123,
      "average_lap_time": 47.856,
      "tracks_raced": 5
    }
  ]
}
```

---

## 🏁 Track Endpoints

### List All Tracks
```http
GET /tracks
```

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Circuit Park Berghem",
      "location": "Berghem, Netherlands",
      "track_length": 1100,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Single Track
```http
GET /tracks/{id}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Circuit Park Berghem",
  "location": "Berghem, Netherlands",
  "track_length": 1100,
  "sessions_count": 25,
  "track_record": 42.567,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Create Track
```http
POST /tracks
```

**Request Body**:
```json
{
  "name": "New Track",
  "location": "City, Country",
  "track_length": 1200
}
```

**Response** (201): Created track object

### Update Track
```http
PUT /tracks/{id}
PATCH /tracks/{id}
```

**Request Body**: Same as create

**Response** (200): Updated track object

### Delete Track
```http
DELETE /tracks/{id}
```

**Response** (204): No content

### Get Track Statistics
```http
GET /stats/tracks
```

**Response** (200):
```json
{
  "data": [
    {
      "track_id": 1,
      "track_name": "Circuit Park Berghem",
      "total_sessions": 25,
      "total_laps": 750,
      "track_record": 42.567,
      "average_lap_time": 45.234,
      "unique_drivers": 8
    }
  ]
}
```

---

## 🏎️ Session Endpoints

### List All Sessions
```http
GET /sessions
```

**Query Parameters**:
- `driver_id` (integer): Filter by driver
- `track_id` (integer): Filter by track
- `session_type` (string): Filter by type (practice, qualifying, race)
- `start_date` (date): Filter from date
- `end_date` (date): Filter to date

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "driver_id": 1,
      "track_id": 1,
      "session_date": "2024-02-01",
      "session_type": "race",
      "total_laps": 30,
      "best_lap_time": 45.123,
      "average_lap_time": 47.856,
      "created_at": "2024-02-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 150
  }
}
```

### Get Single Session
```http
GET /sessions/{id}
```

**Response** (200):
```json
{
  "id": 1,
  "driver": {
    "id": 1,
    "name": "John Doe",
    "color": "#FF5733"
  },
  "track": {
    "id": 1,
    "name": "Circuit Park Berghem",
    "location": "Berghem, Netherlands"
  },
  "session_date": "2024-02-01",
  "session_type": "race",
  "session_number": 1,
  "temperature": 18,
  "total_laps": 30,
  "best_lap_time": 45.123,
  "average_lap_time": 47.856,
  "created_at": "2024-02-01T00:00:00Z"
}
```

### Create Session
```http
POST /sessions
```

**Request Body**:
```json
{
  "driver_id": 1,
  "track_id": 1,
  "session_date": "2024-02-01",
  "session_type": "race",
  "session_number": 1,
  "temperature": 18
}
```

**Response** (201): Created session object

### Update Session
```http
PUT /sessions/{id}
PATCH /sessions/{id}
```

**Request Body**: Same as create

**Response** (200): Updated session object

### Delete Session
```http
DELETE /sessions/{id}
```

**Response** (204): No content

**Note**: Deleting a session also deletes all associated laps.

### Get Session Laps
```http
GET /sessions/{id}/laps
```

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "lap_number": 1,
      "lap_time": 47.234,
      "position": 5,
      "created_at": "2024-02-01T00:00:00Z"
    },
    {
      "id": 2,
      "lap_number": 2,
      "lap_time": 45.123,
      "position": 3,
      "created_at": "2024-02-01T00:00:00Z"
    }
  ]
}
```

---

## ⏱️ Lap Endpoints

### List All Laps
```http
GET /laps
```

**Query Parameters**:
- `session_id` (integer): Filter by session

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "session_id": 1,
      "lap_number": 1,
      "lap_time": 47.234,
      "position": 5,
      "created_at": "2024-02-01T00:00:00Z"
    }
  ]
}
```

### Get Single Lap
```http
GET /laps/{id}
```

**Response** (200): Lap object with session details

### Create Lap
```http
POST /laps
```

**Request Body**:
```json
{
  "session_id": 1,
  "lap_number": 3,
  "lap_time": 46.789,
  "position": 4
}
```

**Response** (201): Created lap object

### Update Lap
```http
PUT /laps/{id}
PATCH /laps/{id}
```

**Request Body**: Same as create

**Response** (200): Updated lap object

### Delete Lap
```http
DELETE /laps/{id}
```

**Response** (204): No content

### Get Lap Count
```http
GET /laps/count
```

**Response** (200):
```json
{
  "total_laps": 12543
}
```

### Get Laps by Driver
```http
GET /laps/driver/{driver_id}
```

**Query Parameters**:
- `limit` (integer): Limit results (default: 100)

**Response** (200): Array of lap objects

---

## 👤 User & Settings Endpoints

### Get User Settings
```http
GET /user/settings
```

**Response** (200):
```json
{
  "display_name": "John Doe",
  "track_nicknames": [
    {
      "track_id": 1,
      "nickname": "JD Racing"
    }
  ]
}
```

### Update Display Name
```http
PUT /user/display-name
```

**Request Body**:
```json
{
  "display_name": "Johnny"
}
```

**Response** (200):
```json
{
  "message": "Display name updated",
  "display_name": "Johnny"
}
```

### Set Track Nickname
```http
POST /user/track-nickname
```

**Request Body**:
```json
{
  "track_id": 1,
  "nickname": "Speed Demon"
}
```

**Response** (201): Created nickname object

### Delete Track Nickname
```http
DELETE /user/track-nickname/{id}
```

**Response** (204): No content

---

## 👥 User Driver Management

### Get User's Drivers
```http
GET /user/drivers
```

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "color": "#FF5733",
      "is_main": true
    }
  ]
}
```

### Attach Driver to User
```http
POST /user/drivers/{driver_id}
```

**Response** (200):
```json
{
  "message": "Driver attached to your account"
}
```

### Detach Driver from User
```http
DELETE /user/drivers/{driver_id}
```

**Response** (200):
```json
{
  "message": "Driver removed from your account"
}
```

### Set Main Driver
```http
POST /user/drivers/{driver_id}/set-main
```

**Response** (200):
```json
{
  "message": "Main driver updated"
}
```

---

## 👥 Friends Endpoints

### List Friends
```http
GET /friends
```

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "friend_user_id": 2,
      "friend_name": "Jane Doe",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Add Friend
```http
POST /friends
```

**Request Body**:
```json
{
  "friend_user_id": 2
}
```

**Response** (201): Created friendship object

### Remove Friend
```http
DELETE /friends/{id}
```

**Response** (204): No content

### Get Friend Driver IDs
```http
GET /friends/driver-ids
```

**Response** (200):
```json
{
  "driver_ids": [5, 7, 12]
}
```

---

## 📊 Statistics & Analytics Endpoints

### Overview Statistics
```http
GET /stats/overview
```

**Response** (200):
```json
{
  "total_sessions": 150,
  "total_laps": 12543,
  "total_drivers": 25,
  "total_tracks": 7,
  "fastest_lap_overall": 42.567
}
```

### Database Metrics
```http
GET /stats/database-metrics
```

**Response** (200):
```json
{
  "tables": {
    "sessions": 150,
    "laps": 12543,
    "drivers": 25,
    "tracks": 7,
    "users": 10
  },
  "database_size_mb": 124.5
}
```

### Driver Activity Over Time
```http
GET /stats/driver-activity-over-time
```

**Query Parameters**:
- `driver_id` (integer, optional): Specific driver
- `start_date` (date, optional): From date
- `end_date` (date, optional): To date

**Response** (200):
```json
{
  "data": [
    {
      "date": "2024-01",
      "sessions": 5,
      "laps": 150
    }
  ]
}
```

### Driver Track Heatmap
```http
GET /stats/driver-track-heatmap
```

**Response** (200):
```json
{
  "data": [
    {
      "driver_id": 1,
      "driver_name": "John Doe",
      "track_id": 1,
      "track_name": "Circuit Park Berghem",
      "session_count": 10,
      "total_laps": 300
    }
  ]
}
```

### Trophy Case
```http
GET /stats/trophy-case
```

**Response** (200):
```json
{
  "personal_bests": [
    {
      "track_name": "Circuit Park Berghem",
      "best_time": 45.123,
      "date": "2024-02-01"
    }
  ],
  "track_records": [
    {
      "track_name": "Circuit Park Berghem",
      "record_time": 42.567,
      "holder": "John Doe",
      "date": "2024-01-15"
    }
  ],
  "achievements": [
    {
      "title": "Century Club",
      "description": "Complete 100 laps",
      "earned_at": "2024-01-20"
    }
  ]
}
```

### Trophy Details
```http
GET /stats/trophy-details
```

**Query Parameters**:
- `trophy_type` (string): Type of trophy

**Response** (200): Detailed trophy information

---

## 📤 Upload Endpoints (Admin Only)

### Upload Preview
```http
POST /upload/preview
```

**Request**: Multipart form data with file

**Response** (200):
```json
{
  "preview": {
    "rows": 100,
    "columns": ["Driver", "Lap", "Time"],
    "sample_data": [...]
  }
}
```

### Import Data
```http
POST /upload/import
```

**Request**: Multipart form data with file and mapping

**Response** (201):
```json
{
  "message": "Import successful",
  "imported": 100,
  "errors": []
}
```

### Manual Entry
```http
POST /upload/manual-entry
```

**Request Body**:
```json
{
  "driver_id": 1,
  "track_id": 1,
  "session_date": "2024-02-01",
  "laps": [
    {"lap_number": 1, "lap_time": 47.234},
    {"lap_number": 2, "lap_time": 45.123}
  ]
}
```

**Response** (201): Created session object

### Batch Upload
```http
POST /upload/batch
```

**Request**: Multiple EML files

**Response** (200):
```json
{
  "message": "Batch upload successful",
  "processed": 5,
  "successful": 4,
  "failed": 1,
  "results": [...]
}
```

---

## 📧 EML Upload Endpoints (Admin Only)

### Parse EML File
```http
POST /sessions/upload-eml
```

**Request**: Multipart form data with .eml file

**Response** (200):
```json
{
  "track_id": 1,
  "track_name": "Circuit Park Berghem",
  "drivers": [
    {
      "name": "John Doe",
      "best_lap": "00:45.123",
      "average_lap": "00:47.856",
      "laps": [
        {"lap": 1, "time": "00:47.234"},
        {"lap": 2, "time": "00:45.123"}
      ]
    }
  ],
  "session_date": "2024-02-01",
  "temperature": 18
}
```

### Save Parsed Session
```http
POST /sessions/save-parsed
```

**Request Body**: Output from parse EML

**Response** (201):
```json
{
  "message": "Session saved successfully",
  "session_id": 123,
  "drivers_created": 2,
  "laps_imported": 60
}
```

---

## 👔 Admin Endpoints

### User Management

#### List Users
```http
GET /admin/users
```

**Response** (200): Array of user objects

#### Create User
```http
POST /admin/users
```

**Request Body**:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "is_admin": false
}
```

**Response** (201): Created user object

#### Update User
```http
PUT /admin/users/{id}
```

**Request Body**: Same as create (password optional)

**Response** (200): Updated user object

#### Delete User
```http
DELETE /admin/users/{id}
```

**Response** (204): No content

#### Get Available Drivers for User
```http
GET /admin/users/{user_id}/available-drivers
```

**Response** (200): Array of drivers not yet connected to user

#### Connect Driver to User
```http
POST /admin/users/{user_id}/drivers/{driver_id}
```

**Response** (200):
```json
{
  "message": "Driver connected to user"
}
```

#### Disconnect Driver from User
```http
DELETE /admin/users/{user_id}/drivers/{driver_id}
```

**Response** (200):
```json
{
  "message": "Driver disconnected from user"
}
```

### Registration Management

#### List All Registrations
```http
GET /admin/registrations
```

**Response** (200): Array of registration requests

#### Get Pending Registrations
```http
GET /admin/registrations/pending
```

**Response** (200): Array of pending registrations

#### Approve Registration
```http
POST /admin/registrations/{id}/approve
```

**Response** (200):
```json
{
  "message": "Registration approved",
  "user": { ... }
}
```

#### Reject Registration
```http
POST /admin/registrations/{id}/reject
```

**Response** (200):
```json
{
  "message": "Registration rejected"
}
```

#### Delete Registration
```http
DELETE /admin/registrations/{id}
```

**Response** (204): No content

---

## 🎨 Style Variable Endpoints

### Get Style Variables
```http
GET /style-variables
```

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "key": "--primary-color",
      "value": "#3498DB",
      "category": "colors"
    }
  ]
}
```

### Get CSS Output
```http
GET /styles.css
```

**Response** (200): CSS content with variables

### Update Style Variable (Admin Only)
```http
PUT /style-variables/{id}
```

**Request Body**:
```json
{
  "value": "#FF5733"
}
```

**Response** (200): Updated variable object

### Bulk Update (Admin Only)
```http
POST /style-variables/bulk
```

**Request Body**:
```json
{
  "variables": [
    {"id": 1, "value": "#FF5733"},
    {"id": 2, "value": "#3498DB"}
  ]
}
```

**Response** (200):
```json
{
  "message": "Variables updated",
  "updated": 2
}
```

### Reset to Defaults (Admin Only)
```http
POST /style-variables/reset
```

**Response** (200):
```json
{
  "message": "Variables reset to defaults"
}
```

---

## 🔄 Activity Endpoints

### Get Latest Activity
```http
GET /activity/latest
```

**Query Parameters**:
- `limit` (integer): Number of results (default: 10)

**Response** (200):
```json
{
  "data": [
    {
      "type": "session_created",
      "user": "John Doe",
      "driver": "John Doe",
      "track": "Circuit Park Berghem",
      "timestamp": "2024-02-01T12:00:00Z"
    }
  ]
}
```

---

## 📚 Additional Resources

- **Swagger Documentation**: Available at `/api/documentation` when running locally
- **Postman Collection**: Contact maintainers for collection file
- **API Client**: See [Frontend Guide](Frontend-Guide.md#api-client) for TypeScript API client

---

*Last Updated: February 2026*
