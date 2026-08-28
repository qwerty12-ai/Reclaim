import { Case } from "@/types";
import { RecoveryResult } from "@/services/recovery-engine";
import { createRecoveryAudit, RecoveryAudit } from "./auditRecovery";

export type RecoveryExecutionResult = {
    caseId: string;
    action: string;
    status: "executed" | "stopped";
    amountRecovered: number;
    reason: string;
    audit: RecoveryAudit;
}

export function executeRecovery(caseData:Case, recoveryPlan:RecoveryResult):RecoveryExecutionResult {
    let execution: Omit<RecoveryExecutionResult, "audit">;

    if(caseData.status !== "at_risk") {
        execution = {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Case is no longer eligible for recovery."
        };
    }
    else if(recoveryPlan.status !== "ready") {
        execution = {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Recovery plan is not ready for execution."
        }
    } else {
        // Bounded recovery actions
        const allowedActions = ["payment_retry", "checkout_recovery", "subscription_recovery"]
    
        if(!allowedActions.includes(recoveryPlan.action)) {
            execution = {
                caseId: caseData.id,
                action: recoveryPlan.action,
                status: "stopped",
                amountRecovered: 0,
                reason: "Recovery action is not supported for automated execution."
            }
        } else {
            execution = {
                caseId: caseData.id,
                action: recoveryPlan.action,
                status: "executed",
                amountRecovered: Number(caseData.amount),
                reason: `Recovery action ${recoveryPlan.action} executed sucessfully in execution.`
            }
        }
    }

    const audit = createRecoveryAudit(execution);

    return {
        ...execution,
        audit
    }

}