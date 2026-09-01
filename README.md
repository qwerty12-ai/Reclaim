# Reclaim

### AI-Powered Revenue Recovery

Reclaim is a revenue recovery system designed to identify revenue at risk, determine an appropriate recovery intervention, analyze the case with a local language model, and execute bounded recovery actions while maintaining a persistent audit trail.

The system combines deterministic recovery logic with AI-assisted analysis.

The application determines the recovery intervention.

The AI analyzes and explains that intervention.

The execution layer enforces bounded recovery behavior.

MySQL provides persistent case and recovery execution data.

---

## Overview

Revenue can be placed at risk by events such as payment failures, checkout abandonment, and subscription failures.

Reclaim models the recovery process as a controlled pipeline:

```text
Revenue Case
     │
     ▼
Risk / Case Data
     │
     ▼
Intervention Decision
     │
     ▼
Recovery Plan
     │
     ├──────────────► AI Analysis
     │                    │
     │                    ▼
     │             Diagnosis / Reason
     │             Confidence / Message
     │
     ▼
Bounded Recovery Execution
     │
     ▼
Recovery Audit
     │
     ▼
Recovery Measurement
```

The core design principle is:

> **AI assists with analysis and communication, while deterministic application logic controls recovery decisions and execution.**

---

## Key Features

### Deterministic Risk Scoring

Reclaim contains a deterministic risk engine that calculates a risk score from case attributes such as issue type and transaction amount.

Risk scoring is handled by application logic rather than delegated to the language model.

The persisted case `risk_score` is treated as the authoritative risk value in the final recovery and AI-analysis flow.

### Recovery Decisioning

The intervention engine maps supported case types to recovery actions:

- `payment_retry`
- `checkout_recovery`
- `subscription_recovery`
- `manual_review`

The recovery engine then determines whether the case is currently eligible for recovery.

### AI-Assisted Analysis

Reclaim uses a local Qwen 3:4B model through Ollama.

The model is exposed through a dedicated FastAPI service.

The AI receives the case data together with the intervention selected by the application and produces:

- diagnosis
- recommendation
- reason
- confidence
- customer recovery message

The AI is instructed to preserve the authoritative risk score and return the application's intervention rather than independently selecting another recovery action.

### Bounded Recovery Execution

Recovery execution supports three outcomes:

- `executed`
- `stopped`
- `escalated`

Automated execution is limited to explicitly supported recovery actions.

Cases that are no longer eligible for recovery are stopped.

Cases requiring manual review are escalated.

Recovery actions are simulated rather than connected to a real payment processor.

### Execution Audit

Every recovery execution produces an audit record containing:

- case ID
- action
- status
- amount recovered
- reason
- timestamp

These records are persisted in MySQL through the `recovery_executions` table.

### Individual Recovery Idempotency

Before executing an individual recovery, Reclaim checks whether an execution already exists for the case.

If the case has already been processed, the existing execution is returned instead of creating another execution record.

### Batch Recovery

Reclaim supports batch recovery across the available cases.

Previously processed cases are skipped, preventing additional execution records from being created for those cases.

The batch workflow measures:

- cases processed
- cases recovered
- cases stopped
- cases escalated
- cases skipped
- revenue at risk
- revenue recovered
- recovery rate

---

# System Architecture

Reclaim runs as a three-service Docker Compose stack:

