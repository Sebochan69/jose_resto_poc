# Local Data Folder

Use this folder for the fastest POC data flow:

```text
local JSON or CSV file
  -> FastAPI backend
  -> React dashboard Refresh Data button
```

For now, `dashboard.example.json` documents the shape the frontend expects. Later, you can copy it to `dashboard.json`, edit the numbers locally, and have FastAPI return that JSON from `GET /dashboard`.

Do not store secrets here. Google service account files, API keys, and `.env` files should stay out of git.
