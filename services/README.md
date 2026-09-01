# Reclaim AI Service

The Reclaim AI Service is the intelligence layer of the Reclaim revenue recovery system.

It provides structured, case-specific analysis using a local Large Language Model (LLM) while deliberately keeping financial recovery decisions and execution under deterministic application control.

The service is intentionally isolated from the main web application and communicates through a small HTTP API.

---

## 1. What This Service Does

The AI service analyzes a revenue-risk case and produces:

- Diagnosis
- Recovery recommendation
- Reasoning
- Confidence
- Customer-facing recovery message

The service does **not** execute recovery actions.

Instead, it receives an authoritative intervention from the Reclaim application and uses AI to explain and communicate that intervention.

The resulting responsibility boundary is:

```text
Reclaim Application
        │
        │ authoritative case + intervention
        ▼
   Reclaim AI Service
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

---

# 2. Why the AI Service Is Separate

The AI functionality is implemented as an independent FastAPI service rather than being embedded directly inside the Next.js application.

This creates a clear service boundary between:

```text
Web Application
```

and:

```text
AI Inference
```

The web application communicates with the AI service through HTTP.

This means the AI component can evolve independently from the frontend and application API layer.

The current architecture is:

```text
┌─────────────────────────┐
│       Next.js Web       │
│                         │
│ Recovery Application    │
└────────────┬────────────┘
             │
             │ POST /analyze
             ▼
┌─────────────────────────┐
│    FastAPI AI Service   │
│                         │
│ Case Analysis           │
│ Output Validation       │
│ AI Constraints          │
└────────────┬────────────┘
             │
             │ Ollama API
             ▼
┌─────────────────────────┐
│         Ollama          │
│                         │
│       Qwen 3:4B         │
└─────────────────────────┘
```

---

# 3. Technology Stack

The AI service uses:

```text
Python 3.12
FastAPI
Uvicorn
Ollama
Pydantic
Qwen 3:4B
```

The service is containerized using:

```text
python:3.12-slim
```

The model itself is not packaged inside the Docker image.

Instead, the service communicates with an Ollama instance running on the host machine.

---

# 4. Service Structure

The AI service is organized around a small application surface:

```text
services/ai/
│
├── app/
│   ├── main.py
│   ├── analyzer.py
│   └── test_analyzer.py
│
├── Dockerfile
├── .dockerignore
└── requirements.txt
```

### `main.py`

Defines the FastAPI application and HTTP endpoints.

### `analyzer.py`

Contains the core AI analysis logic.

This is where the service:

- receives case data
- constructs the analysis prompt
- communicates with Ollama
- validates structured output
- applies recommendation validation
- returns the final analysis

### `test_analyzer.py`

Provides a lightweight validation script for the analyzer.

---

# 5. API Endpoints

## Health Check

```text
GET /health
```

Returns:

```json
{
  "status": "ok",
  "service": "reclaim-ai"
}
```

This provides a simple way to determine whether the AI service is running.

---

## Service Home

```text
GET /
```

Returns basic service information and points to the FastAPI documentation.

---

## Case Analysis

```text
POST /analyze
```

This is the primary AI endpoint.

The web application sends the case data together with the intervention determined by the application.

---

# 6. Analysis Request

The web application sends a case containing information such as:

```text
Case ID
Customer
Amount
Currency
Issue Type
Status
Risk Score
```

It also sends:

```text
intervention_action
```

The intervention is determined by the Reclaim application before the AI request is made.

Conceptually:

```text
Case
  │
  ├── issue_type
  ├── amount
  ├── status
  └── risk_score
          │
          ▼
Intervention Engine
          │
          ▼
Authoritative Intervention
          │
          ▼
       AI Service
```

---

# 7. Structured AI Output

The service defines a Pydantic model:

```python
class RecoveryAnalysis(BaseModel):
    diagnosis: str
    recommendation: str
    reason: str
    confidence: float
    customer_message: str
```

This establishes the expected structure of the model response.

The resulting analysis contains:

```text
diagnosis
recommendation
reason
confidence
customer_message
```

The web application additionally receives:

```text
case_id
risk_score
```

as part of the final service response.

---

# 8. Structured Model Generation

The service requests structured output from Ollama using the Pydantic JSON schema:

```python
format=RecoveryAnalysis.model_json_schema()
```

The model therefore receives an explicit structure for the expected response.

After the model responds, the service validates the result with:

```python
RecoveryAnalysis.model_validate_json(...)
```

This creates a validation boundary between raw model output and the application response.

The flow is:

```text
LLM Output
    ↓
