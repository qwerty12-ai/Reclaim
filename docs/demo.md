# Reclaim Demo Guide

This guide provides a step-by-step walkthrough for running Reclaim locally and demonstrating its revenue recovery workflow.

It is intended for anyone evaluating or reviewing the project who wants to run the application and see the complete recovery flow in action.

---

## 1. Prerequisites

Before starting Reclaim, make sure you have:

- Docker
- Docker Compose
- Ollama
- Qwen 3:4B

The AI service uses Ollama running on the host machine.

The configured model is:

```text
qwen3:4b
```

---

## 2. Start Ollama

Make sure Ollama is running on the host machine and that the Qwen 3:4B model is available.

The AI container communicates with Ollama through:

```text
host.docker.internal:11434
```

---

## 3. Start the Reclaim Stack

From the root of the repository, run:

```bash
docker compose up --build -d
```

This starts the three services:

```text
reclaim-web
reclaim-mysql
reclaim-ai
```

The application uses the following internal service connections:

```text
web → mysql:3306
web → ai:8000
ai  → host.docker.internal:11434
```

---

## 4. Open Reclaim

Open:

```text
http://localhost:3000
```

The landing page introduces Reclaim and provides access to the recovery dashboard.

Select:

```text
Open Recovery Dashboard
```

---

## 5. Explore the Dashboard

The dashboard displays the seeded revenue recovery cases.

The summary section contains:

```text
Revenue at Risk
High-Risk Cases
Currently Recovering
```

The case table contains:

```text
Customer
Issue
Amount
Risk
Status
Recovery
```

Select a case to open its recovery workflow.

---

# 6. Analyze a Recovery Case

Open an eligible case and select:

```text
Analyze Recovery
```

Reclaim performs the following workflow:

```text
Case
 ↓
Intervention Engine
 ↓
Recovery Plan
 ↓
AI Service
 ↓
Ollama
 ↓
Qwen 3:4B
 ↓
Structured AI Analysis
```

The application first determines the intervention using deterministic application logic.

The AI service then receives the case information together with the authoritative intervention.

---

## 7. Review the Recovery Analysis

The case page displays three main sections:

```text
Intervention
Recovery Plan
AI Analysis
```

The AI analysis contains:

```text
Diagnosis
Recommendation
Reason
Confidence
Customer Recovery Message
```

The AI is instructed to preserve the supplied risk score and authoritative intervention.

The AI does not execute a recovery action.

---

# 8. Execute an Individual Recovery

For a case whose recovery plan is ready, the page displays:

```text
Execute Recovery
```

Select the button.

The execution flow is:

```text
Execute Request
       ↓
Check Existing Execution
       ↓
Create Recovery Plan
       ↓
Bounded Recovery Execution
       ↓
Create Audit
       ↓
Persist Audit in MySQL
       ↓
Return Execution Result
```

The execution result displays:

```text
Status
Action
Amount Recovered
Case
Execution Reason
```

The recovery itself is simulated.

No real customer payment is processed.

---

# 9. View the Recovery Audit

After execution, the case page displays the recovery audit.

The audit contains:

```text
Action
Status
Amount Recovered
Executed At
Reason
```

The execution is persisted in:

```text
recovery_executions
```

This allows the recovery history to remain available after leaving and returning to the case.

---

# 10. Verify Individual Idempotency

Try to execute recovery for the same case again.

Reclaim checks the persistent execution history before executing the action.

Because an execution already exists, the system returns the existing execution instead of creating another one.

The expected behavior is:

```text
First execution
      ↓
1 execution record
```

Then:

```text
Second execution attempt
      ↓
Existing execution detected
      ↓
No new execution
      ↓
Still 1 execution record
```

This prevents duplicate recovery execution records for the same case.

---

# 11. Observe a Stopped Recovery

Reclaim also supports recovery cases that are no longer eligible for execution.

A case that is not currently:

```text
at_risk
```

is not automatically executed.

Instead, the bounded execution layer produces:

```text
stopped
```

with:

```text
amountRecovered = 0
```

The execution reason explains why the recovery was stopped.

---

# 12. Observe an Escalated Recovery

Reclaim supports escalation through:

```text
manual_review
```

When a recovery plan requires manual review, the bounded execution layer does not attempt an automated recovery.

Instead, it produces:

```text
escalated
```

with:

```text
amountRecovered = 0
```

The execution is also recorded in the recovery audit.

This demonstrates that Reclaim distinguishes between:

```text
executed
stopped
escalated
```

---

# 13. Run Batch Recovery

Return to the dashboard and select:

```text
Run Batch Recovery
```

The batch recovery endpoint evaluates the available cases individually.

For each case, it first checks whether an execution already exists.

The flow is:

```text
All Cases
    ↓
Check Existing Execution
    ↓
 ┌───────────────┐
 │               │
Exists          New
 │               │
 ▼               ▼
Skip       Recovery Pipeline
                 │
                 ▼
          Bounded Execution
                 │
                 ▼
             Persist Audit
```

