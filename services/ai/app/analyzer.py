from typing import Any
import os
from ollama import Client
from pydantic import BaseModel

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
client = Client(host=OLLAMA_HOST)

class RecoveryAnalysis(BaseModel):
    diagnosis: str
    recommendation: str
    reason: str
    confidence: float
    customer_message: str

ALLOWED_ACTIONS = {
    "payment_retry",
    "checkout_recovery",
    "subscription_recovery",
    "manual_review"
}

def analyze_case(case: dict[str, Any], intervention_action: str) -> dict[str, Any]:

    # Analyze a revenue recovery case using a local LLM through Ollama.

    model = os.getenv("OLLAMA_MODEL", "qwen3:4b")

    prompt = f"""
You are the AI recovery analyst for a revenue recovery system.

Analyze this specific revenue-risk case using ONLY the case data provided below.

Case:
- Case ID: {case.get("id")}
- Customer: {case.get("customer_name")}
- Amount: {case.get("amount")} {case.get("currency")}
- Issue type: {case.get("issue_type")}
- Status: {case.get("status")}
- Risk score: {case.get("risk_score", 0)}
- Authoritative intervention: {intervention_action}

The risk_score provided above is authoritative.

IMPORTANT:
- Do NOT calculate, estimate, modify, or infer a different risk score.
- Use the provided risk score exactly as given.
- Do NOT repeat the questions or instructions below as answers.
- Every response field must contain an actual answer based on this specific case.
- Do NOT invent facts that are not present in the case data.
- The authoritative intervention provided by the application must be returned exactly as the recommendation.
- Do NOT replace the authoritative intervention with another recovery action.

Determine the following:

1. diagnosis:
   Give a concise, factual explanation of what is happening with this specific case.

2. recommendation:
   Return the authoritative intervention provided by the application.
   DO NOT select a different recovery action.
   The authoritative intervention is: {intervention_action}

3. reason:
   Explain why that recovery action is appropriate for this specific case.

4. confidence:
   Return a number between 0.0 and 1.0 representing your confidence in the recommendation.

5. customer_message:
   Write the actual short, professional message that could be shown directly to the customer.
   Do not describe how to write the message.
   Do not output instructions for creating the message.
   Output the message itself.

Allowed recovery actions:
- payment_retry
- checkout_recovery
- subscription_recovery
- manual_review

Customer message requirements:
- Address the customer directly.
- Be concise and professional.
- Explain the relevant issue appropriately.
- Do not mention the internal risk score.
- Do not mention internal system details.
- Do not mention AI.
- Do not claim that money has already been recovered.
- Do not guarantee that the payment will succeed.

Do not execute any recovery action.
Do not invent financial results.
Do not claim that any money has been recovered.

Return only the structured response.
"""

    response = client.chat(model=model, messages = [{"role": "user","content": prompt}],
    think=False,
    format=RecoveryAnalysis.model_json_schema(),
    options={"temperature": 0,}
    )

    analysis = RecoveryAnalysis.model_validate_json(response.message.content)

    recommendation = analysis.recommendation

    # The LLM can recommend, but it cannot introduce an unsupported recovery action.
    if recommendation not in ALLOWED_ACTIONS:
        recommendation = "manual_review"

    confidence = max(0.0, min(1.0, analysis.confidence))

    return {
        "case_id": case.get("id"),
        "risk_score": case.get("risk_score", 0),
        "diagnosis": analysis.diagnosis,
        "recommendation": recommendation,
        "reason": analysis.reason,
        "confidence": confidence,
        "customer_message": analysis.customer_message
    }