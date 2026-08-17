# API Documentation

## Authentication API

### POST `/api/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@muruganenterprises.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "name": "Rahul Sharma",
      "email": "user@muruganenterprises.com",
      "role": "canvasser"
    }
  }
  ```

---

## Canvasser API (Requires "canvasser" Role)

### POST `/api/visits`
- **Access**: Canvasser
- **Description**: Creates a new school visit log attributed to the authenticated user.

### GET `/api/visits`
- **Access**: Canvasser
- **Description**: Returns all visits created by the authenticated canvasser (`WHERE canvasser_id = token.userId`).

### PUT/PATCH `/api/visits/{id}`
- **Access**: Canvasser (Own visit only)
- **Description**: Updates visit details (school info, contact, products, interest level, outcome status, follow-up, notes).

### DELETE `/api/visits/{id}`
- **Access**: Canvasser (Own visit only)
- **Description**: Deletes a specific visit log owned by the canvasser.

---

## Manager API (Requires "manager" Role)

### GET `/api/admin/visits`
- **Access**: Manager
- **Description**: Returns all visits across all canvassers with full metadata and filters (search, district, canvasser, interest, status).

### PUT/PATCH `/api/admin/visits/{id}`
- **Access**: Manager
- **Description**: Edits any visit record in the database.

### DELETE `/api/admin/visits/{id}`
- **Access**: Manager
- **Description**: Deletes any visit record.

### GET `/api/admin/dashboard`
- **Access**: Manager
- **Description**: Computes aggregate metrics for manager charts (Total Visits, Hot Leads, Orders Won, Win Rate %, District breakdown, Product demand).

### GET `/api/admin/team`
- **Access**: Manager
- **Description**: Returns team performance summary per canvasser.

### GET `/api/admin/export`
- **Access**: Manager
- **Description**: Generates and downloads the full CSV file.
