import db from "@/lib/db";
import { determineIntervention } from "@/services/intervention-engine";
import { createRecoveryPlan } from "@/services/recovery-engine";
import { analyzeCase } from "@/lib/ai/client";
import { Case } from "@/types";
import { calculateRisk } from "@/services/risk-engine";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {caseId} = body;

        if(!caseId) {
            return Response.json({
                message: "caseId is required",
            }, {status: 400});
        }

        const [rows] = await db.query(`
            SELECT 
                id,
                customer_name,
                amount,
                currency,
                issue_type,
                status,
                risk_score
            FROM cases WHERE id=?
        `, [caseId])

        const cases = rows as Case[];

        if(cases.length === 0) {
            return Response.json(
                {message: "Case not found"},
                {status: 404}
            )
        }

        const recoveryCase = cases[0]

        const calculatedRisk = calculateRisk(recoveryCase);
        const caseWithCalculatedRisk: Case = {
            ...recoveryCase,
            risk_score: calculatedRisk
        }
        const intervention = determineIntervention(caseWithCalculatedRisk);
        const recoveryPlan = createRecoveryPlan(caseWithCalculatedRisk);
        const aiAnalysis = await analyzeCase(caseWithCalculatedRisk);

        return Response.json({
            status: recoveryPlan.status,
            case: caseWithCalculatedRisk,
            risk: calculatedRisk,
            intervention,
            recover: recoveryPlan,
            ai: aiAnalysis
        });
    } catch (error) {
        console.error("Recovery request failed: ", error);
        return Response.json({
            message: "Recovery request failed."
        }, {status: 500})
    }
}