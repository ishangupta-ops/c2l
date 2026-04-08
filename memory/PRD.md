# Launch Control — NPD Tracker PRD

## Original Problem Statement
NPD project tracker SaaS with React + FastAPI + MongoDB. Multi-user, persistent data, dark mode.

## Architecture
- Frontend: React 19 + Tailwind + Shadcn UI + React Router
- Backend: FastAPI + Motor + JWT Auth
- Database: MongoDB (projects, colors, manufacturers, users)

## What's Been Implemented

### Iteration 1 (Feb 2026)
- Full CRUD, dashboard, project detail, timeline, colors, manufacturers

### Iteration 2
- JWT auth, step-level inline editing, date change history, CSV export, NPD template (54 steps)

### Iteration 3
- **R&D Classification** (replaces old complexity): Complex - Innovation, Complex - Prototype Tested, Non Complex - Variation L1, Non Complex - Variation L2, Shop & Deploy
- **Business Classification**: Focus - Core, Portfolio Filler - Growth, Experimental, Complementary - Support
- **Removed** ingredients fields (ui, ci)
- **Calendar date picker** for all date inputs (launch dates, step planned/actual)
- **Critical step flags** on all 54 NPD template steps (33 critical, 21 non-critical)
- **Timeline Analysis rewritten**: R&D breakdown, Business breakdown, per-project expandable deep dive showing critical steps with planned/actual/status/revisions

## Backlog
### P1: Role-based access, email notifications, step comments
### P2: Gantt chart, AI delay prediction, audit trail
