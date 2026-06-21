# n8n Workflows

This folder contains importable n8n workflow exports for the JOSE RESTO POC.

## Restopilot AI Report Webhook

Import `restopilot-report.workflow.json` into n8n.

The workflow exposes a POST webhook at:

```text
http://localhost:5678/webhook-test/restopilot-report
```

When the workflow is published/active, use the production URL:

```text
http://localhost:5678/webhook/restopilot-report
```

The dashboard sends:

```json
{
  "reportType": "overall"
}
```

Supported `reportType` values:

- `overall`
- `inventory`
- `menu`
- `payroll`
- `projection`

## Debug-Friendly Workflow Steps

The workflow is intentionally split into small nodes:

1. `01 Report Webhook`: receives the frontend POST request.
2. `02 Validate Report Type`: accepts only the supported report types and falls back to `overall`.
3. `03 Load CSV Data`: reads the local CSV files mounted at `/home/node/data`.
4. `04 Calculate POC Metrics`: calculates revenue, inventory risk, menu margin risk, payroll, expenses, and estimated profit.
5. `05 Compose Report Response`: turns the metrics into report text.
6. `06 Return Report`: sends JSON back to the React dashboard.

The Docker Compose file mounts the project `data/` folder read-only into n8n:

```text
./data:/home/node/data:ro
```

The workflow returns:

```json
{
  "success": true,
  "reportType": "overall",
  "generatedAt": "2026-06-18T00:00:00.000Z",
  "report": "AI report text here"
}
```

For now, the n8n workflow returns deterministic report text based on the local CSV files. Later, the `05 Compose Report Response` step can be replaced with an AI model call from n8n/backend automation.
