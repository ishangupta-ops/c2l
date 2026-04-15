# Launch Control — NPD Tracker PRD

## Architecture
- Frontend: React 19 + Tailwind + Shadcn UI (Light theme)
- Backend: FastAPI + Motor + JWT Auth
- Database: MongoDB

## Implemented Features

### Iteration 1: Core MVP
### Iteration 2: JWT Auth, Inline editing, Date history, CSV export, NPD template
### Iteration 3: R&D/Business classifications, Calendar date picker, Critical steps
### Iteration 4 (Current):
- **Light theme** — White/cream bg, dark blue sidebar, blue accents (inspired by GoobleCube reference)
- **Summary Dashboard** — Category-grouped project table, brand/dept/RD class/biz class filters, bulk CSV export
- **Brand field** — Hyphen / mCaffeine on all projects
- **6 Packaging Classifications** — China Sourced, HDPE/PET, Glass, Jar, India Innovation, Non-Complex Variation
- **NPD template** — Critical steps only (29 steps in 5 phases)
- **Color Bank removed**

## Backlog
### P0 (Next - Batch 2):
- Admin Panel for user management (create IDs, roles, deactivate)
- Auto-calculate planned timelines based on R&D complexity
- Delay tracking from date change history in summary/timeline
- Private MongoDB setup guidance
### P1:
- Role-based access, email notifications
### P2:
- Gantt chart, AI delay prediction
