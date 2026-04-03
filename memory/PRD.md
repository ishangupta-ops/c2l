# Launch Control — NPD Tracker PRD

## Original Problem Statement
Convert a static HTML NPD (New Product Development) tracker into a full-stack SaaS tool with React + FastAPI + MongoDB. Multi-user access, data persistence, dark mode, clean design.

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI + React Router
- **Backend:** FastAPI + Motor (async MongoDB)
- **Database:** MongoDB (collections: projects, colors, manufacturers)
- **Design:** Dark mode (neutral-950), Clash Display + Manrope fonts, Swiss high-contrast aesthetic

## Core Requirements
- Dashboard with metrics (total, on-track, at-risk, delayed, completed)
- Project cards grid with status/type filters and search
- Project detail view with tabs: Phases & Steps, Team View, Packaging, Blockers
- Timeline Analysis page with planned vs actual comparison, delay tables, complexity insights
- Color Bank for approved packaging colors
- Manufacturer Ratings with star ratings
- Full CRUD for projects, colors, manufacturers
- Inline phase/step status updates

## What's Been Implemented (Feb 2026)
- Full backend API with all CRUD endpoints
- Dashboard page with metrics, filters, search, project cards
- Project detail page with 4 tabs (Phases, Teams, Packaging, Blockers)
- Timeline Analysis page with Gantt bars, delay table, complexity/packaging insights
- Color Bank page with add/delete functionality
- Manufacturers page with star ratings, add/delete
- Project create/edit modal with phases builder
- Seed data endpoint with 5 sample projects, 5 colors, 3 manufacturers
- Dark mode SaaS design throughout
- All API endpoints tested and passing

## User Personas
- Startup team members managing NPD product launches
- Product managers tracking timelines and blockers
- Design team managing packaging colors
- Supply chain team rating manufacturers

## Prioritized Backlog
### P0 (Done)
- Full CRUD dashboard ✅
- Project phases/steps tracking ✅
- Timeline analysis ✅
- Color bank ✅
- Manufacturer ratings ✅

### P1 (Next)
- User authentication (multi-user access)
- Step-level inline editing (dates, owners)
- Export to PDF/CSV
- Notifications for blocked items

### P2 (Future)
- Role-based access control
- Gantt chart with drag-and-drop
- AI-powered delay prediction
- Email notifications for overdue steps
- Activity log/audit trail