JSON Schema
    ↓
Pydantic Validation
    ↓
Application Response
```

---

# 9. Authoritative Risk Score

The AI service receives the case's existing risk score.

The prompt explicitly identifies this value as authoritative.

The model is instructed:

```text
Do not calculate, estimate, modify, or infer a different risk score.
```

The service then returns the supplied value:

```python
"risk_score": case.get("risk_score", 0)
```

The AI therefore does not become a second risk-scoring system.

The intended behavior is:

```text
Authoritative Case Risk
          │
          ▼
       AI Input
          │
          ▼
   Same Risk Score
          │
          ▼
     AI Response
```

This prevents an LLM-generated interpretation from silently replacing the application's persisted risk score.

---

# 10. Authoritative Intervention

The intervention is also supplied by the application.

The prompt explicitly instructs the model to return the provided intervention as its recommendation.

The AI is not asked to independently select an arbitrary recovery action.

The architecture is:

```text
Issue Type
    ↓
Intervention Engine
    ↓
Authoritative Intervention
    ↓
AI
    ↓
Explanation + Recommendation
```

This is an important distinction.

The AI adds intelligence to the recovery workflow without becoming the final authority over which recovery action the application is allowed to execute.

---

# 11. Supported Recovery Actions

The AI service defines the supported action set:

```python
ALLOWED_ACTIONS = {
    "payment_retry",
    "checkout_recovery",
    "subscription_recovery",
    "manual_review"
}
```

After model validation, the recommendation is checked against this set.

If the model returns an unsupported recommendation, the service falls back to:

```text
manual_review
```

This provides another validation boundary around model-generated output.

---

# 12. AI Execution Boundary

The AI service is explicitly instructed:

```text
Do not execute any recovery action.
```

It is also instructed not to claim that money has already been recovered.

This is important because the AI service is an analysis component, not a payment execution system.

The actual execution remains in the Reclaim application's bounded execution layer.

```text
                 AI Service
                     │
             Analysis only
                     │
                     ▼
             Web Application
                     │
                     ▼
            Bounded Executor
                     │
                     ▼
             Recovery Audit
```

---

# 13. Customer Recovery Messaging

One of the AI service's responsibilities is generating a customer-facing recovery message.

The prompt requires the message to:

- address the customer directly
- remain concise and professional
- explain the relevant issue
- avoid mentioning the internal risk score
- avoid mentioning internal system details
- avoid mentioning AI
- avoid claiming that money has already been recovered
- avoid guaranteeing payment success

This allows the model to provide a useful communication layer without exposing internal application details.

---

# 14. Model Configuration

The model is configured through environment variables.

```text
OLLAMA_MODEL=qwen3:4b
OLLAMA_HOST=http://host.docker.internal:11434
```

The Python service reads these values at runtime.

If no model is explicitly configured, the analyzer defaults to:

```text
qwen3:4b
```

The Ollama client is initialized using the configured host.

---

# 15. Temperature Configuration

The Ollama request uses:

```python
options={"temperature": 0}
```

The service performs structured case analysis rather than unrestricted creative generation.

A temperature of zero is therefore used to favor consistent model behavior.

---

# 16. FastAPI Application

The FastAPI application is intentionally small.

The service defines:

```python
app = FastAPI(title="Reclaim AI Service")
```

The primary endpoints are:

```text
GET /
GET /health
POST /analyze
```

The `/analyze` endpoint delegates the actual analysis to:

```text
analyze_case(...)
```

This keeps the HTTP layer separate from the analysis implementation.

---

# 17. AI Analysis Flow

The complete AI analysis pipeline is:

```text
             Revenue Case
                  │
                  ▼
       Reclaim Web Application
                  │
                  │ case + intervention
                  ▼
          POST /analyze
                  │
                  ▼
       FastAPI AI Service
                  │
                  ▼
        Prompt Construction
                  │
                  ▼
             Ollama
                  │
                  ▼
             Qwen 3:4B
                  │
                  ▼
          Structured JSON
                  │
                  ▼
        Pydantic Validation
                  │
                  ▼
     Recommendation Validation
                  │
                  ▼
        Final AI Analysis
                  │
                  ▼
       Reclaim Web Application
