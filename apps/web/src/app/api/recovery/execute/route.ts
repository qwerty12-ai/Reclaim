import db from "@/lib/db";
import { createRecoveryPlan } from "@/services/recovery-engine";
import { Case } from "@/types";
import { executeRecovery } from "@/lib/recovery/executeRecovery";
import { time, timeStamp } from "console";

type RecoveryExecutionRecord = {
    id: string;
    case_id: string;
    action: string;
    status: string;
    amount_recovered: number;
    reason: string;
    created_at: string;
};

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

        const [existingExecutions] = await db.query(`
            SELECT 
                id,
                case_id,
                action,
                status,
                amount_recovered,
                reason,
                created_at
            FROM recovery_executions WHERE case_id=? ORDER BY created_at DESC LIMIT 1
        `, [caseId])

        const executions = existingExecutions as RecoveryExecutionRecord[];

        if (executions.length > 0) {
            const existingExecution = executions[0];
            return Response.json({
                message: "Recovery has already been executed for this case.",
                execution: {
                    caseId: existingExecution.case_id,
                    action: existingExecution.action,
                    status: existingExecution.status,
                    amountRecovered: Number(existingExecution.amount_recovered),
                    reason: existingExecution.reason,
                    audit: {
                        caseId: existingExecution.case_id,
                        action: existingExecution.action,
                        status: existingExecution.status,
                        amountRecovered: Number(existingExecution.amount_recovered),
                        reason: existingExecution.reason,
                        timeStamp: existingExecution.created_at
                    }
                },
                alreadyExecuted: true
            })
        }

        const recoveryPlan = createRecoveryPlan(recoveryCase);
        const execution = executeRecovery(recoveryCase, recoveryPlan)
        const audit = execution.audit;
        await db.query(`
            INSERT INTO recovery_executions 
                (id,
                case_id,
                action,
                status,
                amount_recovered,
                reason)
            VALUES (UUID(), ?, ?, ?, ?, ?)
        `, [
            audit.caseId,
            audit.action,
            audit.status,
            audit.amountRecovered,
            audit.reason
        ])
        return Response.json({
            case: recoveryCase,
            risk: recoveryCase.risk_score,
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

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const caseId = searchParams.get("caseId");
    try {
        let query = `
            SELECT 
                id,
                case_id,
                action,
                status,
                amount_recovered,
                reason,
                created_at
            FROM recovery_executions
        `;

        const params: string[] = [];

        if(caseId) {
            query += ` WHERE case_id=?`
            params.push(caseId);
        }
        query += ` ORDER BY created_at DESC`;

        const [rows] = await db.query(query,params)
        return Response.json({
            executions: rows,
        })
    } catch (error) {
        console.error("Failed to fetch recovery executions: ", error)
        return Response.json({
            error: "Failed to fetch recovery audit history"
        }, {status: 500})
    }
}