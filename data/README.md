# Local Data Folder

Use this folder for the fastest POC data flow:

```text
local JSON or CSV file
  -> FastAPI backend
  -> React dashboard Refresh Data button
```

For now, `dashboard.example.json` documents the shape the frontend expects. Later, you can copy it to `dashboard.json`, edit the numbers locally, and have FastAPI return that JSON from `GET /dashboard`.

Payroll can include both daily totals and staff-level shifts:

- `payroll`: daily sales, staff count, payroll cost, and AI recommendation.
- `payrollStaffShifts`: who worked, role, shift window, regular hours, overtime hours, hourly rate, and estimated cost.

Do not store secrets here. Google service account files, API keys, and `.env` files should stay out of git.
