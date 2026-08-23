import { createRecoveryPlan } from "./recovery-engine";
import { Case } from "@/types";

// engine ready test

const recoverableCase: Case = {
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

const plan = createRecoveryPlan(recoverableCase);

if(plan.status !== "ready") {
    throw new Error(`Exception ready, recieved ${plan.status}`)
}

if(plan.action !== "payment_retry") {
    throw new Error(`Expected payment_ready, recieved ${plan.action}`)
}

console.log("Recovery engine ready test passed: ", plan)

// engine stop test

const stoppedCase = {
    ...recoverableCase,
    status: "recovering"
}

const stoppedPlan = createRecoveryPlan(stoppedCase);

if(stoppedPlan.status !== "stopped") {
    throw new Error(`Excepted stopped, recieved ${stoppedPlan.status}`);
}

console.log("Recovery engine stopped test passed: ", stoppedPlan);