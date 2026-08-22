import { determineIntervention } from "./intervention-engine";
import { Case } from "@/types";

const paymentFailureCase: Case = {
    id: "test-001",
    customer_name: "Test Customer",
    customer_email: "test@example.com",
    amount: "24999.00",
    currency: "INR",
    issue_type: "payment_failure",
    status: "at_risk",
    risk_score: 82,
    created_at: "2026-08-23T00:00:00Z",
    updated_at: "2026-08-23T00:00:00Z"
}

const intervention = determineIntervention(paymentFailureCase)

if (intervention.action !== "payment_retry") {
    throw new Error(`Expected payment_retry, recieved ${intervention.action}`)
}

console.log("Intervention engine test passed: ", intervention);