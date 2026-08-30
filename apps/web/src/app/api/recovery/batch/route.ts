import db from "@/lib/db";
import { Case } from "@/types";
import { createRecoveryPlan } from "@/services/recovery-engine";
import { calculateRisk } from "@/services/risk-engine";
import { executeRecovery } from "@/lib/recovery/executeRecovery";

export async function POST() {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                customer_name,
                customer_email,
                amount,
                currency,
                issue_type,
                status,
                risk_score,
                created_at,
                updated_at
            FROM cases
            ORDER BY created_at DESC
        `);
        const cases = rows as Case[];
        let revenueAtRisk = 0;
        let revenueRecovered = 0;
        let casesRecovered = 0;
        let casesStopped = 0;
        let casesEscalated = 0;
        let casesSkipped = 0;
        const executions = [];
        for(const recoveryCase of cases) {
            const [existingExecutions] = await db.query(`
                SELECT id FROM recovery_executions WHERE case_id = ? LIMIT 1
            `, [recoveryCase.id]);
            if((existingExecutions as {id: string}[]).length > 0) {
                casesSkipped += 1;
                continue;
            }
            const calculatedRisk = calculateRisk(recoveryCase);
            const caseWithCalculatedRisk: Case = {
                ...recoveryCase,
                risk_score: calculatedRisk
            }
            const recoveryPlan = createRecoveryPlan(caseWithCalculatedRisk);
            const execution = executeRecovery(caseWithCalculatedRisk, recoveryPlan);
            revenueAtRisk += Number(recoveryCase.amount);
            revenueRecovered += execution.amountRecovered;
            if (execution.status === "executed") casesRecovered += 1;
            if (execution.status === "stopped") casesStopped += 1;
            if (execution.status === "escalated") casesEscalated += 1;
            const audit = execution.audit;
            await db.query(`
                INSERT INTO 
                    recovery_executions
                    (
                        id,
                        case_id,
                        action,
                        status,
                        amount_recovered,
                        reason
                    )
                VALUES (UUID(), ?, ?, ?, ?, ?)
            `, [
                audit.caseId,
                audit.action,
                audit.status,
                audit.amountRecovered,
                audit.reason
            ])
            executions.push(execution);
        }
        const recoveryRate = revenueAtRisk > 0 ? (revenueRecovered / revenueAtRisk) * 100 : 0;
        const casesProcessed = cases.length - casesSkipped
        return Response.json({
            casesProcessed,
            casesRecovered,
            casesStopped,
            casesEscalated,
            casesSkipped,
            revenueAtRisk,
            revenueRecovered,
            recoveryRate,
            executions,
            hasNewExecutions: executions.length > 0,
            message: executions.length > 0 ? "Batch recovery completed." : "No new recovery actions were executed. All cases were already processed."
        })
    } catch (error) {
        console.error("Batch recovery failed: ", error);
        return Response.json(
            {
                message: "Batch recovery failed."
            }, {status: 500}
        )
    }
}