The dashboard displays:

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

---

# 14. Run Batch Recovery Again

Select:

```text
Run Batch Recovery
```

a second time.

Cases that already have recovery execution records are detected and skipped.

The second run therefore does not create duplicate execution records.

The expected behavior is:

```text
Previously processed cases
        ↓
Skipped
        ↓
No duplicate execution rows
```

The dashboard retains the previous meaningful batch performance metrics while updating the skipped count.

This allows the dashboard to show that a previous recovery operation produced measurable results while the current request found no new cases to execute.

---

# 15. Verify Persistent Execution Records

The MySQL container can be inspected directly.

Run:

```bash
docker exec -it reclaim-mysql mysql -uroot -preclaim_root reclaim
```

Then query:

```sql
SELECT
    case_id,
    action,
    status,
    amount_recovered,
    reason,
    created_at
FROM recovery_executions
ORDER BY created_at DESC;
```

The execution table should contain one persistent record for each case that has been processed.

Repeated individual or batch execution attempts should not create duplicate records for already-processed cases.

---

# 16. Verify Risk Score Consistency

Select a case with a known persisted risk score.

For example:

```text
case-001
```

The seeded case contains:

```text
risk_score = 82
```

That value should remain consistent throughout the recovery workflow.

The value is represented through:

```text
Database
   ↓
Case Page
   ↓
Recovery Analysis
   ↓
AI Analysis
```

The AI service is explicitly instructed not to calculate or replace the supplied risk score.

This keeps the persisted case risk score authoritative.

---

# 17. Observe the AI Boundary

The AI layer contributes:

```text
Diagnosis
Recommendation
Reason
Confidence
Customer Message
```

The application remains responsible for:

```text
Risk Authority
Intervention Selection
Recovery Eligibility
Execution
Audit Persistence
```

The resulting architecture is:

```text
Deterministic Application Logic
            ↓
      Authoritative Context
            ↓
            AI
            ↓
      Analysis / Messaging
            ↓
     Bounded Execution
            ↓
          MySQL
```

The AI therefore assists the recovery workflow without receiving direct authority to execute recovery actions.

---

# 18. Complete Demonstration Flow

The complete Reclaim experience can be demonstrated as:

```text
Start Docker Compose
        ↓
Open Reclaim
        ↓
Open Dashboard
        ↓
Select Case
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
View Execution Result
        ↓
View Recovery Audit
        ↓
Repeat Execution
        ↓
Observe Idempotency
        ↓
Run Batch Recovery
        ↓
Review Recovery Metrics
        ↓
Run Batch Again
        ↓
Observe Skipped Cases
        ↓
Verify Persistent Audit Records
```

---

# 19. What the Demo Demonstrates

Running the complete workflow demonstrates the major capabilities of Reclaim:

### Revenue-risk case management

The dashboard presents revenue cases with their issue, amount, status, and risk score.

### Deterministic recovery decisions

The application determines the intervention and recovery eligibility using application logic.

### AI-assisted analysis

The FastAPI service uses Ollama and Qwen 3:4B to generate structured recovery analysis.

### Bounded recovery execution

Only supported recovery actions can be automatically executed.

### Recovery stopping

Cases that are no longer eligible are stopped.

### Escalation

Cases requiring manual review are escalated instead of being automatically executed.

### Individual idempotency

Repeated execution of the same case does not create duplicate execution records.

### Batch idempotency

Repeated batch recovery skips cases that already have execution history.

### Persistent auditing

Recovery executions are stored in MySQL.

### Recovery measurement

The batch workflow measures recovered revenue and recovery rate.

---

# 20. Important Demo Boundary

Reclaim demonstrates recovery execution using a simulation.

The system does not connect to a real payment provider and does not move real customer funds.

The simulated execution allows the project to demonstrate the complete workflow:

```text
Detect
  ↓
Analyze
  ↓
Determine Intervention
  ↓
Create Recovery Plan
  ↓
Execute Bounded Action
  ↓
Audit
  ↓
Measure
```

without introducing real financial transactions.

---

# 21. Stopping the Application

When finished with the demonstration, stop the Compose stack with:

```bash
docker compose down
```

This stops and removes the running containers while preserving the named MySQL volume.

If a completely fresh database is required for another demonstration, use:

```bash
docker compose down -v
```

and then:

```bash
docker compose up --build -d
```

The database will be recreated from:

```text
database/schema.sql
database/seed.sql
```

---

# 22. Demo Summary

Reclaim can be demonstrated as a complete revenue recovery lifecycle:

```text
Revenue Case
     ↓
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
Persistent Audit
     ↓
Recovery Measurement
```

The demonstration shows how deterministic recovery logic, local AI analysis, bounded execution, persistent auditing, and batch measurement work together as one system.