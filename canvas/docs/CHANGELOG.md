# Changelog

## [0.2.0] - Added Full Visit Logs View & CRUD for Managers and Canvassers

### Added
- **Manager Command Center**:
  - Added dedicated **"All Canvass Logs"** view showing every school visit with complete details (school, district, canvasser name, phone, products, interest, outcome, follow-up date, and notes).
  - Added multi-criteria filters: search bar, district dropdown, canvasser dropdown, interest level filter, and deal outcome filter.
  - Added **Edit Visit Modal** allowing managers to edit any field of any logged visit.
  - Added **Delete Log** capability for managers with confirmation.
  - Added interactive **Field Team Leaderboard** with direct shortcut to filter visits by canvasser.
  - Added working **CSV Export** that downloads filtered or complete visit records.
- **Canvasser Flow Improvements**:
  - Added **Edit & Delete** capability for canvassers on their own logged visits in "My Visits".
  - Added search and filtering by interest/status in "My Visits".
  - Added rich mock dataset with pre-seeded visits and canvassers for instant testing.
- **Documentation Synchronization**:
  - Updated [`docs/REQUIREMENTS.md`](file:///c:/Users/Jeyaraman/.vscode/LOAD/canvas/canvas/docs/REQUIREMENTS.md), [`docs/API.md`](file:///c:/Users/Jeyaraman/.vscode/LOAD/canvas/canvas/docs/API.md), and [`docs/DECISIONS.md`](file:///c:/Users/Jeyaraman/.vscode/LOAD/canvas/canvas/docs/DECISIONS.md) to reflect full CRUD permissions and logs management.

---

## [0.1.0] - Initialized Project Foundation & Frontend MVP
- Synthesized client requirements and PDF specification into project knowledge base.
- Initialized React + Tailwind CSS + Framer Motion mobile-first frontend.
