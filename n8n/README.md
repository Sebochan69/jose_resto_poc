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

The workflow returns:

```json
{
  "success": true,
  "reportType": "overall",
  "generatedAt": "2026-06-18T00:00:00.000Z",
  "report": "AI report text here"
}
```

For now, the n8n workflow returns deterministic demo report text. Later, this can be replaced with CSV parsing, database lookup, or an AI model call from n8n/backend automation.
