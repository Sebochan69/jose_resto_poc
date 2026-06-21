# RestoPilot POC Data

This folder contains local proof-of-concept data for the JOSE RESTO / RestoPilot AI dashboard.

## Current Purpose

These files are used as sample restaurant operations data before connecting the dashboard to Google Sheets or a FastAPI backend.

For the POC, the CSV files can be used by:

- n8n workflows
- future FastAPI backend
- manual testing
- dashboard data normalization experiments

## Files

```text
sales.csv
inventory.csv
menu_items.csv
payroll.csv
expenses.csv
settings.csv
dashboard.example.json
```

## CSV Files

### sales.csv

Sales by date and menu item.

```csv
date,branch,menu_item,quantity_sold,selling_price,revenue
```

### inventory.csv

Current stock, usage velocity, reorder levels, and supplier data.

```csv
item,category,current_stock,unit,daily_usage,reorder_level,cost_per_unit,supplier
```

### menu_items.csv

Menu pricing, estimated food cost, target margin, and sales volume.

```csv
menu_item,category,selling_price,food_cost,target_margin,sales_volume
```

### payroll.csv

Worker-level payroll breakdown for payroll intelligence.

```csv
date,branch,employee_name,role,shift,days_worked,daily_rate,ot_pay,deductions,gross_pay,net_pay
```

### expenses.csv

Daily operating expense entries.

```csv
date,branch,expense_type,amount,notes
```

### settings.csv

Configurable business thresholds used for calculations and AI analysis.

```csv
metric,value
```

Example settings:

```text
target_food_cost_pct
target_payroll_pct
target_menu_margin_pct
critical_stock_days
watch_stock_days
target_health_score
```

## dashboard.example.json

`dashboard.example.json` documents the normalized JSON shape that a future FastAPI backend can return to the React dashboard.

Recommended future flow:

```text
CSV files or Google Sheets
  -> FastAPI backend
  -> normalized dashboard JSON
  -> React dashboard
```

## n8n Usage

For n8n POC workflows, these CSVs can be used as reference data.

Recommended easiest POC path:

1. Upload each CSV into Google Sheets as a separate tab.
2. Use n8n Google Sheets nodes to read each tab.
3. Use a Code node to compute metrics.
4. Send the computed metrics to OpenAI.
5. Return the generated report to the dashboard webhook or send it by email.

Suggested Google Sheet tab names:

```text
sales
inventory
menu_items
payroll
expenses
settings
```

## Important Notes

Do not store private API keys, Google credentials, OpenAI keys, or n8n secrets in this folder.

This data is fake demo data only.
