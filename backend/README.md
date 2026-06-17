# Backend Notes

This folder is reserved for the future FastAPI service.

Fastest POC backend plan:

1. Start with a local data file such as `../data/dashboard.json`.
2. FastAPI reads that file from disk.
3. React calls `GET /dashboard` when the user clicks `Refresh Data`.
4. The dashboard updates state and recalculates the numbers.
5. Later, replace the local file reader with a Google Sheets reader.

Suggested endpoints:

```text
GET /dashboard
POST /dashboard/refresh
POST /reports/generate
POST /consultant/ask
```

Keep private values in backend environment variables:

```text
GOOGLE_APPLICATION_CREDENTIALS=...
GOOGLE_SHEET_ID=...
OPENAI_API_KEY=...
```

Do not expose these values to the React frontend.
