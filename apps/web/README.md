# Reclaim Web Application

The Reclaim Web Application is the primary application interface for the Reclaim revenue recovery system.

It provides the dashboard, case views, recovery analysis workflow, recovery execution interface, audit history, and batch recovery metrics.

The web application is built with Next.js and acts as the main orchestration layer between the user interface, the recovery engines, the AI service, and the database.

---

## 1. Technology Stack

The web application uses:

- Next.js
- React
- TypeScript
- Tailwind CSS
- MySQL
- FastAPI AI Service
- Docker

The application is packaged as a standalone Next.js production build and runs inside a production container.

---

## 2. Application Structure

The web application is organized under the `src` directory:

```text
src/
│
├── app/
│   ├── api/
│   ├── cases/
│   ├── dashboard/
│   └── page.tsx
│
├── components/
│   └── dashboard/
│
├── lib/
│   ├── ai/
│   ├── db/
│   └── recovery/
│
├── services/
│
├── types/
│
├── Dockerfile
└── .dockerignore
```

The main areas of the application are separated by responsibility:

```text
app/
    Application pages and API routes

components/
    Reusable user-interface components

lib/
    Database, AI, and recovery-related application utilities

services/
    Deterministic recovery engines

types/
    Shared TypeScript domain types
```

---

# 3. Application Pages

## Landing Page

The root page introduces Reclaim as an AI-powered revenue recovery system.

It presents the core workflow:

```text
Detect
   ↓
Diagnose
   ↓
Recover
   ↓
Measure
```

Users can navigate from the landing page to the recovery dashboard.

---

## Dashboard

The dashboard provides the primary operational view of the system.

It displays:

```text
Revenue at Risk
High-Risk Cases
Currently Recovering
```

It also displays the revenue recovery case table.

Each case contains:

```text
Customer
Issue
Amount
Risk
Status
Recovery
```

The dashboard also provides access to batch recovery.

---

## Case Page

Each case has its own page.

The case page displays:

```text
Customer
Email
Issue
Amount
Risk Score
Status
```

It also contains the complete recovery analysis and execution workflow.

---

# 4. API Layer

The Next.js application exposes API routes used by the frontend and internal application workflow.

The primary API areas are:

```text
/api/cases
/api/cases/[id]
/api/recovery
/api/recovery/execute
/api/recovery/batch
/api/health
```

---

# 5. Cases API

## Get Cases

```text
GET /api/cases
```

Returns the available revenue recovery cases from MySQL.

The dashboard uses this endpoint to populate the case table.

---

## Get Individual Case

```text
GET /api/cases/[id]
```

Returns a single case based on its ID.

The case page uses this endpoint to load the case details.

---

# 6. Recovery Analysis API

```text
POST /api/recovery
```

This endpoint coordinates recovery analysis for an individual case.

The flow is:

```text
Case
 ↓
Intervention Engine
 ↓
Recovery Plan
 ↓
AI Service
 ↓
Structured AI Analysis
 ↓
Response
```

The endpoint does not execute the recovery action.

It prepares the recovery decision and analysis for the user.

---

# 7. Recovery Execution API

```text
POST /api/recovery/execute
```

This endpoint executes a bounded recovery action for an individual case.

Before execution, it checks whether the case already has a persistent execution record.

The flow is:

```text
Execution Request
       ↓
Check Existing Execution
       ↓
Existing?
   ┌───┴───┐
  Yes      No
   │        │
   ▼        ▼
Return    Create
Existing  Recovery
Execution Plan
            │
            ▼
       Execute Bounded
          Recovery
            │
            ▼
        Create Audit
            │
            ▼
       Persist in MySQL
            │
            ▼
          Return
```

This protects the execution layer against repeated execution attempts.

---

# 8. Recovery Execution Idempotency

The execution route checks:

```text
recovery_executions
```

before performing a new execution.

If an execution already exists for the case, the existing record is returned.

The application therefore avoids creating multiple execution records for the same case.

Conceptually:

```text
First request
    ↓
Execute
    ↓
Persist audit
    ↓
1 execution record
```

Repeated request:

```text
Second request
    ↓
Existing execution detected
    ↓
Return existing execution
    ↓
No duplicate record
```

---

# 9. Recovery Audit

Recovery execution results are persisted in the:

```text
recovery_executions
```

table.

The audit records:

```text
Case
Action
Status
Amount Recovered
Reason
Timestamp
```

The audit history is exposed through:

```text
GET /api/recovery/execute
```

and can also be filtered by case:

```text
GET /api/recovery/execute?caseId=<id>
```

