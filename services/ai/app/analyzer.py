from typing import Any
import os
from ollama import chat
from pydantic import BaseModel

class RecoveryAnalysis(BaseModel):
    diagnosis: str
    recommendation: str
    reason: str
    confidence: float

ALLOWED_ACTIONS = {
    "payment_retry",
    "checkout_recovery",
    "subscription_recovery",
    "manual_review"
}

def analyze_case(case: dict[str, Any]) -> dict[str, Any]:
    """
    Analyze a revenue recovery case using a local LLM through Ollama.
    """
    model = os.getenv("OLLAMA_MODEL", "qwen3:4b")

    prompt = f"""
You are the AI recovery analyst for a revenue recovery system.

Analyze the following revenue-risk case.

Case:
- Case ID: {case.get("id")}
- Customer: {case.get("customer_name")}
- Amount: {case.get("amount")} {case.get("currency")}
- Issue type: {case.get("issue_type")}
- Status: {case.get("status")}
- Risk score: {case.get("risk_score", 0)}

Determine:
1. What is happening with this case?
2. Which recovery action is most appropriate?
3. Why is that action appropriate?
4. How confident are you?

You may ONLY recommend one of these actions:

- payment_retry
- checkout_recovery
- subscription_recovery
- manual_review

Do not execute any action.
Do not invent financial results.
Do not claim that money has been recovered.

Return only the requested structured response.
"""

    response = chat(model=model, messages = [{"role": "user","content": prompt}],
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
        "confidence": confidence
    }