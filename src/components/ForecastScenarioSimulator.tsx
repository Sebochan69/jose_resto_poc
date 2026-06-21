import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gauge,
  ShieldAlert,
} from "lucide-react";
import type { ForecastData, ForecastScenario } from "../types";
import { formatCurrency } from "../utils/calculations";
import { SectionCard } from "./SectionCard";

const mockForecastData: ForecastData = {
  next7DaysRevenue: 172000,
  next7DaysFoodCost: 72000,
  next7DaysPayroll: 18500,
  next7DaysExpenses: 39000,
  next7DaysProfit: 42500,
  confidence: "Medium",
  trend: "Revenue is trending upward, but food cost remains the main profit risk.",
  revenueForecast: [
    { date: "Jun 22", projectedRevenue: 22000 },
    { date: "Jun 23", projectedRevenue: 23500 },
    { date: "Jun 24", projectedRevenue: 24000 },
    { date: "Jun 25", projectedRevenue: 24800 },
    { date: "Jun 26", projectedRevenue: 26000 },
    { date: "Jun 27", projectedRevenue: 27500 },
    { date: "Jun 28", projectedRevenue: 28200 },
  ],
  scenarios: [
    {
      name: "Increase Beef Pares price",
      description: "Raise price from PHP 165 to PHP 185.",
      profitImpact: 4800,
      severity: "Positive",
    },
    {
      name: "Reduce one closing shift",
      description: "Reduce one low-traffic closing shift.",
      profitImpact: 2600,
      severity: "Positive",
    },
    {
      name: "Promote iced tea combos",
      description: "Push high-margin beverage combo add-ons.",
      profitImpact: 3500,
      severity: "Positive",
    },
    {
      name: "Ingredient cost +10%",
      description: "Chicken and beef costs increase by 10%.",
      profitImpact: -9500,
      severity: "Negative",
    },
  ],
};

interface ForecastScenarioSimulatorProps {
  forecast?: ForecastData;
}

const confidenceCopy: Record<ForecastData["confidence"], string> = {
  Low: "Monitor manually",
  Medium: "Ready for operator review",
  High: "Strong operating signal",
};

const getScenarioTone = (scenario: ForecastScenario) =>
  scenario.severity.toLowerCase();

const buildRevenuePath = (forecast: ForecastData) => {
  const values = forecast.revenueForecast.map((point) => point.projectedRevenue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  return forecast.revenueForecast
    .map((point, index) => {
      const x =
        forecast.revenueForecast.length === 1
          ? 50
          : (index / (forecast.revenueForecast.length - 1)) * 100;
      const y = 88 - ((point.projectedRevenue - min) / range) * 70;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

export function ForecastScenarioSimulator({
  forecast = mockForecastData,
}: ForecastScenarioSimulatorProps) {
  const revenuePath = buildRevenuePath(forecast);
  const maxScenarioImpact = Math.max(
    ...forecast.scenarios.map((scenario) => Math.abs(scenario.profitImpact)),
    1,
  );

  return (
    <SectionCard
      id="forecast-simulator"
      eyebrow="Forecast intelligence"
      title="Forecast & Scenario Simulator"
      action={
        <span className="section-stat">
          <BrainCircuit aria-hidden="true" size={16} />
          {confidenceCopy[forecast.confidence]}
        </span>
      }
    >
      <div className="forecast-shell">
        <div className="forecast-metrics" aria-label="Forecast summary">
          <div className="forecast-metric forecast-metric--revenue">
            <span>
              <ChartNoAxesCombined aria-hidden="true" size={17} />
              Next 7 days revenue
            </span>
            <strong>{formatCurrency(forecast.next7DaysRevenue)}</strong>
          </div>
          <div className="forecast-metric forecast-metric--profit">
            <span>
              <CircleDollarSign aria-hidden="true" size={17} />
              Next 7 days profit
            </span>
            <strong>{formatCurrency(forecast.next7DaysProfit)}</strong>
          </div>
          <div className="forecast-metric">
            <span>
              <Gauge aria-hidden="true" size={17} />
              Forecast confidence
            </span>
            <strong>{forecast.confidence}</strong>
          </div>
          <div className="forecast-metric forecast-metric--risk">
            <span>
              <ShieldAlert aria-hidden="true" size={17} />
              Main forecast risk
            </span>
            <p>{forecast.trend}</p>
          </div>
        </div>

        <div className="forecast-grid">
          <div className="forecast-chart-panel">
            <div className="forecast-panel-heading">
              <span>Revenue forecast</span>
              <strong>{formatCurrency(forecast.next7DaysRevenue)}</strong>
            </div>
            <svg
              aria-label="Projected revenue line chart"
              className="forecast-line-chart"
              preserveAspectRatio="none"
              role="img"
              viewBox="0 0 100 100"
            >
              <polygon className="forecast-line-chart__area" points={`0,100 ${revenuePath} 100,100`} />
              <polyline className="forecast-line-chart__line" points={revenuePath} />
            </svg>
            <div className="forecast-axis">
              {forecast.revenueForecast.map((point) => (
                <span key={point.date}>{point.date}</span>
              ))}
            </div>
          </div>

          <div className="forecast-chart-panel">
            <div className="forecast-panel-heading">
              <span>Scenario profit impact</span>
              <strong>{formatCurrency(forecast.next7DaysProfit)}</strong>
            </div>
            <div className="scenario-bars" aria-label="Scenario profit impact bar chart">
              {forecast.scenarios.map((scenario) => {
                const impactWidth = Math.max(
                  (Math.abs(scenario.profitImpact) / maxScenarioImpact) * 100,
                  8,
                );

                return (
                  <div className="scenario-bar" key={scenario.name}>
                    <span>{scenario.name}</span>
                    <div className="scenario-bar__track">
                      <div
                        className={`scenario-bar__fill scenario-bar__fill--${getScenarioTone(
                          scenario,
                        )}`}
                        style={{ width: `${impactWidth}%` }}
                      />
                    </div>
                    <strong>{formatCurrency(scenario.profitImpact)}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="scenario-card-grid">
          {forecast.scenarios.map((scenario) => {
            const isNegative = scenario.profitImpact < 0;
            const Icon = isNegative ? ArrowDownRight : ArrowUpRight;

            return (
              <article
                className={`scenario-card scenario-card--${getScenarioTone(scenario)}`}
                key={scenario.name}
              >
                <div>
                  <span>
                    <Icon aria-hidden="true" size={16} />
                    {scenario.severity}
                  </span>
                  <h3>{scenario.name}</h3>
                  <p>{scenario.description}</p>
                </div>
                <strong>{formatCurrency(scenario.profitImpact)}</strong>
              </article>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
