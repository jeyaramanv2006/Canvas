# Requirements

## Functional Requirements

### Authentication & Authorization
- Every user must authenticate using `email` and `password`.
- Passwords must be stored as secure hashes (`password_hash`).
- Authentication returns a JWT digital key and user role (`canvasser` or `manager`).
- Authorization middleware must validate JWT on every API request.

### Canvasser Requirements
- **Visit Form**: Log `school_name`, `district`, `institution_type`, `contact_person`, `phone`, `student_strength`, `product_interests`, `interest_level`, `follow_up_date`, and `notes` on a single screen.
- **Multi-select Product Chips**: Easily tap to select multiple items (Socks, Belts, Ties, Shoes, Uniforms, Bags, Track Pants).
- **Pipeline Interest Levels**: Select Hot (ready to order), Warm (follow-up), Cold, or Not Interested.
- **My Visits List**: Canvassers can view, search, and filter only their own visits by status (Hot, Warm, Cold, Won, Lost) and search keywords.
- **Edit & Delete Visit**: Canvassers can edit all details and delete their own logged visits.
- **Status Updates**: Mark visits as Won or Lost or update stages (Sample Sent, Quote Given).
- **Follow-up Alerts**: Highlight overdue follow-up dates.
- **Data Scoping**: Canvassers MUST NOT see or edit other canvassers' data or access the manager dashboard.

### Manager Requirements
- **Global Visibility**: Full read access to all visits across all canvassers.
- **All Visit Logs View**:
  - Searchable and filterable data table / card view containing full visit details, canvasser attribution, and status.
  - Full edit authority over all visits (correcting notes, dates, status, or lead details).
  - Delete authority for invalid or duplicate records.
- **Live Analytics Dashboard**:
  - Top Metrics: Total Visits, Hot Leads, Orders Won, Win Rate % (`Won / (Won + Lost)`).
  - Interest Breakdown: Doughnut chart showing distribution of Hot, Warm, Cold, Not Interested.
  - Visit Outcomes: Bar chart showing Open, Sample Sent, Quote Given, Won, Lost.
  - Top Districts: Ranked bars for expansion focus.
  - Product Demand: Aggregate interest counts per product category.
  - Canvasser Table: Performance breakdown per person (Visits, Hot leads, Won deals).
- **CSV Data Export**: Direct export of all or filtered visit records into CSV format.

## Non-Functional Requirements
- **Mobile-First UX**: Optimized touch targets and responsive UI for smartphones.
- **Data Security**: Secure password hashing and token-based API request validation.
- **Performance**: Instant data persistence and fast dashboard calculations.

## Confirmed Requirements
- Email/Password login with JWT authentication.
- Full CRUD over visits for Managers; scoped CRUD for Canvassers (own visits only).
- Relational schema with Users and Visits tables.
- Mobile-first React + Tailwind CSS web client.

## Proposed / Future Requirements
- Offline mode with browser `localStorage` fallback during connectivity drops.
- GPS location auto-tagging.
- Photo upload attachments for school visits.
- WhatsApp sharing integration.
