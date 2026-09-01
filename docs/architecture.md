# Reclaim Architecture

This document describes the implemented architecture of Reclaim, including its service boundaries, recovery pipeline, AI integration, persistence model, execution controls, and Docker Compose deployment structure.

The architecture is intentionally divided between **deterministic application logic**, **AI-assisted analysis**, **bounded execution**, and **persistent auditability**.

---

## 1. Architecture Overview

Reclaim is implemented as a three-service Docker Compose application:

```text
                         RECLAIM
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Next.js Web      MySQL         FastAPI AI
          Service       Database         Service
                                            │
                                            ▼
                                          Ollama
                                            │
                                            ▼
                                        Qwen 3:4B
```

The three primary services are:

```text
reclaim-web
reclaim-mysql
reclaim-ai
```

The web application acts as the main application layer.

MySQL provides persistent storage.

The FastAPI service provides AI-assisted recovery analysis.

Ollama runs outside the AI container and provides the local Qwen 3:4B model to the AI service.

---

## 2. Repository Architecture

The repository separates the web application, AI service, database definitions, and documentation.

```text
Reclaim/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── cases/
│   │   └── dashboard/
│   │
│   ├── components/
│   ├── lib/
│   ├── services/
│   ├── types/
│   │
│   ├── Dockerfile
│   └── .dockerignore
│
├── services/
│   └── ai/
│       ├── app/
│       ├── Dockerfile
│       ├── .dockerignore
│       └── requirements.txt
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── architecture.md
│   ├── decisions.md
│   └── demo.md
│
├── docker-compose.yml
└── README.md
```

The `src` directory contains the Next.js application.

The `services/ai` directory contains the independent FastAPI AI service.

The `database` directory contains the MySQL schema and seeded demonstration data.

The `docs` directory contains project-level documentation.

---

# 3. Service Boundaries

## 3.1 Web Service

The web service is the primary application layer.

It is implemented with Next.js and TypeScript.

Its responsibilities include:

- serving the user interface
- retrieving cases
- displaying recovery information
- requesting recovery analysis
- requesting individual recovery execution
- requesting batch recovery
- retrieving recovery audit history
- communicating with MySQL
- communicating with the AI service

The web service contains the deterministic recovery services used by the application.

These include:

```text
risk-engine
intervention-engine
recovery-engine
```

It also contains the bounded execution layer and recovery audit functionality.

---

## 3.2 MySQL Service

MySQL is responsible for persistent application data.

The current schema contains two primary tables:

```text
cases
recovery_executions
```

The `cases` table stores the revenue cases.

The `recovery_executions` table stores persistent recovery execution records.

The relationship is:

```text
cases
  │
  │ 1
  │
  │
  │ many
  ▼
recovery_executions
```

Each recovery execution references its corresponding case through a foreign key.

---

## 3.3 AI Service

The AI service is implemented with FastAPI.

Its primary endpoint is:

```text
POST /analyze
```

The service receives case data together with the intervention selected by the application.

It then communicates with Ollama to obtain a Qwen 3:4B analysis.

The service returns structured recovery analysis containing:

```text
case_id
risk_score
diagnosis
recommendation
reason
confidence
customer_message
```

The AI service does not directly communicate with MySQL.

It also does not directly execute recovery actions.

---

# 4. Docker Compose Architecture

The three application services are defined in `docker-compose.yml`.

```text
┌──────────────────────────────────────────────────┐
│                Docker Compose                    │
│                                                  │
│  ┌──────────────┐       ┌──────────────┐        │
│  │ reclaim-web  │──────► │ reclaim-mysql│        │
│  │   :3000      │       │    :3306     │        │
│  └──────┬───────┘       └──────────────┘        │
│         │                                        │
│         │                                        │
│         ▼                                        │
│  ┌──────────────┐                               │
│  │ reclaim-ai   │                               │
│  │   :8000      │                               │
│  └──────┬───────┘                               │
│         │                                        │
└─────────┼────────────────────────────────────────┘
          │
          ▼
       Ollama
     Host Machine
          │
          ▼
       Qwen 3:4B
```

All three Docker services are connected through the Compose network:

```text
reclaim-network
```

The web service addresses MySQL through the Docker service name:

```text
mysql
```

The web service addresses the AI service through:

```text
http://ai:8000
```

The AI service communicates with the host's Ollama instance through:

```text
host.docker.internal:11434
```

---

# 5. Web Container

The web application uses a multi-stage Docker build.

The build consists of:

```text
Dependencies
     ↓
Builder
     ↓
Production Runner
```

The dependency stage installs the Node.js dependencies.

The builder stage creates the Next.js production build.

The production stage uses:

