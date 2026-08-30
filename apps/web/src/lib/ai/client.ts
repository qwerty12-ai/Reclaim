import {Case, AIAnalysis} from "@/types";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export async function analyzeCase(caseData: Case, interventionAction: string): Promise<AIAnalysis> {
    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ...caseData,
            intervention_action: interventionAction
        })
    });
    if(!response.ok) {
        throw new Error(`AI service request failed with status ${response.status}`);
    }

    return response.json();
}