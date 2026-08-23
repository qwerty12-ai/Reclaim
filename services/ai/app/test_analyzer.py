from app.analyzer import analyze_case

test_case = {
    "id": "test-001",
    "customer_name": "Test Customer",
    "amount": "24999.00",
    "currency": "INR",
    "issue_type": "payment_failure",
    "status": "at_risk",
    "risk_score": 82
}

result = analyze_case(test_case)

if result["case_id"] != "test-001":
    raise Exception(f"Expected case_id test-001, recieved {result['case_id']}")
if result["risk_score"] != 82:
    raise Exception(f"Expected risk_score 82, recieved {result['risk_score']}")
if result["recommendation"] != "Retry the payment using an appropriate recovery flow.":
    raise Exception(f"Unexpected recovery recommendation.")

print("Analyzer test passed: ", result)