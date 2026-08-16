# Raw Thoughts & Client Requirements

## Murugan Canvass - Complete System Thoughts & Architecture

### 1. Project Overview & Core Vision
Murugan Canvass is a mobile-first web application designed to help Murugan Enterprises track school apparel expansion (socks, belts, uniforms, ties, shoes, bags, track pants, etc.).
Originally, the field team relied on scattered notes, WhatsApp chats, and memory. The goal of this app is to provide a single source of truth. Field canvassers use it to log their daily school visits, capture product interests, and set follow-up dates. Managers use it to view live dashboards, track team performance, and make data-driven decisions on district expansion.

We are building a secure, cloud-synced version of this app. Unlike a basic prototype that saves data on a single phone (browser localStorage), this version will use a real backend database so multiple canvassers can work at the same time, and the manager can see the data update live from anywhere.

### 2. System Architecture
Client-Server architecture.
- **Frontend (Client)**: Web application (using HTML, Tailwind CSS, and React) acting as the user interface. Mobile-first design for canvassers, responsive for manager laptops.
- **Backend (Server)**: REST API serving as a secure middleman.
- **Database**: Relational database storing users and visits securely.

### 3. Role-Based Access & Security
Every user must log in with email and password. Backend issues JWT digital keys sent with requests.

**Canvasser (Field Role)**:
- Can only see and edit their own school visits.
- Cannot view other canvassers' data.
- Cannot access the manager's analytics dashboard.

**Manager (Admin Role)**:
- Full read access to all visits from all canvassers.
- Access to analytics dashboard (Win rates, top districts, product demand).
- Can export full database to CSV file.
- Cannot log new visits on behalf of canvassers.

### 4. Database Schema

**Table 1: Users**
- `id`: Unique identifier (Primary Key)
- `name`: Full name of the employee
- `email`: Used for login
- `password_hash`: Scrambled password
- `role`: Either "canvasser" or "manager"

**Table 2: Visits**
- `id`: Unique identifier (Primary Key)
- `canvasser_id`: Links to Users table (Foreign Key)
- `school_name`: Name of the institution
- `district`: Area of the visit
- `institution_type`: School, College, etc.
- `contact_person`: Lead contact person
- `phone`: Phone number of contact
- `student_strength`: Estimated size of the school
- `product_interests`: Comma-separated list (Socks, Belts, Ties, Shoes, Uniforms, Bags, Track Pants, etc.)
- `interest_level`: Hot, Warm, Cold, Not Interested
- `outcome_status`: Open, Sample Sent, Quote Given, Won, Lost
- `follow_up_date`: Date for next action
- `notes`: Extra text

### 5. API Endpoints
- **Authentication**:
  - `POST /api/login` (email, password -> token, user role)
- **Canvasser API**:
  - `POST /api/visits` (create visit)
  - `GET /api/visits` (list own visits)
  - `PATCH /api/visits/{id}` (update visit)
- **Manager API**:
  - `GET /api/admin/dashboard` (analytics calculations)
  - `GET /api/admin/team` (team performance table)
  - `GET /api/admin/export` (CSV export)

### 6. PDF Presentation Notes & Features
- Product Chips: Socks, Belts, Ties, Shoes, Uniforms, Bags, Track Pants
- Pipeline Stages: Hot (ready to order), Warm (follow-up), Cold, Not Interested
- Follow-up dates with overdue highlighting
- Quick stats header for canvassers: Today's visits, Hot leads, This week
- Manager dashboard components: Total Visits, Hot Leads, Orders Won, Win Rate %, Interest Breakdown (Doughnut chart), Visit Outcomes (Bar chart), Top Districts (Ranked bars), Product Demand, Canvasser Table, Recent Feed
- Future / Pilot Considerations: Browser offline support / localStorage sync fallback, GPS check-in, Photo upload, WhatsApp sharing, direct CRM / Google Sheets sync.
