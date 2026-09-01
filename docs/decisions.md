# Reclaim Architecture Decisions

This document records the major technical and architectural decisions made while building Reclaim.

The purpose is not to describe every implementation detail, but to explain **why the system was designed this way**, what responsibilities belong to each layer, and which constraints were intentionally preserved.

---

## 1. Deterministic Recovery Decisions

### Decision

Recovery decisions that control execution remain deterministic.

The application determines:

- risk information
- intervention
- recovery-plan eligibility
- supported recovery actions
- whether an action should execute, stop, or escalate

The AI layer does not independently decide what action the system is allowed to execute.

### Reason

Revenue recovery is a business-critical workflow.

Allowing an LLM to independently choose and execute financial recovery actions would make the system difficult to reason about and control.

The deterministic application layer therefore establishes the authoritative recovery context before execution.

### Result

The architecture separates:

```text
Decision
    ↓
Analysis
    ↓
Execution
```

rather than allowing the AI model to control the entire pipeline.

---

# 2. Risk Score Authority

### Decision

The persisted `risk_score` on a case is treated as the authoritative risk value throughout the recovery analysis and execution flow.

### Reason

The project contains a deterministic risk engine, but the application also stores a risk score with each case.

During the final architecture, the system was structured so that the stored case risk score is not silently replaced by a second interpretation of risk during AI analysis or recovery execution.

The AI service is explicitly instructed to use the supplied risk score and not calculate or modify another score.

### Result

The intended flow is:

```text
Case
 │
 └── risk_score
        │
        ▼
   Recovery Analysis
        │
        ▼
       AI
        │
        ▼
   Same Risk Score
```

The AI service returns the supplied risk score as part of its structured response.

---

# 3. AI as an Analysis Layer

### Decision

The AI service provides analysis and communication rather than direct recovery execution.

The AI is responsible for producing:

```text
diagnosis
recommendation
reason
confidence
customer_message
```

### Reason

An LLM is useful for interpreting the case, explaining the recovery situation, and generating customer-facing communication.

However, the model should not have unrestricted authority over financial actions.

The application therefore supplies the authoritative intervention to the model.

The AI is instructed to return that intervention rather than replace it with another recovery action.

### Result

The AI contributes intelligence without becoming the execution authority.

```text
Application
     │
     ├── Determines intervention
     │
     ▼
     AI
     │
     ├── Explains intervention
     ├── Provides diagnosis
     ├── Provides reasoning
     ├── Provides confidence
     └── Generates customer message
```

---

# 4. Structured AI Output

### Decision

The AI service uses a Pydantic model to define the expected response structure.

The response model contains:

```text
diagnosis
recommendation
reason
confidence
customer_message
```

### Reason

A structured response is more reliable for application integration than treating an LLM response as arbitrary text.

The AI service also uses structured output formatting when calling Ollama.

### Result

The AI response is validated before being returned to the web application.

The service additionally checks whether the returned recommendation belongs to the supported recovery actions.

Unsupported recommendations fall back to:

```text
manual_review
```

---

# 5. Bounded Recovery Execution

### Decision

Recovery actions are explicitly bounded by the execution layer.

The currently supported automated actions are:

```text
payment_retry
checkout_recovery
subscription_recovery
```

`manual_review` is treated as escalation rather than automated execution.

### Reason

The system should not execute arbitrary actions simply because a recovery plan or AI response contains an action string.

The execution layer provides the final control boundary.

### Result

The execution layer can produce only the defined execution states:

```text
executed
stopped
escalated
```

This creates an explicit safety boundary between recovery planning and actual execution.

---

# 6. Recovery Eligibility

### Decision

A case is eligible for automated recovery only when its status is:

```text
at_risk
```

### Reason

A recovery action should not automatically run against a case that is already in another lifecycle state.

For example, a case that is already:

```text
recovering
```

should not be treated as a new eligible recovery case.

### Result

Cases that are not currently eligible are stopped rather than executed.

This rule exists both at the recovery-plan level and within the bounded execution logic.

---

# 7. Individual Execution Idempotency

### Decision

The individual recovery execution endpoint checks for an existing execution record before executing a case.

### Reason

A user may click:

```text
Execute Recovery
```

