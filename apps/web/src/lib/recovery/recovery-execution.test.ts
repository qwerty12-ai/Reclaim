import { Case } from "@/types";
import { RecoveryResult } from "../../services/recovery-engine";
import { executeRecovery } from "./executeRecovery";

const baseCase: Case = {
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
const readyPlan: RecoveryResult = {
    caseId: "test-001",
    action: "payment_retry",
    status: "ready",
    reason: "Payment failure may be recoverable through a retry."
}
const execution = executeRecovery(baseCase, readyPlan);
if (execution.status !== "executed") {
    throw new Error(
        `Expected executed, received ${execution.status}`
    );
}
if (execution.action !== "payment_retry") {
    throw new Error(
        `Expected payment_retry, received ${execution.action}`
    );
}
if (execution.amountRecovered !== 24999) {
    throw new Error(
        `Expected amountRecovered to be 0 before payment confirmation, received ${execution.amountRecovered}`
    );
}
console.log("Recovery execution test passed:", execution);


const recoveringCase: Case = {
    ...baseCase,
    status: "recovering"
};
const stoppedExecution = executeRecovery(
    recoveringCase,
    readyPlan
);
if (stoppedExecution.status !== "stopped") {
    throw new Error(
        `Expected stopped, received ${stoppedExecution.status}`
    );
}
if (stoppedExecution.amountRecovered !== 0) {
    throw new Error(
        `Expected stopped recovery to recover ₹0, received ${stoppedExecution.amountRecovered}`
    );
}
console.log(
    "Recovery execution stopping test passed:",
    stoppedExecution
);


const unsupportedPlan: RecoveryResult = {
    caseId: "test-001",
    action: "manual_review",
    status: "ready",
    reason: "Manual review required."
};
const unsupportedExecution = executeRecovery(
    baseCase,
    unsupportedPlan
);
if (unsupportedExecution.status !== "stopped") {
    throw new Error(
        `Expected stopped for unsupported action, received ${unsupportedExecution.status}`
    );
}
console.log(
    "Unsupported recovery action test passed:",
    unsupportedExecution
);


const stoppedPlan: RecoveryResult = {
    caseId: "test-001",
    action: "payment_retry",
    status: "stopped",
    reason: "Case is not currently eligible for recovery."
};
const stoppedPlanExecution = executeRecovery(
    baseCase,
    stoppedPlan
);
if (stoppedPlanExecution.status !== "stopped") {
    throw new Error(
        `Expected stopped for stopped plan, received ${stoppedPlanExecution.status}`
    );
}
console.log(
    "Stopped recovery plan test passed:",
    stoppedPlanExecution
);


console.log("All recovery execution tests passed.");