```

---

# 18. Why the Prompt Matters

The prompt is not simply asking the model:

```text
"What should we do?"
```

Instead, the application gives the model the context and constraints it is expected to follow.

The prompt establishes:

```text
Specific Case
+
Authoritative Risk Score
+
Authoritative Intervention
+
Allowed Actions
+
Customer Message Constraints
+
Execution Restrictions
```

The model is therefore operating inside an application-defined boundary.

This is especially important in a recovery system because the model's role is to provide useful reasoning and communication without being granted unrestricted control.

---

# 19. AI Testing

The service includes an analyzer test using a representative case.

The test verifies:

```text
case_id
risk_score
recommendation
diagnosis
reason
customer_message
confidence
```

The test also validates that the recommendation belongs to the supported recovery action set.

The confidence value is required to remain between:

```text
0.0
```

and:

```text
1.0
```

The customer message is also required to be a non-empty string.

---

# 20. Service Containerization

The AI service uses a lightweight Python container.

The Docker build process is:

```text
python:3.12-slim
       ↓
Copy requirements.txt
       ↓
Install dependencies
       ↓
Copy app/
       ↓
Expose 8000
       ↓
Start Uvicorn
```

The container starts with:

```text
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

# 21. Why the Model Is Outside the Container

The Docker image contains the AI application, not the model weights.

The architecture is:

```text
┌──────────────────────────┐
│      AI Container        │
│                          │
│ FastAPI                  │
│ Analyzer                 │
│ Pydantic                 │
│ Ollama Client            │
└─────────────┬────────────┘
              │
              │ HTTP
              ▼
┌──────────────────────────┐
│     Host Machine         │
│                          │
│ Ollama                   │
│ Qwen 3:4B                │
└──────────────────────────┘
```

This keeps the application container focused on the service logic and avoids packaging the model itself into the Docker image.

---

# 22. Relationship With the Recovery System

The AI service is one part of a larger recovery architecture.

```text
                  CASE
                   │
                   ▼
             Risk Context
                   │
                   ▼
        Intervention Engine
                   │
                   ▼
          Recovery Plan
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
      AI Analysis      Execution Layer
          │                 │
          ▼                 ▼
     Explanation       Executed /
     Messaging         Stopped /
                       Escalated
                              │
                              ▼
                            Audit
                              │
                              ▼
                            MySQL
```

The AI service enriches the recovery workflow but does not replace the deterministic recovery and execution layers.

---

# 23. What Makes the AI Layer Useful

The AI component is intentionally focused rather than artificially expanded.

It provides capabilities that deterministic rules are not particularly good at expressing:

```text
Case Diagnosis
Natural-Language Reasoning
Confidence
Customer Communication
```

Meanwhile, deterministic application logic handles the parts where strict consistency matters:

```text
Risk Authority
Intervention
Eligibility
Execution
Audit
```

This creates a practical division of labor:

```text
Code handles control.
AI handles interpretation and communication.
```

---

# 24. Service Boundary Summary

The Reclaim AI Service can be summarized as:

```text
INPUT
  │
  ├── Case Data
  └── Authoritative Intervention
        │
        ▼
PROCESSING
        │
        ├── Prompt Constraints
        ├── Ollama
        ├── Qwen 3:4B
        ├── Structured Output
        └── Pydantic Validation
        │
        ▼
OUTPUT
  │
  ├── Diagnosis
  ├── Recommendation
  ├── Reason
  ├── Confidence
  └── Customer Message
```

The service does not:

```text
❌ Calculate an independent authoritative risk score
❌ Execute recovery actions
❌ Move real money
❌ Directly access the MySQL database
❌ Decide which financial action the application is permitted to execute
```

---

# 25. Final Perspective

The Reclaim AI Service is deliberately small because its value comes from its **role in the architecture**, not from maximizing the amount of code inside the AI container.

It demonstrates a practical pattern for integrating an LLM into a business-critical workflow:

```text
Deterministic System
        ↓
Provides Authority
        ↓
AI
        ↓
Provides Analysis
        ↓
Deterministic System
        ↓
Controls Execution
        ↓
Persistent Audit
```

The result is an AI component that is useful without being given unrestricted control over the recovery system.

Reclaim therefore treats the LLM as an intelligence layer inside a controlled application architecture rather than as the application's source of truth.