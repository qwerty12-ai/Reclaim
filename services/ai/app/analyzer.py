from typing import Any

def analyze_case(case: dict[str, Any]) -> dict[str, Any]:
    """
    Analyze a revenue recovery case and return structured recovery recommendations.
    """
    issue_type = case.get("issue_type")
    risk_score = case.get("risk_score", 0)

    if issue_type == "payment_failure":
        recommendation = "Retry the payment using an appropriate recovery flow."
    elif issue_type == "checkout_abandonment":
        recommendation = "Send a targeted checkout recovery message."
    elif issue_type == "subscription_failure":
        recommendation = "Attempt subscription payment recovery."
    else:
        recommendation = "Review the case for an appropriate recovery action."

    return {
        "case_id": case.get("id"),
        "risk_score": risk_score,
        "recommendation": recommendation,
        "reason": f"Recovery recommendation generated for {issue_type}."
    }