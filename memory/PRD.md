# Launch Control — NPD Tracker PRD

## Original Problem Statement
Convert a static HTML NPD tracker into a full-stack SaaS tool with React + FastAPI + MongoDB. Multi-user access, data persistence, dark mode, clean design. Add JWT auth, inline step editing, date history, CSV export, NPD template.

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI + React Router
- **Backend:** FastAPI + Motor (async MongoDB) + JWT Auth (bcrypt + PyJWT)
- **Database:** MongoDB (collections: projects, colors, manufacturers, users, login_attempts)
- **Design:** Dark mode (neutral-950), Clash Display + Manrope fonts, Swiss high-contrast aesthetic

## Core Requirements
- JWT authentication (login/signup, httpOnly cookies, brute force protection)
- Dashboard with metrics and project cards with filters
- Project detail with tabbed views (Phases, Teams, Packaging, Blockers)
- Step-level inline editing for dates & owners
- Date change history tracking (revision log with who/when/what changed)
- CSV export for projects
- NPD template with 8 phases & 54 pre-populated steps from company process
- Timeline Analysis, Color Bank, Manufacturer Ratings pages

## What's Been Implemented (Feb 2026)
### Iteration 1
- Full CRUD backend, dashboard, project detail, timeline, colors, manufacturers
### Iteration 2
- JWT auth with register/login/logout/refresh/brute-force protection
- Admin seeding on startup
- Step-level inline editing (click date/owner to edit, save with checkmark)
- Date change history tracking (every date edit recorded with old/new/who/when)
- Revision badge on steps + history modal
- CSV export with full project data + date change history section
- NPD template endpoint (8 phases, 54 steps from company spreadsheet)
- "Load NPD Template" button in project creation modal
- User info + logout in sidebar

## Prioritized Backlog
### P1 (Next)
- Role-based access control (admin vs member)
- Step-level comments/notes
- Notifications for blocked items

### P2 (Future)
- Gantt chart with drag-and-drop
- AI-powered delay prediction
- Email notifications
- Activity log/audit trail