```text
gcr.io/distroless/nodejs22-debian13
```

and runs the Next.js standalone server.

The Next.js configuration uses:

```text
output: "standalone"
```

This allows the production container to contain the generated standalone application rather than the entire development environment.

---

# 6. AI Container

The AI service uses:

```text
python:3.12-slim
```

The container:

1. sets `/app` as the working directory
2. copies `requirements.txt`
3. installs the Python dependencies
4. copies the application code
5. exposes port `8000`
6. starts Uvicorn

The container runs:

```text
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The AI container does not contain the Qwen model itself.

Instead, the Ollama runtime and model remain available through the configured host connection.

---

# 7. Database Architecture

The MySQL database is initialized through the files mounted by Docker Compose:

```text
database/schema.sql
database/seed.sql
```

The schema creates:

```text
cases
recovery_executions
```

The `cases` table contains the authoritative case information.

Important fields include:

```text
id
customer_name
customer_email
amount
currency
issue_type
status
risk_score
created_at
updated_at
```

The `recovery_executions` table contains:

```text
id
case_id
action
status
amount_recovered
reason
created_at
```

The execution table references the case table through:

```text
fk_recovery_case
```

with cascade deletion when a referenced case is removed.

---

# 8. Risk Architecture

Risk scoring is implemented deterministically.

The risk engine evaluates case attributes and returns a bounded numeric score.

The current implementation considers:

```text
Issue Type
+
Transaction Amount
```

The resulting value is capped at:

```text
100
```

The important architectural distinction is between **risk calculation** and **risk authority**.

The risk engine provides deterministic scoring logic.

The persisted `risk_score` on the case is treated as the authoritative value by the final recovery and AI analysis flow.

The final architecture therefore avoids allowing another calculation or an LLM response to silently replace the case's authoritative risk score.

```text
                Case
                  │
                  ▼
          Stored risk_score
                  │
                  │ authoritative
                  ▼
       ┌─────────────────────┐
       │ Recovery / AI Flow  │
       └─────────────────────┘
```

---

# 9. Intervention Architecture

The intervention engine maps the issue type to a recovery action.

The current mappings are:

```text
payment_failure
        │
        ▼
payment_retry
```

```text
checkout_abandonment
        │
        ▼
checkout_recovery
```

```text
subscription_failure
        │
        ▼
subscription_recovery
```

Unsupported issue types use:

```text
manual_review
```

The intervention is determined by application logic before AI analysis.

This creates a deterministic boundary around the recovery decision.

---

# 10. Recovery Plan Architecture

The recovery engine converts a case into a recovery plan.

The plan contains:

```text
caseId
action
status
reason
```

The plan can have the status:

```text
ready
```

or:

```text
stopped
```

A case is eligible for a ready recovery plan when:

```text
status === "at_risk"
```

If the case is not currently eligible, the recovery plan is stopped.

The recovery engine therefore acts as the boundary between intervention selection and execution eligibility.

---

# 11. AI Analysis Architecture

The AI analysis flow begins after the application has established the case and intervention.

```text
Case
 │
 ├── risk_score
 ├── issue_type
 ├── status
 ├── amount
 └── customer information
 │
 ▼
Intervention Engine
 │
 ▼
Authoritative Intervention
 │
 ▼
FastAPI AI Service
 │
 ▼
Ollama
 │
 ▼
Qwen 3:4B
 │
 ▼
Structured Analysis
```

The web application's AI client sends the case data together with:

```text
intervention_action
```

The AI service incorporates this intervention into its prompt.

The prompt explicitly identifies the supplied risk score as authoritative and instructs the model not to calculate or modify it.

The prompt also requires the model to return the authoritative intervention as its recommendation.

---

# 12. AI Responsibility Boundary

The AI service is intentionally constrained.

The model is responsible for:

```text
Diagnosis
Reason
Confidence
Customer Message
Analysis
```

The application remains responsible for:

```text
Risk Authority
Intervention Selection
Recovery Eligibility
Execution
Audit Persistence
```

The boundary can be represented as:

```text
┌──────────────────────────────────┐
│ Deterministic Application Logic │
│                                  │
│ Risk                             │
│ Intervention                     │
│ Recovery Eligibility             │
└────────────────┬─────────────────┘
                 │
                 │ authoritative context
                 ▼
┌──────────────────────────────────┐
│               AI                 │
│                                  │
│ Diagnosis                        │
│ Recommendation                   │
│ Reason                           │
│ Confidence                       │
│ Customer Message                 │
└────────────────┬─────────────────┘
                 │
                 │ analysis only
                 ▼
