import { Case } from "@/types";

export type Intervention = {
    action: string;
    reason: string;
}

export function determineIntervention(caseData: Case): Intervention {
    if(caseData.issue_type === "payment_failure") {
        return {
            action: "payment_retry",
            reason: "Payment failure may be recoverable through a retry."
        }
    }
    if(caseData.issue_type === "checkout_abandonment") {
        return {
            action: "checkout_recovery",
            reason: "Customer abandoned checkout before completing payment."
        }
    }
    if(caseData.issue_type === "subscription_failure") {
        return {
            action: "subscription_recovery",
            reason: "Subscription payment failure requires recovery intervention."
        }
    }
    return {
        action: "manual_review",
        reason: "No automated intervention is defined for this issue type."
    }
}