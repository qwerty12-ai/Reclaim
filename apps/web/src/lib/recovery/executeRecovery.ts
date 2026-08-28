import { Case } from "@/types";
import { RecoveryResult } from "@/services/recovery-engine";
import { createRecoveryAudit, RecoveryAudit } from "./auditRecovery";

const ALLOWED_RECOVERY_ACTIONS = ["payment_retry","checkout_recovery","subscription_recovery"]

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
    const caseEligible = caseData.status === "at_risk";
    const planReady = recoveryPlan.status === "ready";

    if(!caseEligible) {
        execution = {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Case is no longer eligible for recovery."
        };
    }
    else if(!planReady) {
        execution = {
            caseId: caseData.id,
            action: recoveryPlan.action,
            status: "stopped",
            amountRecovered: 0,
            reason: "Recovery plan is not ready for execution."
        }
    } else {
        // Bounded recovery actions
        if(!ALLOWED_RECOVERY_ACTIONS.includes(recoveryPlan.action)) {
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
                reason: `Recovery action ${recoveryPlan.action} executed successfully in execution.`
            }
        }
    }

    const audit = createRecoveryAudit(execution);

    return {
        ...execution,
        audit
    }

}