more than once.

Without an idempotency check, every click could create another execution and another audit record.

That would make the recovery history inaccurate and could result in repeated execution of the same simulated recovery action.

### Result

The flow is:

```text
Execute Recovery
       │
       ▼
Existing execution?
   │           │
  Yes          No
   │            │
   ▼            ▼
Return       Execute
existing         │
record           ▼
              Persist
               audit
```

Repeated individual execution therefore returns the existing execution instead of creating another execution record.

---

# 8. Batch Execution Idempotency

### Decision

Batch recovery checks whether each case already has a recovery execution before processing it.

### Reason

Batch recovery can be run repeatedly.

Running the batch multiple times should not create duplicate execution records for cases that were already processed.

### Result

Previously executed cases are counted as:

```text
skipped
```

and are not executed again.

A subsequent batch run therefore preserves the existing execution history.

---

# 9. Persistent Recovery Audit

### Decision

Every actual recovery execution result is persisted in MySQL.

The `recovery_executions` table stores:

```text
id
case_id
action
status
amount_recovered
reason
created_at
```

### Reason

Recovery actions should be measurable and auditable.

The application should not rely only on temporary UI state to determine what happened.

### Result

The database provides persistent execution history that can be queried independently of the current UI state.

---

# 10. MySQL as the Persistent Source of Truth

### Decision

MySQL is the persistent source of truth for:

- revenue cases
- persisted risk scores
- recovery execution history

### Reason

The application needs durable state across page refreshes, repeated requests, and container restarts.

The UI is therefore treated as a representation of application state rather than the authority itself.

### Result

The core persistence model is:

```text
cases
   │
   ▼
recovery_executions
```

The recovery execution history remains available after the user leaves and returns to a case.

---

# 11. Docker Compose

### Decision

The application is containerized as a three-service Docker Compose stack.

```text
web
mysql
ai
```

### Reason

The project contains multiple cooperating services with different runtimes.

Docker Compose provides a simple way to run the complete local application as a connected system.

It also allows the project to demonstrate practical containerized service communication rather than running every component directly on the host.

### Result

The application can be started as a coordinated stack:

```text
Next.js
   │
   ├── MySQL
   │
   └── FastAPI AI
          │
          └── Ollama
```

---

# 12. Docker Network

### Decision

The Compose services communicate through a dedicated bridge network:

```text
reclaim-network
```

### Reason

The services need predictable internal communication.

The web service does not need to address the database through the host machine.

Instead, Docker service discovery allows it to communicate with:

```text
mysql
```

and:

```text
ai
```

using their Compose service names.

### Result

The internal service relationships are:

```text
web → mysql:3306
web → ai:8000
```

---

# 13. MySQL Container Credentials

### Decision

The containerized MySQL instance uses credentials defined for the Compose environment rather than relying on the user's separate host MySQL Workbench credentials.

The web container uses the same containerized database credentials.

### Reason

The Dockerized application needs a database that is independently reproducible as part of the Compose stack.

This avoids coupling the containerized application to the user's host MySQL installation.

It also allows the complete application environment to be recreated using Docker Compose.

### Result

The Dockerized architecture has its own:

```text
MySQL server
database
credentials
persistent volume
```

The MySQL Workbench connection to a host database is therefore not automatically the same database used by the containers.

---

# 14. MySQL Persistent Volume

### Decision

The MySQL data directory is backed by a Docker volume:

```text
mysql_data
```

### Reason

Container removal should not necessarily mean database data is lost.

A named volume allows MySQL data to persist independently of the MySQL container itself.

### Important Testing Behavior

For a completely fresh database during testing, the volume can intentionally be removed with:

```bash
docker compose down -v
```

This recreates the database from:

```text
schema.sql
seed.sql
```

on the next startup.

---

# 15. Database Initialization

### Decision

The MySQL container initializes the database using:

```text
database/schema.sql
database/seed.sql
```

These files are mounted into MySQL's initialization directory.

### Reason

The project needs a reproducible starting state for demonstrations and testing.

The schema establishes the database structure.

The seed file provides representative revenue recovery cases.

### Result

A fresh database can be recreated without manually entering the demonstration data.

---

# 16. Local Ollama Architecture

