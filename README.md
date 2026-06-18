# JOSE RESTO POC

Frontend proof-of-concept dashboard for restaurant AI automation. The app uses React, Vite, TypeScript, local mock data, and reusable dashboard components.

## Current Data Mode

This dashboard is dynamic on the frontend, but it is not connected to a live data source yet.

What is dynamic now:

- KPI cards, tables, report panels, and chat responses render from centralized mock data.
- Calculations such as margin %, payroll %, days left, estimated profit, health score, and total leakage are reusable.
- `Refresh Data` updates the last synced timestamp and slightly changes mock KPI values.
- AI report buttons and the consultant chat use mock generated responses.

What is not live yet:

- No Google Sheets connection.
- No FastAPI backend connection.
- No real AI API calls.
- No production database.

## Install Prerequisites

Install Node.js LTS for Windows. This also installs `npm`.

Option 1, with Windows Package Manager:

```powershell
winget install OpenJS.NodeJS.LTS
```

Option 2, with the installer:

Download and install Node.js LTS from https://nodejs.org/en/download.

After installing, close and reopen PowerShell, then verify:

```powershell
node -v
npm -v
```

If you are using WSL/Ubuntu, install Node.js inside WSL instead. Recommended:

```bash
sudo apt update
sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
node -v
npm -v
```

Quick fallback if you do not want to use `nvm`:

```bash
sudo apt update
sudo apt install -y nodejs npm
node -v
npm -v
```

On macOS, install Homebrew first if needed from https://brew.sh, then install Node.js LTS:

```bash
brew install node
node -v
npm -v
```

Optional Mac tools:

```bash
brew install git
brew install --cask visual-studio-code
```

## Install Project Dependencies

PowerShell:

```powershell
cd D:\PROJECTS\jose_resto_poc
npm install
```

WSL/Ubuntu:

```bash
cd /mnt/d/PROJECTS/jose_resto_poc
npm install
```

macOS:

```bash
cd ~/Projects/jose_resto_poc
npm install
```

## Run Locally

```powershell
npm run dev
```

The same command works in WSL:

```bash
npm run dev
```

Open the local URL Vite prints in the terminal, usually `http://localhost:5173`.

## n8n Report Automation

AI report buttons can call an n8n webhook.

Create `.env.local`:

```text
VITE_N8N_REPORT_WEBHOOK_URL=http://localhost:5678/webhook-test/restopilot-report
```

Run the dashboard:

```bash
npm run dev
```

When a report button is clicked, the dashboard sends:

```json
{
  "reportType": "overall"
}
```

Expected n8n response:

```json
{
  "success": true,
  "reportType": "overall",
  "generatedAt": "2026-06-18T00:00:00.000Z",
  "report": "AI report text here"
}
```

If n8n is unavailable, the dashboard falls back to mock report output.

## Build Check

```powershell
npm run build
```

The same command works on macOS and WSL:

```bash
npm run build
```

## GitHub Workflow

After creating a GitHub repository, initialize and push from this project folder:

```bash
git init
git add .
git commit -m "Initial JOSE RESTO POC dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

On the MacBook, pull the project:

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git jose_resto_poc
cd jose_resto_poc
npm install
npm run dev
```

## Fastest POC Data Flow

For the next POC stage, use locally saved CSV files with manual refresh before connecting Google Sheets.

Recommended flow:

```text
data/*.csv
  -> FastAPI backend
  -> normalized dashboard JSON
  -> React Refresh Data button
  -> dashboard recalculates KPIs and tables
```

Why this is faster for a POC:

- No Google Cloud setup yet.
- No Sheets API credentials yet.
- No OAuth or service account setup blocking the demo.
- Easier to edit CSV files locally and test dashboard behavior.
- The frontend API pattern can stay the same when you switch to Google Sheets later.

Starter files:

- `data/dashboard.example.json`: example normalized JSON shape the frontend expects.
- `data/README.md`: local data notes.
- `backend/README.md`: future FastAPI plan.
- `.env.example`: frontend API base URL placeholder.

Payroll detail can be returned at two levels:

- `payroll`: daily totals and AI recommendations.
- `payrollStaffShifts`: staff member, role, shift window, regular hours, overtime hours, hourly rate, and estimated cost.

Later, save exported restaurant data as CSV files in `data/`, for example:

```text
data/sales.csv
data/inventory.csv
data/menu_items.csv
data/payroll.csv
data/expenses.csv
data/settings.csv
```

When FastAPI is added, it should read those local CSV files, normalize them into the same dashboard shape documented by `data/dashboard.example.json`, and return that JSON from `GET /dashboard`. The dashboard `Refresh Data` button should call `GET /dashboard` instead of simulating random KPI changes.

Example future refresh function:

```ts
const refreshData = async () => {
  const latestData = await getDashboardData();
  setData(latestData);
  setLastSynced(new Date());
};
```

## Future Google Sheets Integration

Recommended architecture:

```text
Google Sheets
  -> FastAPI backend
  -> React dashboard
```

Do not put Google Sheets credentials in React. Keep service account keys, OAuth secrets, OpenAI keys, and other private values in the FastAPI backend environment.

Frontend files to update later:

- `src/data/mockRestaurantData.ts`: keep this as demo/fallback data.
- `src/App.tsx`: replace the current mock `refreshData` behavior with API calls.
- `src/utils/calculations.ts`: keep reusable calculations here unless the backend becomes the source of truth.

Recommended future frontend service:

```text
src/services/dashboardApi.ts
```

Example shape:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getDashboardData() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard data");
  }

  return response.json();
}
```

Recommended `.env.local` later:

```text
VITE_API_BASE_URL=http://localhost:8000
```

FastAPI can then expose endpoints such as:

- `GET /dashboard`
- `POST /dashboard/refresh`
- `POST /reports/generate`
- `POST /consultant/ask`

The backend should read Google Sheets, normalize rows into the same `RestaurantData` shape used by the mock data, and return JSON to the React app.
