# Technical Requirements Document (TRD)

## Technical Architecture
- **Pattern**: Client-Server Architecture (REST API).
- **Frontend Stack**: React, HTML, Tailwind CSS.
- **Backend Stack**: RESTful API server (Framework TBD).
- **Database Stack**: Relational Database Management System (RDBMS, Engine TBD).
- **Security**: JWT (JSON Web Tokens) for session management and stateless authentication.

## Technical Constraints
- Password storage must utilize cryptographic password hashing (e.g., bcrypt / argon2).
- Stateless JWT verification on every protected endpoint.
- Database foreign keys must strictly enforce user ownership of visit records (`canvasser_id` -> `Users.id`).

## Technology Considerations
- **Frontend Framework**: React for dynamic component state (product chips, interest levels, dashboard charts).
- **Styling**: Tailwind CSS for responsive utility-first styling.
- **Backend Runtime Choice**: Node.js/Express, Python/FastAPI, or Go (Decision Required).
- **Database Choice**: PostgreSQL, MySQL, or SQLite (Decision Required).

## Infrastructure & Runtime Requirements
- Server runtime capable of executing REST endpoints and processing database queries.
- HTTPS configuration for secure JWT transmission in production.