┌──────────────────────────────────┐
│      Bounded Execution Layer     │
│                                  │
│ Executed / Stopped / Escalated  │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│          MySQL Audit             │
└──────────────────────────────────┘
```

The AI does not directly execute a recovery action.

---

# 13. Individual Recovery Flow

The individual recovery flow begins from a case page.

```text
User
 │
 ▼
Case Page
 │
 ▼
Analyze Recovery
 │
 ▼
/api/recovery
 │
 ├── Fetch Case
 ├── Determine Intervention
 ├── Create Recovery Plan
 └── Request AI Analysis
 │
 ▼
Analysis Display
 │
 ▼
Execute Recovery
 │
 ▼
/api/recovery/execute
 │
 ├── Fetch Case
 ├── Check Existing Execution
 ├── Create Recovery Plan
 ├── Execute Bounded Action
 └── Persist Audit
 │
 ▼
Execution Result
 │
 ▼
Recovery Audit
```

The analysis endpoint is separate from the execution endpoint.

This allows the user interface to present the recovery reasoning before the bounded action is executed.

---

# 14. Individual Execution Idempotency

The individual execution endpoint checks:

```text
recovery_executions
```

for an existing execution belonging to the requested case.

The lookup is performed before creating a new execution.

Conceptually:

```text
Execute Request
      │
      ▼
Existing Execution?
      │
      ├── Yes ──► Return Existing Execution
      │
      └── No
           │
           ▼
      Execute Action
           │
           ▼
      Persist Audit
```

If an execution already exists, the endpoint returns the existing execution information and marks the response as already executed.

This prevents repeated individual execution from generating additional audit records for the same case.

---

# 15. Bounded Execution Architecture

The execution layer is implemented separately from the recovery plan.

It evaluates two important conditions:

```text
Case Eligibility
+
Recovery Plan Readiness
```

The execution logic supports:

```text
executed
stopped
escalated
```

The execution layer also maintains an explicit set of supported automated recovery actions.

Supported automated actions are:

```text
payment_retry
checkout_recovery
subscription_recovery
```

`manual_review` is handled as an escalation.

Unsupported actions are not automatically executed.

---

# 16. Execution Decision Flow

The execution layer follows this general decision structure:

```text
                    Recovery Request
                           │
                           ▼
                  Is Case Eligible?
                     /          \
                   No            Yes
                   │              │
                   ▼              ▼
                STOPPED      Is Plan Ready?
                               /        \
                             No          Yes
                             │            │
                             ▼            ▼
                          STOPPED    Is manual_review?
                                       /          \
                                     Yes            No
                                     │              │
                                     ▼              ▼
                                  ESCALATED    Is Action
                                               Supported?
                                                /     \
                                              No       Yes
                                              │          │
                                              ▼          ▼
                                           STOPPED    EXECUTED
```

Every resulting execution produces an audit object.

---

# 17. Recovery Audit Architecture

The execution layer creates a recovery audit containing:

```text
caseId
action
status
amountRecovered
reason
timestamp
```

The API persists the relevant fields into MySQL:

```text
recovery_executions
```

This creates a persistent record of recovery activity.

The UI can subsequently retrieve this history through:

```text
GET /api/recovery/execute
```

and optionally filter it by case ID.

---

# 18. Batch Recovery Architecture

Batch recovery operates over the available cases.

For each case, the endpoint first checks whether an execution already exists.

```text
All Cases
    │
    ▼
For Each Case
    │
    ▼
Existing Execution?
    │
    ├── Yes ───────────────► Skipped
    │
    └── No
         │
         ▼
   Recovery Plan
         │
         ▼
   Bounded Execution
         │
         ├── Executed
         ├── Stopped
         └── Escalated
         │
         ▼
    Persist Audit
```

The batch endpoint tracks execution metrics while processing newly eligible cases.

---

# 19. Batch Metrics

The batch endpoint reports:

```text
casesProcessed
casesRecovered
casesStopped
casesEscalated
casesSkipped
revenueAtRisk
revenueRecovered
recoveryRate
executions
hasNewExecutions
message
```

The recovery rate is calculated as:

```text
revenueRecovered / revenueAtRisk × 100
```

when revenue at risk is greater than zero.

If there is no revenue at risk, the recovery rate is reported as zero.

---

# 20. Repeated Batch Execution

Batch execution is protected against duplicate processing by checking the recovery execution history before executing each case.

The behavior is therefore:

```text
First Batch Run
       │
       ▼
New Cases
       │
       ▼
Execute + Audit
```

followed by:

```text
Second Batch Run
       │
       ▼
Existing Execution Records
       │
       ▼
