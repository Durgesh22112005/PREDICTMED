# PredictMed TrustGuard — Interactive Prototype

A multi-page React prototype for the Virtusa Jatayu Season 6 PredictMed use case. It demonstrates a proposed Agentic AI CKD deterioration intelligence platform using synthetic data only.

## Included functional prototype areas

- Overview dashboard with risk, review, data-quality and pipeline summaries
- Patient intelligence directory with search, filters, longitudinal eGFR charts, evidence contributors and risk refresh
- Human-in-the-loop review queue with status updates and optional notes
- TrustGuard data-quality checks and uncertainty/abstention policy
- Agent orchestration center with six controlled demo agents and visible execution traces
- Data pipeline architecture with simulated Kafka, Airflow, Iceberg, feature-store, prediction and MLflow states
- Model Lab with illustrative experiments, feature selection, leakage checks, validation gates and registry UI
- Drift monitor with synthetic feature stability charts and investigation actions
- Population analytics and subgroup evaluation framework
- What-if analysis using interactive inputs (explicitly labelled as a simple illustrative formula, not a trained model)
- Local natural-language analytics assistant with predefined responses against the demo workspace state
- Audit trail with filters and CSV export
- Settings, reset controls, synthetic record creation and CSV file selection UI

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
npm run preview
```

## Important prototype boundaries

- All patient names, IDs, values, metrics, charts and aggregate counts are synthetic illustrations.
- No real patient data, EHR, payer API, external LLM or production infrastructure is connected.
- Kafka, Airflow, Apache Iceberg, the feature store, MLflow and agent tool execution are represented by interactive demo UI states; they are not live services in this frontend-only prototype.
- Risk indices and the what-if output are not clinically validated probabilities or medical advice.
- Audit events are stored in browser memory and are not persistent or tamper-proof.
- Before real deployment, implement a backend, authentication/authorization, secure data handling, validated clinical labels and prediction horizon, leakage-safe training/evaluation, clinical governance, monitoring and integration tests.
