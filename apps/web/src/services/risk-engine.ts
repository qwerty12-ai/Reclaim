import { Case } from "@/types";

export function calculateRisk(caseData: Case): number {
    let score = 0;
    if(caseData.issue_type === "payment_failure") {
        score += 40;
    }
    if(caseData.issue_type === "checkout_abandonment") {
        score += 25;
    }
    if(caseData.issue_type === "subscription_failure") {
        score += 30
    }
    if(Number(caseData.amount) >= 20000) {
        score += 20;
    }
    if(Number(caseData.amount) >= 50000) {
        score += 20;
    }
    return Math.min(score, 100);
}