### Decision

The Qwen 3:4B model is accessed through Ollama rather than packaged directly into the AI Docker image.

### Reason

Large language models are substantially different from ordinary application dependencies.

Keeping the model runtime outside the AI container avoids embedding the model itself into the application image.

The FastAPI service only needs to communicate with Ollama.

### Result

The relationship is:

```text
FastAPI Container
       │
       ▼
host.docker.internal:11434
       │
       ▼
     Ollama
       │
       ▼
    Qwen 3:4B
```

---

# 17. AI Temperature

### Decision

The Ollama request uses:

```text
temperature: 0
```

### Reason

The AI service is performing structured case analysis rather than open-ended creative generation.

A lower temperature reduces unnecessary variation in the model's responses.

### Result

The model is encouraged to provide more consistent structured analysis while still generating natural-language diagnosis and customer messaging.

---

# 18. Distroless Production Web Image

### Decision

The final web container uses:

```text
gcr.io/distroless/nodejs22-debian13
```

### Reason

The production container does not need the development tooling or package-management environment used during the build.

The project therefore uses a multi-stage build:

```text
Dependencies
      ↓
Builder
      ↓
Distroless Runner
```

### Result

The production image contains the generated Next.js application and its required runtime rather than the full development environment.

---

# 19. Next.js Standalone Build

### Decision

Next.js is configured with:

```text
output: "standalone"
```

### Reason

The standalone output produces a deployable server representation containing the required runtime dependencies.

This works well with the multi-stage production container.

### Result

The final container runs the generated:

```text
server.js
```

rather than starting a development server.

---

# 20. Project Scope

### Decision

Reclaim focuses on the revenue recovery workflow rather than implementing a complete production billing platform.

The implemented system focuses on:

```text
Revenue-risk cases
        ↓
Recovery analysis
        ↓
Intervention
        ↓
Bounded recovery
        ↓
Audit
        ↓
Measurement
```

### Reason

The goal is to demonstrate the recovery intelligence and execution workflow.

Building a complete identity, billing, payment-provider, customer portal, and enterprise administration platform would significantly expand the scope beyond the core recovery problem.

### Result

The current application uses seeded cases to demonstrate the recovery lifecycle.

The seeded data represents the cases that the recovery system operates on.

---

# 21. No Direct AI Execution

### Decision

The AI service cannot directly execute recovery actions.

### Reason

The AI model is probabilistic.

The execution layer is deterministic.

Keeping these responsibilities separate makes the system easier to test, understand, and audit.

### Result

The architecture follows:

```text
AI
 │
 │ analysis
 ▼
Application
 │
 │ validated decision
 ▼
Execution Layer
 │
 ▼
Audit
```

rather than:

```text
AI
 │
 │ arbitrary action
 ▼
Database / Financial System
```

---

# 22. Simulation-Based Execution

### Decision

Recovery execution is implemented as a simulation.

When an automated recovery action executes successfully, the system records the case amount as the simulated recovered amount.

### Reason

The project demonstrates recovery orchestration and measurement without connecting to a real payment provider or moving real customer funds.

### Result

Execution responses explicitly describe successful recovery as occurring:

```text
in simulation
```

The AI prompt is also instructed not to claim that money has already been recovered.

---

# 23. Auditability Over Hidden State

### Decision

Recovery activity is represented through explicit execution records rather than relying entirely on UI state.

### Reason

A UI can be refreshed, closed, or recreated.

A database audit record provides persistent evidence of what the system actually recorded.

### Result

The execution history can be retrieved through the recovery execution API and displayed on the case page.

---

# 24. Final Architectural Principle

The major design principle behind Reclaim is:

```text
Deterministic logic
        ↓
establishes authority

AI
        ↓
adds analysis and communication

Bounded execution
        ↓
controls what can happen

MySQL
        ↓
records what happened
```

Each layer therefore has a defined responsibility.

The AI does not replace the deterministic recovery system.

The UI does not replace the database.

The recovery plan does not directly bypass execution controls.

The execution layer does not bypass audit persistence.

This separation is what allows Reclaim to combine deterministic recovery logic, local AI analysis, bounded execution, and measurable recovery outcomes in a single architecture.