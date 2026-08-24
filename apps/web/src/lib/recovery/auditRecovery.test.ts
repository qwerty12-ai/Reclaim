import { createRecoveryAudit } from "./auditRecovery";

const executedRecovery = {
    caseId: "case-001",
    action: "payment_retry",
    status: "executed" as const,
    amountRecovered: 0,
    reason: "Recovery action executed and awaiting payment confirmation."
};

const executedAudit = createRecoveryAudit(executedRecovery);

if (executedAudit.caseId !== "case-001") {
    throw new Error(
        `Expected caseId case-001, received ${executedAudit.caseId}`
    );
}

if (executedAudit.action !== "payment_retry") {
    throw new Error(
        `Expected payment_retry, received ${executedAudit.action}`
    );
}

if (executedAudit.status !== "executed") {
    throw new Error(
        `Expected executed, received ${executedAudit.status}`
    );
}

if (executedAudit.amountRecovered !== 0) {
    throw new Error(
        `Expected amountRecovered 0, received ${executedAudit.amountRecovered}`
    );
}

if (
    executedAudit.reason !==
    "Recovery action executed and awaiting payment confirmation."
) {
    throw new Error("Unexpected audit reason.");
}

if (!executedAudit.timestamp) {
    throw new Error("Expected audit timestamp.");
}

console.log(
    "Executed recovery audit test passed: ",
    executedAudit
);



const stoppedRecovery = {
    caseId: "case-003",
    action: "subscription_recovery",
    status: "stopped" as const,
    amountRecovered: 0,
    reason: "Recovery execution stopped because the case is already in recovering status."
};

const stoppedAudit = createRecoveryAudit(stoppedRecovery);

if (stoppedAudit.caseId !== "case-003") {
    throw new Error(
        `Expected caseId case-003, received ${stoppedAudit.caseId}`
    );
}

if (stoppedAudit.status !== "stopped") {
    throw new Error(
        `Expected stopped, received ${stoppedAudit.status}`
    );
}

if (stoppedAudit.action !== "subscription_recovery") {
    throw new Error(
        `Expected subscription_recovery, received ${stoppedAudit.action}`
    );
}

if (stoppedAudit.amountRecovered !== 0) {
    throw new Error(
        `Expected amountRecovered 0, received ${stoppedAudit.amountRecovered}`
    );
}

if (!stoppedAudit.timestamp) {
    throw new Error("Expected audit timestamp.");
}

console.log(
    "Stopped recovery audit test passed: ",
    stoppedAudit
);