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
      "name": "Arun Kumar",
      "email": "user@muruganenterprises.com",
      "role": "canvasser"
    }
  }
  ```

---

## Canvasser API (Requires "canvasser" Role)

### POST `/api/visits`
- **Access**: Canvasser
- **Request Body**:
  ```json
  {
    "school_name": "St. Joseph Higher Secondary",
    "district": "Coimbatore",
    "institution_type": "School",
    "contact_person": "Mr. Ramesh (Principal)",
    "phone": "9876543210",
    "student_strength": 1200,
    "product_interests": ["Socks", "Belts", "Uniforms"],
    "interest_level": "Hot",
    "outcome_status": "Sample Sent",
    "follow_up_date": "2026-08-25",
    "notes": "Requested sample set for 500 sports socks."
  }
  ```

### GET `/api/visits`
- **Access**: Canvasser
- **Description**: Returns all visits created by the authenticated canvasser (`WHERE canvasser_id = token.userId`).

### PATCH `/api/visits/{id}`
- **Access**: Canvasser
- **Request Body**: Partial visit object (e.g., updating `outcome_status` to `"Won"`).

---

## Manager API (Requires "manager" Role)

### GET `/api/admin/dashboard`
- **Access**: Manager
- **Description**: Computes aggregate metrics for manager charts.
- **Response Sample**:
  ```json
  {
    "total_visits": 142,
    "hot_leads": 38,
    "orders_won": 24,
    "win_rate_percentage": 68.5,
    "interest_breakdown": { "Hot": 38, "Warm": 54, "Cold": 30, "Not Interested": 20 },
    "visit_outcomes": { "Open": 40, "Sample Sent": 35, "Quote Given": 25, "Won": 24, "Lost": 18 },
    "top_districts": [ { "district": "Coimbatore", "count": 45 }, { "district": "Madurai", "count": 32 } ],
    "product_demand": { "Socks": 95, "Belts": 70, "Uniforms": 60, "Ties": 40, "Shoes": 35 }
  }
  ```

### GET `/api/admin/team`
- **Access**: Manager
- **Description**: Returns team performance summary per canvasser (Visits count, Hot leads count, Won count).

### GET `/api/admin/export`
- **Access**: Manager
- **Description**: Downloads full database export in CSV format.