```text
                         Reclaim
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

### Web Application

The Next.js application provides the user-facing recovery experience, including:

- landing page
- recovery dashboard
- revenue case listing
- case details
- recovery analysis
- individual recovery execution
- batch recovery
- recovery performance metrics
- recovery audit history

### MySQL Database

MySQL stores the application's persistent data, including:

- revenue cases
- customer information
- transaction amounts
- issue types
- case status
- risk scores
- recovery execution records
- recovered amounts
- execution reasons
- timestamps

### FastAPI AI Service

The AI service provides the `/analyze` endpoint used by the web application.

It communicates with Ollama and uses Qwen 3:4B to generate structured recovery analysis.

The AI service is separated from the deterministic recovery and execution logic.

---

# Recovery Workflow

The complete recovery workflow consists of several stages.

## 1. Case

A case represents a revenue recovery opportunity.

A case contains information such as:

- customer
- transaction amount
- currency
- issue type
- status
- risk score
- timestamps

The cases are stored in MySQL.

---

## 2. Risk Engine

The deterministic risk engine calculates a numeric risk score from the case attributes.

The current implementation considers:

- issue type
- transaction amount

The result is bounded to a maximum score of `100`.

The final recovery flow preserves the database-provided risk score as the authoritative value rather than silently replacing it with a newly calculated value.

---

## 3. Intervention Engine

The intervention engine determines which recovery action corresponds to the case's issue type.

The current mappings include:

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

Unknown or unsupported issue types fall back to:

```text
manual_review
```

---

## 4. Recovery Engine

The recovery engine creates a recovery plan from the case and its intervention.

A case is eligible for a ready recovery plan when its status is:

```text
at_risk
```

Cases that are not currently eligible receive a stopped recovery plan.

---

## 5. AI Analysis

The web application sends the case and the authoritative intervention to the AI service.

The AI receives:

```text
Case Data
+
Authoritative Risk Score
+
Authoritative Intervention
```

The AI is explicitly instructed not to:

- calculate another risk score
- modify the supplied risk score
- replace the authoritative intervention
- invent unsupported case information
- execute a recovery action
- claim that money has already been recovered

The resulting analysis contains:

```text
diagnosis
recommendation
reason
confidence
customer_message
```

The AI therefore functions as an analysis and communication layer rather than an unrestricted recovery controller.

---

## 6. Bounded Execution

The execution layer evaluates the recovery plan and case state.

Possible outcomes are:

```text
executed
stopped
escalated
```

A supported automated recovery action produces an `executed` result in the simulation.

A case that is no longer eligible produces a `stopped` result.

A `manual_review` plan produces an `escalated` result.

The execution layer also creates the recovery audit object.

---

## 7. Audit

The resulting execution is persisted in the `recovery_executions` table.

This provides a durable record of what happened rather than relying only on temporary UI state.

---

## 8. Measurement

Batch recovery calculates recovery metrics from newly executed cases.

The system reports:

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

This provides a measurable view of the simulated recovery process.

---

# Individual Recovery

Individual recovery is performed from a case page.

The workflow is:

```text
Open Case
    │
    ▼
Analyze Recovery
    │
    ├── Intervention
    ├── Recovery Plan
    └── AI Analysis
    │
    ▼
Execute Recovery
    │
    ▼
Persist Audit
    │
    ▼
Display Execution History
```

The execution endpoint checks the recovery execution history before performing a new execution.

If the case has already been executed, the existing execution is returned.

This prevents repeated individual execution from producing additional recovery audit records.

---

# Batch Recovery

Batch recovery processes all available cases.

For each case:

```text
Case
 │
 ├── Existing execution?
 │       │
 │       ├── Yes ──► Skip
 │       │
 │       └── No
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

Running the batch operation again does not create additional recovery execution records for cases that have already been processed.

The UI retains the previous batch performance metrics when a subsequent batch run contains no new executions while updating the skipped-case count.

---

# AI Architecture

The AI component is intentionally separated from the application's business-critical recovery decisions.

```text
                Next.js
                   │
                   │ case + intervention
                   ▼
             FastAPI /analyze
                   │
                   ▼
             Ollama Client
                   │
                   ▼
               Qwen 3:4B
                   │
                   ▼
        Structured AI Analysis
```

The FastAPI service validates the generated response using Pydantic.

The response contains:

```text
diagnosis
recommendation
reason
confidence
customer_message
```

The service also checks the recommendation against the supported recovery actions.

The AI therefore contributes contextual intelligence while remaining constrained by the application's deterministic recovery pipeline.

---

# Technology Stack

| Layer | Technology |
|---|---|
| Web application | Next.js |
| Application language | TypeScript |
| Styling | Tailwind CSS |
| Database | MySQL 8.4 |
| Database client | mysql2 |
| AI API | FastAPI |
| AI validation | Pydantic |
| Local model runtime | Ollama |
| Language model | Qwen 3:4B |
| Web container | Node.js 22 |
| AI container | Python 3.12 |
| Container orchestration | Docker Compose |

---

# Project Structure

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

---

# Docker Compose

The application is containerized as three services:

```text
reclaim-web
reclaim-ai
reclaim-mysql
```

The services communicate through the Docker Compose network.

The web application communicates with MySQL using the MySQL service name rather than relying on a host-local database connection.

The web application communicates with the AI service through the internal service URL.

The AI service communicates with the host's Ollama instance through the configured host gateway.

This allows the application stack to run as a coordinated multi-service environment while keeping the language model runtime separate from the application containers.

---

## Continuous Integration

Reclaim uses GitHub Actions to validate changes automatically.

On every push to `main` and pull request targeting `main`, the CI workflow:

- Installs and builds the Next.js web application.
- Builds the AI service Docker image.
- Validates the Docker Compose configuration.
- Builds the Docker Compose services.

The current workflow provides CI validation only. Production deployment and continuous delivery are intentionally outside the current setup.

---

# Running Reclaim

## Prerequisites

Install:

- Docker
- Docker Compose
- Ollama
- Qwen 3:4B through Ollama

The AI service expects Ollama to be available through the configured host connection.

---

## Start the Stack

From the repository root:

```bash
docker compose up --build -d
```

This builds and starts the application services.

The web application is available at:

```text
http://localhost:3000
```

The FastAPI service is available at:

