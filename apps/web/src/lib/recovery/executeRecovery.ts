import { Case } from "@/types";
import { RecoveryResult } from "@/services/recovery-engine";

export type RecoveryExecutionResult = {
    caseId: string;
    action: string;
    status: "executed" | "stopped";
    amountRecovered: number;
    reason: string;
}

export function executeRecovery(caseData:Case, recoveryPlan:RecoveryResult):RecoveryExecutionResult {
    if(caseData.status !== "at_risk") {
        return {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Case is no longer eligible for recovery."
        }
    }
    if(recoveryPlan.status !== "ready") {
        return {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Recovery plan is not ready for execution."
        }
    }

    // Bounded recovery actions
    const allowedActions = ["payment_retry", "checkout_recovery", "subscription_recovery"]

    if(!allowedActions.includes(recoveryPlan.action)) {
        return {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Recovery action is not supported for automated execution."
        }
    }

    return {
        caseId: caseData.id,
        action: recoveryPlan.action,
        status: "executed",
        amountRecovered: 0,
        reason: `Recovery action ${recoveryPlan.action} executed and awaiting payment confirmation.`
    }
}