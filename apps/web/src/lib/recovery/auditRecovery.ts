export type RecoveryAudit = {
    caseId: string;
    action: string;
    status: "executed" | "stopped" | "escalated";
    amountRecovered: number;
    reason: string;
    timestamp: string;
}

type RecoveryExecution = {
    caseId: string;
    action: string;
    status: "executed" | "stopped" | "escalated";
    amountRecovered: number;
    reason: string;
}

export function createRecoveryAudit(execution: RecoveryExecution): RecoveryAudit {
    return {
        caseId: execution.caseId,
        action: execution.action,
        status: execution.status,
        amountRecovered: execution.amountRecovered,
        reason: execution.reason,
        timestamp: new Date().toISOString()
    }
}