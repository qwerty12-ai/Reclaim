from app.analyzer import analyze_case

test_case = {
    "id": "test-001",
    "customer_name": "Test Customer",
    "amount": "24999.00",
    "currency": "INR",
    "issue_type": "payment_failure",
    "status": "at_risk",
    "risk_score": 82,
}

result = analyze_case(test_case, "payment_retry")

if result["case_id"] != "test-001":
    raise Exception(f"Expected case_id test-001, recieved {result['case_id']}")

if result["risk_score"] != 82:
    raise Exception(f"Expected risk_score 82, recieved {result['risk_score']}")

if result["recommendation"] not in {
    "payment_retry",
    "checkout_recovery",
    "subscription_recovery",
    "manual_review"
}:
    raise Exception(f"Unexpected recovery recommendation: ",{result['recommendation']})

if result["recommendation"] != "payment_retry":
    raise Exception(f"Expected payment_ready, received {result['recommendation']}")
if not isinstance(result["diagnosis"], str):
    raise Exception("Diagnosis should be a string.")

if not isinstance(result["reason"], str):
    raise Exception("Reason should be a string.")

if not isinstance(result["customer_message"], str):
    raise Exception("Customer message should be a string.")

if not result["customer_message"].strip():
    raise Exception("Customer message should not be empty.")

if not 0.0 <= result["confidence"] <= 1.0:
    raise Exception(f"Confidence must be between 0 and 1, got {result['confidence']}")


print("Analyzer test passed: ", result)