---

# 10. Batch Recovery

```text
POST /api/recovery/batch
```

The batch recovery endpoint processes all available cases.

For each case, it first checks for an existing execution.

Cases that have already been processed are skipped.

New cases are passed through:

```text
Recovery Plan
      ↓
Bounded Execution
      ↓
Audit Creation
      ↓
MySQL Persistence
```

The endpoint returns:

```text
Cases Processed
Cases Recovered
Cases Stopped
Cases Escalated
Cases Skipped
Revenue at Risk
Revenue Recovered
Recovery Rate
```

---

# 11. Batch Recovery Idempotency

Batch recovery is designed to avoid duplicate execution records.

If the batch endpoint is run again, previously processed cases are detected through the persistent execution table.

They are counted as:

```text
Skipped
```

rather than being executed again.

This makes repeated batch requests safe with respect to execution history.

---

# 12. Batch Metrics

The dashboard displays recovery performance using:

```text
Revenue at Risk
Revenue Recovered
Recovery Rate
```

and:

```text
Cases Processed
Recovered
Stopped
Escalated
Skipped
```

The recovery rate is calculated as:

```text
Revenue Recovered
----------------- × 100
 Revenue at Risk
```

The dashboard preserves the previous meaningful batch performance metrics when a later batch run contains no new executions while updating the skipped count.

This allows repeated batch attempts to communicate that previous recovery work remains recorded without presenting a new recovery operation as if it occurred.

---

# 13. Recovery Analysis UI

The recovery analysis component provides the interactive recovery workflow on the case page.

It handles:

```text
Analyze Recovery
Execute Recovery
Recovery Result
Audit History
```

The analysis interface displays:

```text
Intervention
Recovery Plan
AI Analysis
```

The AI section displays:

```text
Diagnosis
Recommendation
Reason
Confidence
Customer Recovery Message
```

---

# 14. Individual Recovery Workflow

From the user's perspective, an individual recovery follows:

```text
Open Case
    ↓
Analyze Recovery
    ↓
Review Intervention
    ↓
Review Recovery Plan
    ↓
Review AI Analysis
    ↓
Execute Recovery
    ↓
View Execution
    ↓
View Audit
```

The interface separates analysis from execution.

The AI analysis does not itself trigger recovery.

---

# 15. Recovery Engines

The application contains deterministic services that define the recovery workflow.

The main engine responsibilities are:

```text
Risk Engine
Intervention Engine
Recovery Engine
```

---

## Risk Engine

The risk engine provides deterministic risk calculation logic.

It evaluates case characteristics such as:

```text
Issue Type
Transaction Amount
```

and produces a numerical risk score.

The persisted case risk score is treated as the authoritative value throughout the recovery analysis workflow.

---

## Intervention Engine

The intervention engine maps issue types to recovery interventions.

Examples include:

```text
payment_failure
        ↓
payment_retry
```

```text
checkout_abandonment
        ↓
checkout_recovery
```

```text
subscription_failure
        ↓
subscription_recovery
```

Unknown or unsupported issue types fall back to:

```text
manual_review
```

---

## Recovery Engine

The recovery engine converts the case and intervention into a recovery plan.

A plan can be:

```text
ready
```

or:

```text
stopped
```

Cases that are no longer eligible for recovery are stopped rather than automatically executed.

---

# 16. Bounded Recovery Execution

The execution layer is implemented separately from the recovery planning logic.

It supports bounded recovery actions such as:

```text
payment_retry
checkout_recovery
subscription_recovery
```

Manual review is handled as:

```text
escalated
```

Unsupported automated actions are not executed.

The execution layer can therefore produce:

```text
executed
stopped
escalated
```

This keeps the system's execution behavior constrained to explicitly supported actions.

---

# 17. AI Integration

The web application communicates with the separate Reclaim AI Service.

The AI integration is contained within the application's library layer.

The application sends:

```text
Case Data
+
Authoritative Intervention
```

to the AI service.

The AI service returns structured analysis.

The web application then displays that analysis to the user.

The AI service does not directly access the web application's MySQL database.

---

# 18. Database Integration

The application uses MySQL through its database library.

The database connection is configured using environment variables:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Within Docker Compose, the web application connects to the MySQL service using the Compose service name:

```text
mysql
```

rather than localhost.

---

# 19. Environment Configuration

The web application expects:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
AI_SERVICE_URL
INTERNAL_API_URL
```

In the Docker Compose environment, the important internal service URLs are:

```text
AI_SERVICE_URL=http://ai:8000
INTERNAL_API_URL=http://web:3000
```

The database connection uses:

```text
DB_HOST=mysql
DB_PORT=3306
```

---

# 20. Docker Deployment

The web application uses a multi-stage Docker build.

The build consists of:

```text
Dependencies
     ↓
