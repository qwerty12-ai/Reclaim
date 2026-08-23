import { Case } from "@/types";
import { determineIntervention, Intervention } from "./intervention-engine";

export type RecoveryResult = {
    caseId: string;
    action: Intervention["action"];
    status: "ready" | "stopped";
    reason: string;
}

export function createRecoveryPlan(caseData: Case): RecoveryResult {
    const intervention = determineIntervention(caseData);

    if(caseData.status !== "at_risk") {
        return {
            caseId: caseData.id,
            action: intervention.action,
            status: "stopped",
            reason: "Case is not currently eligible for recovery."
        }
    }
    return {
        caseId: caseData.id,
        action: intervention.action,
        status: "ready",
        reason: intervention.reason
    }
}