```text
http://localhost:8000
```

FastAPI's interactive API documentation is available at:

```text
http://localhost:8000/docs
```

---

## Stop the Stack

```bash
docker compose down
```

---

## Recreate the Database

To remove the persisted MySQL volume and recreate the database from the schema and seed files:

```bash
docker compose down -v
docker compose up --build -d
```

> **Warning:** `docker compose down -v` removes the MySQL volume and therefore deletes the persisted database data.

---

# Demonstration Workflow

A complete individual recovery demonstration can be performed as follows:

```text
Open Dashboard
      │
      ▼
Select Revenue Case
      │
      ▼
Analyze Recovery
      │
      ├── Review Risk
      ├── Review Intervention
      ├── Review Recovery Plan
      └── Review AI Analysis
      │
      ▼
Execute Recovery
      │
      ▼
Review Execution
      │
      ▼
Review Recovery Audit
```

The batch workflow can then be demonstrated:

```text
Run Batch Recovery
      │
      ▼
Review Recovery Metrics
      │
      ▼
Run Batch Recovery Again
      │
      ▼
Previously Processed Cases
      │
      ▼
Skipped
```

The seeded demonstration scenarios allow the recovery system to demonstrate successful execution, stopped recovery, escalation, and repeated-execution protection.

For the detailed demonstration procedure and expected results, see:

`docs/demo.md`

---

# Engineering Principles

## Deterministic Business Logic

Business-critical recovery decisions are handled by deterministic application code.

The AI is not responsible for independently deciding which unsupported recovery action should be executed.

## Authoritative Risk Scores

The persisted case risk score is treated as authoritative throughout the final recovery and analysis flow.

This prevents AI-generated or separately calculated values from silently replacing the application's risk value.

## AI as an Analysis Layer

The AI provides:

- diagnosis
- explanation
- confidence
- customer communication

The application remains responsible for recovery decisioning and execution.

## Bounded Execution

Only explicitly supported automated recovery actions can be executed.

Manual review is represented as escalation rather than automated execution.

## Recovery Stopping

Cases that are no longer eligible for recovery are stopped rather than blindly processed.

## Persistent Auditability

Recovery executions are persisted in MySQL so that execution history can be inspected after the operation.

## Execution Idempotency

Previously executed cases are not executed again through the individual recovery flow.

Batch recovery similarly skips cases that already have recovery execution records.

## Reproducible Infrastructure

Docker Compose defines the web application, AI service, and database as a coordinated local stack.

---

# Current Scope

Reclaim is an engineering and demonstration project for controlled revenue recovery.

The current implementation uses seeded revenue cases.

Recovery actions are simulated and are not connected to a real payment processor.

The AI service uses a locally hosted Qwen 3:4B model through Ollama.

The system demonstrates the complete conceptual recovery lifecycle:

```text
Risk
  ↓
Intervention
  ↓
Recovery Plan
  ↓
AI Analysis
  ↓
Bounded Execution
  ↓
Audit
  ↓
Measurement
```

The architecture intentionally keeps these responsibilities separate.

---

# Documentation

Additional documentation is organized as follows:

### `docs/architecture.md`

Detailed explanation of the system architecture, service boundaries, data flow, and recovery pipeline.

### `docs/decisions.md`

Engineering decisions, constraints, trade-offs, and the reasoning behind important implementation choices.

### `docs/demo.md`

Step-by-step demonstration of the application's recovery workflows and expected behavior.

### `services/ai/README.md`

Documentation for the FastAPI AI service, including its API, Ollama integration, Qwen 3:4B model usage, and structured analysis response.

### `src/` Web Application

The web application's source code contains the Next.js application, UI components, database/AI communication utilities, deterministic recovery services, and shared domain types.

---

# Design Philosophy

Reclaim is built around a controlled division of responsibility:

```text
┌──────────────────────────────────────┐
│       Deterministic Application      │
│                                      │
│  Risk → Intervention → Recovery Plan │
└──────────────────┬───────────────────┘
                   │
                   │ authoritative context
                   ▼
┌──────────────────────────────────────┐
│                 AI                   │
│                                      │
│ Diagnosis → Reason → Confidence      │
│ Customer Recovery Message            │
└──────────────────────────────────────┘

                   │
                   ▼

┌──────────────────────────────────────┐
│       Bounded Execution Layer        │
│                                      │
│ Executed / Stopped / Escalated       │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│             MySQL Audit              │
│                                      │
│ Persistent Recovery Execution History│
└──────────────────────────────────────┘
```

The goal is not to give an AI model unrestricted control over revenue recovery.

The goal is to combine AI-assisted reasoning with deterministic business rules, bounded execution, persistent auditing, and measurable recovery outcomes.

---

# Reclaim

> **Recover revenue intelligently. Execute within boundaries. Keep every recovery measurable and auditable.**