Skip Cases
```

No additional execution audit rows are created for already-processed cases.

The dashboard retains the previously calculated batch performance metrics when a later run contains no new executions while updating the skipped count.

This allows repeated batch requests to communicate that the cases were already processed without erasing the previous batch result.

---

# 21. Dashboard Architecture

The dashboard combines persistent case information with recovery metrics.

The primary summary metrics are:

```text
Revenue at Risk
High-Risk Cases
Currently Recovering
```

The recovery performance section displays:

```text
Revenue at Risk
Revenue Recovered
Recovery Rate
Cases Processed
Recovered
Stopped
Escalated
Skipped
```

The case table displays:

```text
Customer
Issue
Amount
Risk
Status
Recovery
```

Selecting a case opens its case-specific recovery workflow.

---

# 22. Data Flow

The major application data flow can be summarized as:

```text
                     MySQL
                       │
                       │ case data
                       ▼
                 Next.js Web App
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
     Recovery Pipeline        AI Service
            │                     │
            │                     ▼
            │                  Ollama
            │                     │
            │                     ▼
            │                 Qwen 3:4B
            │                     │
            └──────────┬──────────┘
                       │
                       ▼
                Bounded Execution
                       │
                       ▼
                  Recovery Audit
                       │
                       ▼
                     MySQL
```

The database therefore participates at both ends of the recovery lifecycle:

```text
Read Case
   ↓
Process Case
   ↓
Persist Execution
```

---

# 23. Source-of-Truth Boundaries

Reclaim deliberately separates different kinds of authority.

| Information | Authority |
|---|---|
| Case data | MySQL |
| Persisted risk score | MySQL |
| Intervention selection | Deterministic application logic |
| Recovery eligibility | Recovery engine |
| AI diagnosis | AI service |
| AI explanation | AI service |
| Recovery execution | Bounded execution layer |
| Execution history | MySQL |
| Recovery metrics | Batch execution flow |

This separation prevents the AI layer from becoming the source of truth for business-critical execution decisions.

---

# 24. Failure and Safety Boundaries

The architecture includes several boundaries intended to prevent uncontrolled recovery behavior.

### Case eligibility

A case that is not `at_risk` is stopped.

### Recovery plan readiness

A plan that is not ready is not executed.

### Supported action validation

Only explicitly supported automated recovery actions can be executed.

### Manual review

`manual_review` produces escalation rather than automated recovery.

### Existing execution detection

Previously executed cases are skipped or returned as already executed rather than being executed again.

### AI constraints

The AI is instructed to preserve the supplied risk score and intervention and is not given direct execution authority.

---

# 25. Local AI Infrastructure

The AI architecture uses a local model runtime:

```text
Ollama
```

with:

```text
Qwen 3:4B
```

The FastAPI container communicates with the host Ollama instance through:

```text
host.docker.internal
```

The model therefore does not need to be packaged inside the AI Docker image.

The AI container instead contains the application code and Python dependencies required to communicate with Ollama.

---

# 26. Container Communication

The Compose network provides service-to-service communication.

The web application uses:

```text
mysql:3306
```

for MySQL.

The web application uses:

```text
ai:8000
```

for the FastAPI AI service.

The AI service uses:

```text
host.docker.internal:11434
```

for Ollama.

Conceptually:

```text
reclaim-web
    │
    ├──────────────► reclaim-mysql:3306
    │
    └──────────────► reclaim-ai:8000
                           │
                           ▼
                  host.docker.internal:11434
                           │
                           ▼
                         Ollama
```

---

# 27. Architectural Summary

The final Reclaim architecture can be summarized as:

```text
┌──────────────────────────────────────────────────────┐
│                    USER INTERFACE                    │
│                       Next.js                        │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                 APPLICATION LOGIC                    │
│                                                      │
│  Risk Engine → Intervention → Recovery Plan         │
└──────────────────────────┬───────────────────────────┘
                           │
              ┌────────────┴─────────────┐
              │                          │
              ▼                          ▼
┌─────────────────────────┐   ┌────────────────────────┐
│      AI ANALYSIS        │   │   BOUNDED EXECUTION    │
│                         │   │                        │
│ FastAPI → Ollama        │   │ Executed               │
│          → Qwen 3:4B    │   │ Stopped                │
│                         │   │ Escalated              │
└─────────────────────────┘   └───────────┬────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │       MySQL             │
                              │                         │
                              │ Cases                   │
                              │ Recovery Executions     │
                              │ Audit History           │
                              └────────────────────────┘
```

The architecture is built around a controlled separation of responsibility:

```text
Deterministic logic
        ↓
defines the recovery decision

AI
        ↓
analyzes and communicates that decision

Bounded execution
        ↓
controls what can actually execute

MySQL
        ↓
persists the resulting state and audit history
```

This separation is the central architectural characteristic of Reclaim.