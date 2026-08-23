import db from "@/lib/db";
import { createRecoveryPlan } from "@/services/recovery-engine";
import { Case } from "@/types";
import { calculateRisk } from "@/services/risk-engine";
import { executeRecovery } from "@/lib/recovery/executeRecovery";

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
        const recoveryPlan = createRecoveryPlan(caseWithCalculatedRisk);
        const execution = executeRecovery(caseWithCalculatedRisk, recoveryPlan)

        return Response.json({
            case: caseWithCalculatedRisk,
            risk: calculatedRisk,
            plan: recoveryPlan,
            execution
        });
    } catch (error) {
        console.error("Recovery execution failed: ", error);
        return Response.json({
            message: "Recovery execution failed."
        }, {status: 500})
    }
}