Build
     ↓
Production Runner
```

The production image uses:

```text
gcr.io/distroless/nodejs22-debian13
```

The Next.js application is configured for:

```text
standalone
```

This allows the production container to run the generated standalone server rather than carrying the complete development environment.

---

# 21. Production Container

The final web container exposes:

```text
3000
```

and starts the Next.js standalone server.

The production container receives the files required to run the built application:

```text
public/
.next/standalone/
.next/static/
```

This keeps the runtime image separate from the build environment.

---

# 22. Health Check

The application provides a database health endpoint:

```text
GET /api/health
```

The endpoint performs:

```sql
SELECT 1 as connected
```

and returns the database connection status.

This provides a simple operational check for the application's database connectivity.

---

# 23. Frontend Components

Dashboard-specific UI components are organized under:

```text
src/components/dashboard/
```

The primary interface responsibilities include:

```text
Dashboard Shell
Summary Cards
Case Table
Recovery Performance
Recovery Analysis
```

Their responsibilities are separated by interface concern.

Conceptually:

```text
Dashboard
      │
      ├── Summary
      ├── Recovery Performance
      └── Case Table

Case Page
      │
      └── Recovery Analysis
```

---

# 24. Data Flow

The overall web application data flow is:

```text
                 MySQL
                   │
                   ▼
              Cases API
                   │
                   ▼
              Dashboard
                   │
                   ▼
               Case Page
                   │
                   ▼
          Recovery Analysis API
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 Intervention Engine       AI Service
        │                     │
        ▼                     ▼
 Recovery Plan          AI Analysis
        │                     │
        └──────────┬──────────┘
                   ▼
             User Review
                   │
                   ▼
          Recovery Execution
                   │
                   ▼
          Bounded Executor
                   │
                   ▼
             Recovery Audit
                   │
                   ▼
                 MySQL
```

---

# 25. Responsibility Boundaries

The web application coordinates the system but does not give every component unrestricted authority.

The main responsibilities are:

```text
Risk Engine
    → deterministic risk calculation

Intervention Engine
    → determines intervention

Recovery Engine
    → creates recovery plan

AI Service
    → analysis and customer messaging

Execution Layer
    → bounded recovery execution

Database
    → persistent case and execution records

Dashboard
    → visualization and user interaction
```

This separation keeps the system understandable and auditable.

---

# 26. Development vs Production

For development, the application can be run using the normal Next.js development workflow.

For the demonstrated production-style environment, Reclaim is run through Docker Compose.

The Compose stack contains:

```text
Web
AI
MySQL
```

The web application communicates with the other services over the Docker network.

---

# 27. Running the Web Application

From the repository root:

```bash
docker compose up --build -d
```

Then open:

```text
http://localhost:3000
```

The web application is available through the Docker-exposed port.

---

# 28. Stopping the Web Application

To stop the Compose stack:

```bash
docker compose down
```

To remove the database volume and recreate the database from the schema and seed files:

```bash
docker compose down -v
```

Then rebuild:

```bash
docker compose up --build -d
```

---

# 29. Application Design Philosophy

The web application is designed around a controlled recovery pipeline rather than unrestricted automation.

The intended architecture is:

```text
Detect
  ↓
Understand
  ↓
Decide
  ↓
Analyze
  ↓
Bound
  ↓
Execute
  ↓
Audit
  ↓
Measure
```

Each stage has a defined responsibility.

AI contributes analysis and communication.

Deterministic application code remains responsible for the recovery controls and execution boundaries.

---

# 30. Summary

The Reclaim Web Application serves as the central interface and orchestration layer for the revenue recovery system.

It connects:

```text
Frontend
   │
   ├── Recovery APIs
   │
   ├── Deterministic Engines
   │
   ├── AI Service
   │
   ├── Bounded Execution
   │
   └── MySQL
```

The result is a complete recovery workflow that allows users to:

```text
View revenue-risk cases
        ↓
Analyze recovery
        ↓
Review AI-assisted reasoning
        ↓
Execute bounded recovery
        ↓
Persist audit history
        ↓
Measure recovery performance
        ↓
Safely repeat operations
```

The web application is therefore not merely a frontend for Reclaim.

It is the orchestration layer through which the deterministic recovery engines, AI analysis service, execution controls, persistence layer, and operational dashboard come together into a single revenue recovery workflow.