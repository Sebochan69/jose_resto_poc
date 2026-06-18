# Local Data Folder

Use this folder for the fastest POC data flow:

```text
local CSV files
  -> future FastAPI backend
  -> normalized dashboard JSON
  -> React dashboard Refresh Data button
```

For now, the dashboard still renders from frontend mock data. These CSV files are sample POC inputs for the next local-data phase:

- `sales.csv`
- `inventory.csv`
- `menu_items.csv`
- `payroll.csv`
- `expenses.csv`
- `settings.csv`

`dashboard.example.json` documents the normalized JSON shape the frontend expects. Later, a backend can read these CSV files, normalize them, and return that JSON from `GET /dashboard`.

Payroll can include both daily totals and staff-level shifts:

- `payroll`: daily sales, staff count, payroll cost, and AI recommendation.
- `payrollStaffShifts`: who worked, role, shift window, regular hours, overtime hours, hourly rate, and estimated cost.

Do not store secrets here. Google service account files, API keys, and `.env` files should stay out of git.
